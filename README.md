# jasql - JSON document storage in SQL for node.js

## ![jasql](resources/logo-200px.png) node.js + JSON + SQL = bliss

[![Build Status](https://travis-ci.org/codyzu/jasql.svg?branch=master)](https://travis-ci.org/codyzu/jasql)
[![Coverage Status](https://coveralls.io/repos/github/codyzu/jasql/badge.svg?branch=master)](https://coveralls.io/github/codyzu/jasql?branch=master)

jasql is a node.js storage library for storing schemaless documents in various relational databases.
Built on knex, jasql supports sqlite3, ~~postgre~~, ~~mysql~~, ~~oracle~~, and ~~mssql~~.
The API is heavily inspired by pouchdb and is intuitive and designed to be rapidly used in applications exporting REST APIs.

_support for the missing databases above is coming soon!_

# Motivation

Why not just used mongodb?

Sometimes client and/or infastructure requirements simple don't allow us to choose any database we want.
Enterprises often have DBA's and contracts for using one of the big database names.
Until now, node.js support for the big relational databases was very limited.
That time is over... jasql lets you continue focusing on functionality and keeps the dirty SQL details out of your way.

# Usage

```javascript
const Jasql = require('jasql')

const jasql = new Jasql()

jasql.initialize()
  .then(() => jasql.create({
      _id: 'artist/Claude Francois/album/Best Of',
      country: 'France',
      year: 1970
    }))
  .then(() => jasql.list('artist/%'))
  .then((artists) => console.log(artists))
```

# Indexes

By default, jasql supports a single indexed field names `_id`.
This can be any string up to 255 characters.
If you don't define this id, jasql will generate a nice random one for you.

However, don't be limited by randow ids!
Need documents sorted by date? Try storing the ISO date in the id.
Prefix your ids with the type of the document. This makes retrieving all documents of a given type super easy.

# Roadmap

* implement missing db drivers
* add search functionality
* investigate improved indexing
