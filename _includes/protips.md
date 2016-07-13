# Ids and Indexes

By default, jasql supports a single indexed field named `_id`.
This can be any string up to 255 characters.
If you don't define this id, jasql will generate a nice random one for you.

However, **don't be limited by random ids!**

:bulb: Prefix your ids with the type of the document, i.e. `users/Cody`. This makes retrieving all documents of a given type super easy `jasql.list({id:'users/%'})`.

:bulb: Need documents sorted by date? Try using `new Date().toJSON()` in the id. When you list them, they will be sorted chronologically!


# Compatibility

jasql is tested and verified on the latest releases of **Node v4, v5, and v6**. If you need to support another version of node, create an issue or even better a pull request!


# Installation

Install using npm:
```
npm install jasql
```

**One of the supported database drivers should also installed!**

* `sqlite3` for Sqlite3 support
* `pg` for postres support

:warning: The above dependencies are marked as optionalDependencies in the package.json. This means npm will try to install them all, and continue happily even if they fail. One is required, feel free to uninstall the dependencies ones you don't use.


# Motivation (why not mongodb?)

Why not just used mongodb?

Sometimes client and/or infrastructure requirements simple don't allow us to choose any database we want.
Enterprises often have DB Admins, contracts, infrastructure, and proven expertise in one of the big database names.
Until now, node.js support for the big relational databases was very limited.
That time is over...
**jasql lets you continue focusing on functionality and keeps the dirty SQL details out of your way!**
