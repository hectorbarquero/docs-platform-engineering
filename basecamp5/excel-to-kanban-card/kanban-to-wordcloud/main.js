(async function () {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  /*
   * 1. Scroll the board and its columns so Basecamp loads
   *    any cards that are lazy-loaded.
   */
  async function loadAllCards() {
    const pageScroller = document.scrollingElement || document.documentElement;

    const originalPageTop = pageScroller.scrollTop;
    const originalPageLeft = pageScroller.scrollLeft;

    let previousCount = -1;
    let stablePasses = 0;

    for (let pass = 0; pass < 30; pass++) {
      const cards = [...document.querySelectorAll(".kanban-card")];

      // Find scrollable containers surrounding existing cards.
      const containers = new Set();

      cards.forEach(card => {
        let element = card.parentElement;

        while (element && element !== document.body) {
          const style = getComputedStyle(element);
          const canScrollVertically =
            element.scrollHeight > element.clientHeight + 10 &&
            ["auto", "scroll"].includes(style.overflowY);

          if (canScrollVertically) {
            containers.add(element);
          }

          element = element.parentElement;
        }
      });

      // Scroll each kanban column to its bottom.
      containers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });

      // Also scroll the main page to its bottom-right corner.
      pageScroller.scrollTop = pageScroller.scrollHeight;
      pageScroller.scrollLeft = pageScroller.scrollWidth;

      await sleep(800);

      const currentCount =
        document.querySelectorAll(".kanban-card").length;

      console.log(
        `Loading cards: pass ${pass + 1}, found ${currentCount}`
      );

      if (currentCount === previousCount) {
        stablePasses++;
      } else {
        stablePasses = 0;
      }

      previousCount = currentCount;

      // Stop after the count remains unchanged for three passes.
      if (stablePasses >= 3) {
        break;
      }
    }

    // Return to the original page position.
    pageScroller.scrollTop = originalPageTop;
    pageScroller.scrollLeft = originalPageLeft;
  }

  await loadAllCards();

  /*
   * 2. Scrape every loaded card.
   */
  const cards = [...document.querySelectorAll(".kanban-card")];

  const scrapedRows = cards
    .map(card => {
      const linkEl = card.querySelector(".kanban-card__link");
      const titleEl = card.querySelector(".kanban-card__title");
      const timeEl = card.querySelector(".kanban-card__meta time");

      // Only title and link are required.
      if (!linkEl || !titleEl) {
        return null;
      }

      const title = titleEl.textContent.trim();
      const link = linkEl.href;
      const date = timeEl?.getAttribute("datetime") || "";

      return {
        title,
        link,
        date,
        year: date ? date.slice(0, 4) : ""
      };
    })
    .filter(Boolean);

  /*
   * Remove duplicates. This helps if Basecamp temporarily
   * renders the same card more than once while scrolling.
   */
  const uniqueRows = new Map();

  scrapedRows.forEach(row => {
    const key = row.link || row.title;

    if (!uniqueRows.has(key)) {
      uniqueRows.set(key, row);
    }
  });

  const rows = [...uniqueRows.values()];

  console.log(`Cards in DOM: ${cards.length}`);
  console.log(`Unique cards exported: ${rows.length}`);
  console.table(rows);

  if (rows.length === 0) {
    console.error(
      "No cards were found. Check whether the Basecamp CSS selectors have changed."
    );
    return;
  }

  /*
   * 3. Create and download the CSV.
   */
  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  const csv = [
    ["title", "link", "date", "year"].map(csvCell).join(","),
    ...rows.map(row =>
      [
        row.title,
        row.link,
        row.date,
        row.year
      ].map(csvCell).join(",")
    )
  ].join("\n");

  const csvBlob = new Blob(
    ["\uFEFF", csv],
    { type: "text/csv;charset=utf-8" }
  );

  const csvUrl = URL.createObjectURL(csvBlob);
  const csvDownload = document.createElement("a");

  csvDownload.href = csvUrl;
  csvDownload.download = "kanban-export-all.csv";
  document.body.appendChild(csvDownload);
  csvDownload.click();
  csvDownload.remove();

  setTimeout(() => URL.revokeObjectURL(csvUrl), 1000);

  /*
   * 4. Count words appearing in card titles.
   */
  const ignore = new Set([
    "tutorial",
    "do",
    "conversion",
    "vs",
    "management",
    "eat",
    "not",
    "file",
    "added",
    "the",
    "to",
    "and",
    "a",
    "of",
    "in",
    "for",
    "on",
    "at",
    "with",
    "from",
    "by",
    "it",
    "is",
    "this",
    "that",
    "as",
    "be",
    "or",
    "an",
    "are",
    "was",
    "were",
    "if",
    "into",
    "out",
    "use",
    "using",
    "used",
    "how",
    "add",
    "set",
    "move",
    "up",
    "down",
    "left",
    "right",
    "mod",
    "heavy",
    "art",
    "new",
    "programming",
    "tech",
    "tools",
    "site",
    "update",
    "updates",
    "work",
    "documentation",
    "anim",
    "ui",
    "creating",
    "player",
    "content",
    "page",
    "load",
    "docs",
    "document",
    "console",
    "cmd",
    "references",
    "feature",
    "legacy",
    "planting",
    "collapse",
    "rewrite",
    "write",
    "analyze"
  ]);

  const frequency = {};

  rows.forEach(row => {
    row.title
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .map(word => word.replace(/^['-]+|['-]+$/g, ""))
      .filter(Boolean)
      .forEach(word => {
        if (ignore.has(word)) {
          return;
        }

        // Ignore numbers by themselves.
        if (/^\d+$/.test(word)) {
          return;
        }

        frequency[word] = (frequency[word] || 0) + 1;
      });
  });

  const cloud = Object.entries(frequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 200);

  /*
   * 5. Create a self-contained word-cloud HTML file.
   */
  const cloudData = JSON.stringify(cloud).replace(/</g, "\\u003c");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <title>Basecamp Kanban Word Cloud</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 40px;
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      background: #ffffff;
      color: #111111;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }

    .summary {
      margin-bottom: 32px;
      color: #555555;
    }

    #cloud {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 10px 18px;
      max-width: 1400px;
      min-height: 500px;
      margin: 0 auto;
      padding: 30px;
      border: 1px solid #dddddd;
      border-radius: 8px;
    }

    .word {
      display: inline-block;
      line-height: 1;
      white-space: nowrap;
      cursor: default;
    }

    .word:hover {
      text-decoration: underline;
    }
  </style>
</head>

<body>
  <h1>Basecamp Kanban Word Cloud</h1>

  <div class="summary">
    Generated from ${rows.length} kanban cards.
  </div>

  <div id="cloud"></div>

  <script>
    const words = ${cloudData};
    const cloud = document.getElementById("cloud");

    if (words.length === 0) {
      cloud.textContent = "No words were found.";
    } else {
      const values = words.map(word => word.value);
      const minimum = Math.min(...values);
      const maximum = Math.max(...values);

      function scaleFont(value) {
        if (minimum === maximum) {
          return 30;
        }

        const minimumSize = 14;
        const maximumSize = 64;

        return minimumSize +
          ((value - minimum) / (maximum - minimum)) *
          (maximumSize - minimumSize);
      }

      words.forEach(word => {
        const element = document.createElement("span");

        element.className = "word";
        element.textContent = word.text;
        element.style.fontSize =
          scaleFont(word.value).toFixed(1) + "px";
        element.style.fontWeight =
          word.value >= maximum * 0.6 ? "700" : "400";
        element.title =
          word.text + ": " + word.value + " occurrences";

        cloud.appendChild(element);
      });
    }
  <\/script>
</body>
</html>
`;

  const htmlBlob = new Blob(
    [html],
    { type: "text/html;charset=utf-8" }
  );

  const htmlUrl = URL.createObjectURL(htmlBlob);
  const htmlDownload = document.createElement("a");

  htmlDownload.href = htmlUrl;
  htmlDownload.download = "kanban-wordcloud-all.html";
  document.body.appendChild(htmlDownload);
  htmlDownload.click();
  htmlDownload.remove();

  setTimeout(() => URL.revokeObjectURL(htmlUrl), 1000);

  console.log(
    `Finished. Exported ${rows.length} cards and ${cloud.length} word-cloud terms.`
  );
})();