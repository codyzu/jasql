# jasql - JSON document storage in SQL for node.js

## ![jasql](resources/logo-200px.png) node.js + JSON + SQL = bliss

[![Build Status](https://travis-ci.org/codyzu/jasql.svg?branch=master)](https://travis-ci.org/codyzu/jasql)
[![Coverage Status](https://coveralls.io/repos/github/codyzu/jasql/badge.svg?branch=master)](https://coveralls.io/github/codyzu/jasql?branch=master)

jasql is a node.js storage library for storing schemaless documents in various relational databases.
Built on knex, jasql supports sqlite3, postgres, mysql, ~~oracle~~, and ~~mssql~~.
The API is heavily inspired by pouchdb and is intuitive and designed to be rapidly used in applications exporting REST APIs.

_support for the missing databases above is coming soon!_

## :sparkles: [Click here for the jasql website including complete documentation, examples, and tips.](https://codyzu.github.io/jasql) :sparkles:

# Quickstart

### 1. Install jasql:

jasql is [available on npm](https://www.npmjs.com/package/jasql) and is easy to install.

```
npm install jasql
```

### 2. Do stuff:

```javascript
const Jasql = require('jasql')
const jasql = new Jasql()

jasql.initialize()
  .then(() => console.log('jasql is ready to work!'))

  // CREATE some documents

  // first create 2 users
  .then(() => jasql.create({
    _id: 'users/Cody',
    name: 'Cody',
    title: 'Software Engineer'
  }))

  .then(() => jasql.create({
    _id: 'users/Brian',
    name: 'Brian',
    title: 'Quality Engineer'
  }))

  // next create 2 posts
  .then(() => jasql.create({
    _id: 'posts/Cody/' + new Date().toJSON(),
    title: 'How to use jasql',
    body: 'See documentation at http://github.chom/codyzu/jasql'
  }))

  .then(() => jasql.create({
    _id: 'posts/Cody/' + new Date().toJSON(),
    title: 'Why we may have to use relational databases',
    body: 'Often enterprises will want to leverage their existing infastructure, i.e. relational dbs.'
  }))

  // READ a document by id

  .then(() => jasql.read('users/Cody'))

  .then((doc) => console.log('User Cody:', doc))

  // LIST documents with wildcards

  .then(() => jasql.list({id: 'users/%'}))

  .then((docs) => console.log('All users:', docs))

  .then(() => jasql.list({_id: 'posts/Cody/%'}))

  // posts will be in chronological order
  // because they have the date in the id!
  .then((docs) => console.log('All posts by Cody:', docs))
```

# Roadmap

* implement missing db drivers
* add search functionality
* investigate improved indexing
