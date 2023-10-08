---
description: The concepts around which buddy is built
---

# Core concepts

## Show everything

From the browsable datasheets, no data is excluded. Meaning, buddy shows more than what is available in the game including playtest data.

## Show raw data

While in some sections buddy tries to present data as pretty as possible, some sections intentionally display raw data.

## Link to NWDB

NWDB is the most complete and accurate database and the place to go for details that are coherent with ingame rules. Wherever possible buddy tries to place two links

* one internal, for further exploration on nw-buddy.de
* one external, for further exploration on nwdb.info

For example all icons in a database table show the nwdb tooltip and link to that item on nwdb

<figure><img src="../.gitbook/assets/nwdb-link-from-table.png" alt=""><figcaption><p>Icon with nwdb tooltip that links to nwdb.info</p></figcaption></figure>

Item headers have same concept for the item icon, while the title has the internal link.

<figure><img src="../.gitbook/assets/nwdb-link-from-detail.png" alt=""><figcaption><p>Icon with nwdb tooltip and title with internal link</p></figcaption></figure>

## Keep it serverless

Well, kind of. All website data is served from static files, there is no further server side logic. Whole magic happens inside the application in the browser. That means the website is heavy. Clicking through all tables easily lets the browser download 20mb on compressed JSON files which is 200mb uncompressed in memory.

