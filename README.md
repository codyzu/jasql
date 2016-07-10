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

### 1. Import and initialize jasql

```javascript
const Jasql = require('jasql')

const jasql = new Jasql()

  jasql.initialize()
  
  .then(() => console.log('jasql is ready to work!'))
```

### 2. Add some documents

```javascript
  // first create 2 users
  jasql.create({
    _id: 'users/Cody',
    name: 'Cody',
    title: 'Software Engineer'
  })

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
    body: 'Often enterprises already have the expertise and infastructure for relational databases and we have no choice.'
  }))
```

### 3. Read a stored document by id

```javascript
  jasql.read('users/Cody')

  .then((doc) => console.log('User Cody:', doc))
```

### 4. List documents, using wildcards

```javascript
  jasql.list({_id: 'users/%'})

  .then((docs) => console.log('All users:', docs))

  .then(() => jasql.list({_id: 'posts/Cody/%'}))

  .then((docs) => console.log('All posts by Cody:', docs))
```

### 5. Don't forget to cleanup if you want to application to exit
```javascript
  jasql.destroy()

  .then(() => console.log('jasql is disconnected'))
```

# Indexes

By default, jasql supports a single indexed field names `_id`.
This can be any string up to 255 characters.
If you don't define this id, jasql will generate a nice random one for you.

However, don't be limited by randow ids!
Need documents sorted by date? Try storing the ISO date in the id.
Prefix your ids with the type of the document. This makes retrieving all documents of a given type super easy.

# API Documentation

The Jasql class has a simple to use api.

### Jasql constructor

`opts`

### initialize

### create

Creat a new document in the database.

| name | type | description |
|------|------|-------------|
| doc  | object | document to create in the database |

The `doc` object can optionally include an `_id` field to identify the document.
The `_id` must be unique, if a document with the same id already exists, an error will be raised.
If the `doc` does not include an `_id` a random identifier will be automatically generated.

### read

Read an existing document from the database.

| name | type | description |
|------|------|-------------|
| id   | string | id of document read |

The id must refer to an existing document.
An error will be raised if a document with the given id does not exist. 

### update

Update an existing document.

| name | type | description |
|------|------|-------------|
| doc  | object | document to update |

The `doc` should have an `_id` of a document existing in the database.
The existing document will be replaced with the new `doc`.

### del

Delete a document from the database.

| name | type | description |
|------|------|-------------|
| idOrDoc | string \| object | id of document or document to delete |

The document to delete can either be specified by its id, or by passing
an object that has an `_id` field that matches an existing document.

### list

Lists some or all documents in the database

| name | type | description |
|------|------|-------------|
| opts | object | [optional] |
| opts.id | string | id with possible wildcards to search for |

If called with no parameters, all documents will be returned.
If called with an id (optionally with wildcards), all documents matching the id will be returned.

For a list of valid wildcards, see [sql wildcards](http://www.w3schools.com/sql/sql_wildcards.asp).

# Roadmap

* implement missing db drivers
* add search functionality
* investigate improved indexing
