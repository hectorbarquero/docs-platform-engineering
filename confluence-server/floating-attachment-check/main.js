(async () => {
  const CONFIG = {
    rateMs: 1200,
    limit: 50,
    logEvery: 10,

    // replace these before running with your space keys.
    spaceKeys: ["SPACE1", "SPACE2"],

    // set manually here if Confluence isn't mounted at /confluence.
    contextPath: "/confluence",

    outputFilename: "confluence-unused-attachments.csv"
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const baseUrl = `${location.origin}${CONFIG.contextPath}`;

  async function getJson(url) {
    const response = await fetch(url, {
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText}: ${url}`
      );
    }

    const data = await response.json();
    await sleep(CONFIG.rateMs);

    return data;
  }

  async function* paginate(url) {
    let start = 0;
    let pageNumber = 0;

    while (true) {
      const requestUrl = new URL(url, location.origin);

      requestUrl.searchParams.set("start", start);
      requestUrl.searchParams.set("limit", CONFIG.limit);

      pageNumber++;

      const data = await getJson(requestUrl.toString());
      const results = data.results || [];

      if (pageNumber % CONFIG.logEvery === 0) {
        console.log(
          `Fetched REST page ${pageNumber}, ` +
          `start=${start}, batch=${results.length}`
        );
      }

      for (const result of results) {
        yield result;
      }

      if (results.length < CONFIG.limit) {
        break;
      }

      start += CONFIG.limit;
    }
  }

  function decode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  const attachmentMacroPattern =
    /ri:attachment\b[^>]*\bri:filename="([^"]+)"/gi;

  const attachmentUrlPattern =
    /\/download\/attachments\/\d+\/([^"?<#]+)/gi;

  function extractReferencedAttachments(storage) {
    const filenames = new Set();

    if (!storage) {
      return filenames;
    }

    for (const match of storage.matchAll(attachmentMacroPattern)) {
      filenames.add(decode(match[1]));
    }

    for (const match of storage.matchAll(attachmentUrlPattern)) {
      filenames.add(decode(match[1]));
    }

    return filenames;
  }

  function csvEscape(value) {
    const stringValue = String(value ?? "");

    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  }

  function downloadCsv(filename, rows) {
    if (!rows.length) {
      console.warn("No rows to export.");
      return;
    }

    const headers = Object.keys(rows[0]);

    const lines = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(header => csvEscape(row[header])).join(",")
      )
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8"
    });

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(objectUrl);
  }

  function buildAttachmentCql(spaceKeys) {
    if (!spaceKeys.length) {
      throw new Error("CONFIG.spaceKeys must contain at least one space key.");
    }

    const spaceClause =
      spaceKeys.length === 1
        ? `space="${spaceKeys[0]}"`
        : `space IN (${spaceKeys
            .map(key => `"${key}"`)
            .join(",")})`;

    return `${spaceClause} AND type=attachment`;
  }

  console.log("Phase 1: collecting attachments by page.");

  const cql = buildAttachmentCql(CONFIG.spaceKeys);

  const attachmentSearchUrl =
    `${baseUrl}/rest/api/content/search` +
    `?cql=${encodeURIComponent(cql)}` +
    `&expand=container,space,extensions`;

  const pages = new Map();
  let attachmentCount = 0;

  for await (const attachment of paginate(attachmentSearchUrl)) {
    attachmentCount++;

    const pageId = attachment?.container?.id;
    const pageTitle = attachment?.container?.title || "Unknown";
    const spaceKey = attachment?.space?.key || "Unknown";
    const filename = decode(attachment?.title || "");
    const sizeBytes = Number(
      attachment?.extensions?.fileSize ?? 0
    );

    if (!pageId || !filename) {
      continue;
    }

    if (!pages.has(pageId)) {
      pages.set(pageId, {
        pageId,
        pageTitle,
        spaceKey,
        attachments: []
      });
    }

    pages.get(pageId).attachments.push({
      filename,
      sizeBytes
    });

    if (attachmentCount % 500 === 0) {
      console.log(
        `Processed ${attachmentCount} attachments across ` +
        `${pages.size} pages.`
      );
    }
  }

  console.log(
    `Phase 1 complete: ${attachmentCount} attachments across ` +
    `${pages.size} pages.`
  );

  console.log("Phase 2: comparing attachments with page storage.");

  const results = [];
  let pageCount = 0;

  for (const page of pages.values()) {
    pageCount++;

    const pageUrl =
      `${baseUrl}/rest/api/content/${page.pageId}` +
      `?expand=body.storage,title`;

    const pageData = await getJson(pageUrl);
    const storage = pageData?.body?.storage?.value || "";

    const referencedNames =
      extractReferencedAttachments(storage);

    const attachedNames = [
      ...new Set(
        page.attachments.map(attachment => attachment.filename)
      )
    ];

    const unusedNames = attachedNames.filter(
      filename => !referencedNames.has(filename)
    );

    const usedNames = attachedNames.filter(
      filename => referencedNames.has(filename)
    );

    const totalBytes = page.attachments.reduce(
      (sum, attachment) => sum + attachment.sizeBytes,
      0
    );

    const unusedBytes = page.attachments
      .filter(
        attachment => !referencedNames.has(attachment.filename)
      )
      .reduce(
        (sum, attachment) => sum + attachment.sizeBytes,
        0
      );

    results.push({
      pageId: page.pageId,
      spaceKey: page.spaceKey,
      pageTitle: page.pageTitle,
      storedAttachmentCount: attachedNames.length,
      referencedAttachmentCount: usedNames.length,
      unusedAttachmentCount: unusedNames.length,
      totalBytes,
      unusedBytes,
      unusedFilenames: unusedNames.join(" | ")
    });

    if (pageCount % 100 === 0) {
      console.log(
        `Checked ${pageCount}/${pages.size} pages.`
      );
    }
  }

  const sortedResults = results.sort((a, b) => {
    if (b.unusedBytes !== a.unusedBytes) {
      return b.unusedBytes - a.unusedBytes;
    }

    return b.unusedAttachmentCount - a.unusedAttachmentCount;
  });

  const pagesWithUnusedAttachments = sortedResults.filter(
    result => result.unusedAttachmentCount > 0
  );

  console.log(`Checked ${results.length} pages.`);
  console.log(
    `${pagesWithUnusedAttachments.length} pages contain ` +
    "potentially unused attachments."
  );

  console.table(pagesWithUnusedAttachments.slice(0, 50));

  // Expose results for additional browser-console analysis.
  window.confluenceAttachmentAudit = {
    allPages: sortedResults,
    pagesWithUnusedAttachments
  };

  downloadCsv(
    CONFIG.outputFilename,
    pagesWithUnusedAttachments
  );
})();