# Word finder for Confluence server

> This program is a simple node.js utility i wrote for checking .md files against a word list. You can use this to find bad words, key words, or any desired search term against a large wiki repo, if you have the .md output of it.

This script reads a list of words from `words.txt`, scans one or more .md files, and writes matching results to `hits.txt`.

it's used for lightweight documentation review, such as finding deprecated terms, banned terms, product names, style-guide issues, or words that need manual review.

## Requirements

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