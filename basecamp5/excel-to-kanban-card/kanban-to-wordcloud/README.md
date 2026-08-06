# Basecamp kanban export and word cloud
--- 

> Summary: This tool exports all loaded Basecamp kanban cards to CSV and creates an HTML word cloud from card titles.

## About the tool
++++++++++++++++++++++

The script scrolls the board and its columns so Basecamp loads lazy-loaded cards.

    + It exports each card title, link, date, and year to kanban-export-all.csv.

    + It removes duplicate cards before exporting.

    + It creates kanban-wordcloud-all.html using the most common words found in card titles.

    + The script does not require a PAT, API key, or Basecamp API access.

## To use the tool
++++++++++++++++++++

1. Navigate to the Basecamp kanban board in your web browser.

2. Open the developer console.

3. Paste and run main.js.

4. Wait for the card-loading passes to finish.

5. Open the downloaded .csv and .html files from File Explorer or Finder.

### !!! Important !!!
+++++++++++++++++++++++

- The script only exports cards that Basecamp loads into the page.

- The generated CSV contains real card titles and direct card links.

- The generated HTML contains words taken from real card titles.

- Do not publish generated files from a private board.