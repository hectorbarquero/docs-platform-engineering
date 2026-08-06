Floating attachment checks
---

> Summary: Attachments deleted from the body.storage of a page can still appear in the attachment ./bin. These are floating when they're in the database, but aren't connected to any page. This script finds those and generates a .csv so the technical writer can remove them.


## About the problem
++++++++++++++++++++++
    + A user may add an image to their documentation, and over time the image is either updated or deleted.

    + The original remains and persists in the page attachment bin, not the body storage.

    + The page and wiki pays for this resource, despite it not being used and "floating".

    + There is no Confluence tool to detect these automatically, so this script finds those and generates a .csv that a technical writer can use to remove floating attachments.

    + These floating attachmants impact storage disk space on server, impacting cost quoting for cloud. They also consume resources during Apache FOP export processes. It's best to only have what you need in your wiki.


## To use the tool
++++++++++++++++++++

1. Navigate to your wiki in your web browser.

2. Run the tool from a dev console in your web browser.

3. Open the .csv from your File Explorer or Finder.