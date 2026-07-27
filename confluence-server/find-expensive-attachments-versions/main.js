(async () => {
  const BASE = `${location.origin}/confluence/rest/api`; //barquerohr: checking if path works
  const PAGE_LIMIT = 25;
  const ATT_LIMIT = 200;
  const SLEEP_MS = 1000; // 1 req per sec bc server node, go slow. handbrake here

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function getJson(url) {
    const r = await fetch(url, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    const text = await r.text();

    if (!r.ok) {
      throw new Error(`${r.status} ${url}\n${text.slice(0, 200)}`);
    }

    return JSON.parse(text);
  }

  async function getAllAttachments(pageId) {
    let all = [];
    let start = 0;

    while (true) {
      const data = await getJson(
        `${BASE}/content/${pageId}/child/attachment?limit=${ATT_LIMIT}&start=${start}&expand=version`
      );

      const results = data.results || [];
      all.push(...results);

      await sleep(SLEEP_MS);

      if (results.length < ATT_LIMIT) break;
      start += ATT_LIMIT;
    }

    return all;
  }

  const report = [];
  let start = 0;

  while (true) {
    const data = await getJson(
      `${BASE}/content/search?cql=type=page&limit=${PAGE_LIMIT}&start=${start}`
    );

    const pages = data.results || [];
    if (!pages.length) break;

    for (const page of pages) {
      try {
        const atts = await getAllAttachments(page.id);

        const attachmentCount = atts.length;
        const totalAttachmentVersions = atts.reduce(
          (sum, a) => sum + (a.version?.number || 1),
          0
        );

        report.push({
          pageId: page.id,
          title: page.title,
          attachments: attachmentCount,
          totalAttachmentVersions,
          avgVersionsPerAttachment: attachmentCount
            ? (totalAttachmentVersions / attachmentCount).toFixed(1)
            : "0"
        });

        console.log(
          `[${report.length}]`,
          page.title,
          "attachments:",
          attachmentCount,
          "versions:",
          totalAttachmentVersions
        );

      } catch (e) {
        console.warn("failed page:", page.id, page.title, e.message);
      }
    }

    start += PAGE_LIMIT;
    console.log("pages scanned:", start);

    await sleep(SLEEP_MS);

    if (pages.length < PAGE_LIMIT) break;
  }

  report.sort((a, b) =>
    b.totalAttachmentVersions - a.totalAttachmentVersions
  );

  console.table(report.slice(0, 100));

  const csv = [
    "pageId,title,attachments,totalAttachmentVersions,avgVersionsPerAttachment",
    ...report.map(r =>
      [
        r.pageId,
        `"${String(r.title).replaceAll('"', '""')}"`,
        r.attachments,
        r.totalAttachmentVersions,
        r.avgVersionsPerAttachment
      ].join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sitewide-attachment-history-report.csv";
  a.click();

  console.log("done. csv exported.");
})();