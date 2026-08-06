Broken link checks
---

> Summary: This tool finds broken links in your instance, when the links don't show in the default Confluence link checker.


## About the problem
++++++++++++++++++++++
    + If in your wiki instance there's broken <ri:> links, you'll need to rely on running a re-index to have the default tool detect them.

    + Depending on the page authoring date, it might fail to find them if the page was authored from v5.3 or older, since that schema is corrupt when users are using 8.5.7-9.2+ LTS

    + This tool detects all broken page links, regardless of year of authoring.

    + Failure to resolve these links creates broken exports and undefined pages.


## To use the tool
++++++++++++++++++++

1. Navigate to your wiki in your web browser.

2. Run the tool from a dev console in your web browser.

3. Open the .csv from your File Explorer or Finder.