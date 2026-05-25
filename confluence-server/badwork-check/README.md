# Word finder for Confluence server

> This program is a simple node.js utility i wrote for checking .md files against a word list. You can use this to find bad words, key words, or any desired search term against a large wiki repo, if you have the .md output of it.

This script reads a list of words from `words.txt`, scans one or more .md files, and writes matching results to `hits.txt`.

it's used for lightweight documentation review, such as finding deprecated terms, banned terms, product names, style-guide issues, or words that need manual review.

When we export wiki's, we can automate some of the maintenance of docs to improve speed and cost. This means rather than pushing thousands of manual updates, we can work the changes in .xml and re-submit.|

## Requirements

You need to use pandoc to convert the wiki .html to .md, or go export > .pdf > pandoc to .html > pandoc to .md.

Use a .txt for the input. Modify the code to handle xml instead if desired.

format of input: words.txt
format of files to read (exports): filename1.md, filename2.md

to add new exports, add new process functions. Copy existing process functions, change project key name, and add them to the combine array in the combine section.



- node.js
- A `words.txt` file
- One or more Markdown files to scan. Ideally run this with two, but you can do more with some slight adjustments

## Files

Expected input files:
Change these filenames to suit your needs, for example if it's marketing, go marketing.md instead of filename1

```txt
words.txt
filename1.md
filename2.md