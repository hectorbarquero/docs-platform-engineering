# Instructions
---

> Works on Confluence Server 5.4.7 to 8.5.7 LTS+. Requires the {html} macro to be toggled on, so ideally only useful if your site is internal. Use of this macro is not recommended for external wiki's.

## About
This macro allows you to apply a sticky table of contents which follows the user within the bounds of the browser window as they scroll through long pages. It captures headings at the page level. 

+ The macro is built on standard HTML, but must be contained in Atlassian's {html} macro.
+ Works on server 5.4.7 to 8.5.7 LTS+.
+ Must be used in a two-pane page layout. It calculates position of columnLayout2 .cell and won't work in other layouts without modifying that selector.
+ This still depends on the {table-of-contents} macro in confluence, but adds additional styling and functionality.

## To use the macro

1. Create a new page in Confluence Server > change your page layout to columnLayout2. This is the two pane layout:

|--Page content in here which is roughly 70% of the browser--| |-- macro is in here, this is the sidebar --|

2. In the sidebar, add a {panel} macro. Place a {table-of-contents} macro in the panel.

3. Under the panel, place an {html} macro. These need to all be within the sidebar.

4. Paste the HTML and javascript from the `index.html` into the {html} macro.

5. When saved, the page has a scrollable table of contents on the sidebar which follows the user as they navigate the page.


## Known limits

+ Requires the two-pane layout, columnLayout2. This is Atlassian's two pane split layout where it's roughly 70% for the page body and 30% for the sidebar.
+ Long pages can cause overflow and z-index fighting with the page tags. Avoid long pages as documentation best practice.
+ There is no highlight implemented to indicate which heading you're currently on.
+ Long heading titles can create difficult to read table of contents. They are not linerized. Avoid long headings as a documentation best practice.
+ Requires {html} to be enabled by the site admin. Do not use this in external wiki's for security reasons. Use for internal wiki's behind a VPN or firewall only.




