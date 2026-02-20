# Advanced Confluence queries
> These work with Confluence Server 9.2.13

## Find pages using specific Macros
You can do macro searches by knowing the class selector name. If you already know the name, skip to step 3.

1. On the page, select your macro and open the context menu (right-click). Choose Inspect
2. In the Inspector (Developer Tools) window, look for the `<ul>` class which should list the `<data-macro-name`.
3. Exit the inspector, taking note of the macro name.
4. In Confluence, search:
   ```
   // replace "example" with the macro name.
    type="page" AND macroName="example"
   ```

5. The return results will show pages using that macro.


## Check pages with and without labels
Pages may outpace label governance. You can use this search to find pages without labels:

`type:page NOT labelText:[a TO z] AND NOT labelText:[0 to 9]`

Alternatively you can use this one to find pages with labels, which may need to be deleted occasionally if you're doing an overhaul.

> Overhaul deletion can do this programmatically via the REST api, but this is helpful to know how much to expect if you're programming throttles.

`type:page AND labelText:[a TO z] AND NOT labelText:[0 to 9]`


## Check pages within a date range
You can use this query to find docs within a date range, but it may pull some with **modifiedDate** in the same range. If you want a strict check for **creationDate**, use the Lucene query instead. Switch your space key to the appropriate one.

`spacekey=EXAMPLE AND created >= "2012-01-01" AND created <= "2015-12-31"`


## Lucene alternative for checking creation date
Apache Lucene can be stringed together with additional CQL if needed. Confluence uses CQL in the latest releases, and in cloud you can use blocks to have a SQL-like experience. Server 8.5.7+ is a balance of CQL and Lucene. For **creationDate**, Lucene can retrieve it and CQL can't.

`type:page AND created:[20120101 TO 20120131]`



