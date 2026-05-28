(async () => {
  const LIMIT = 25;
  const RATE_MS = 750; //barquerohr: hand brake for server
  const rows = [];

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const base = location.origin + location.pathname.split("/").slice(0, 2).join("/");

  async function getText(url) {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
    return res.text();
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
    return res.json();
  }

  async function getAllSpaces() {
    const spaces = [];
    let start = 0;

    while (true) {
      const apiUrl =
        `${base}/rest/api/space?` +
        `limit=${LIMIT}&start=${start}`;

      const data = await getJson(apiUrl);
      spaces.push(...data.results);

      console.log(`Loaded ${spaces.length} spaces...`);

      if (!data._links?.next) break;
      start += LIMIT;
      await sleep(RATE_MS);
    }

    return spaces;
  }

  const spaces = await getAllSpaces();

  for (const space of spaces) {
    const SPACE = space.key;
    let start = 0;

    console.log(`Scanning space ${SPACE}: ${space.name}`);

    while (true) {
      const apiUrl =
        `${base}/rest/api/content?` +
        `spaceKey=${encodeURIComponent(SPACE)}` +
        `&type=page&limit=${LIMIT}&start=${start}`;

      const data = await getJson(apiUrl);

      for (const page of data.results) {
        const pageUrl = `${base}${page._links.webui}`;
        const html = await getText(pageUrl);

        const doc = new DOMParser().parseFromString(html, "text/html");
        const createLinks = [...doc.querySelectorAll("a.createlink")];

        for (const a of createLinks) {
          const href = a.getAttribute("href") || "";
          const url = new URL(href, location.origin);

          rows.push({
            spaceKey: SPACE,
            spaceName: space.name,
            sourceTitle: page.title,
            sourceId: page.id,
            sourceUrl: pageUrl,
            missingTitle: url.searchParams.get("title") || a.textContent.trim(),
            linkText: a.textContent.trim(),
            fromPageId: url.searchParams.get("fromPageId"),
          });

          console.log("Undefined:", a.textContent.trim(), "from", `${SPACE}: ${page.title}`);
        }

        await sleep(RATE_MS);
      }

      console.log(`Scanned ${SPACE}: ${start + data.results.length} pages...`);

      if (!data._links?.next) break;
      start += LIMIT;
      await sleep(RATE_MS);
    }
  }

  console.table(rows);
  console.log(`Done. Found ${rows.length} rendered createlinks site-wide.`);

  // downloader i borrowd from other script
  const csv = [
    Object.keys(rows[0] || {
      spaceKey: "", spaceName: "", sourceTitle: "", sourceId: "",
      sourceUrl: "", missingTitle: "", linkText: "", fromPageId: "", rawHref: ""
    }).join(","),
    ...rows.map(r =>
      Object.values(r).map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `site-wide-rendered-createlinks.csv`;
  a.click();
})();