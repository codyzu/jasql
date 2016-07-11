# jasql - JSON document storage in SQL for node.js

## ![jasql](resources/logo-200px.png) node.js + JSON + SQL = bliss

[![Build Status](https://travis-ci.org/codyzu/jasql.svg?branch=master)](https://travis-ci.org/codyzu/jasql)
[![Coverage Status](https://coveralls.io/repos/github/codyzu/jasql/badge.svg?branch=master)](https://coveralls.io/github/codyzu/jasql?branch=master)

jasql is a node.js storage library for storing schemaless documents in various relational databases.
Built on knex, jasql supports sqlite3, postgres, ~~mysql~~, ~~oracle~~, and ~~mssql~~.
The API is heavily inspired by pouchdb and is intuitive and designed to be rapidly used in applications exporting REST APIs.

_support for the missing databases above is coming soon!_

# Table of Contents

* [Quickstart](#quickstart)
* [Ids and Indexes](#ids-and-indexes)
* [Compatibility](#compatibility)
* [Installation](#installation)
* [Motivation (Why not mongodb)?](#motivation-why-not-mongodb)
* [API Documentation](#api-documentation)
* [Roadmap](#roadmap)


# Quickstart

### 1. Install jasql:

```
npm install jasql
```

### 2. Import and initialize jasql

```javascript
const Jasql = require('jasql')
const jasql = new Jasql()

jasql.initialize()
  .then(() => console.log('jasql is ready to work!'))
```

### 3. Add some documents

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
    body: 'Often enterprises already have the expertise and infrastructure for relational databases and we have no choice.'
  }))
```

### 4. Read a stored document by id

```javascript
  jasql.read('users/Cody')

  .then((doc) => console.log('User Cody:', doc))
```

### 5. List documents, using wildcards

```javascript
  jasql.list({id: 'users/%'})

  .then((docs) => console.log('All users:', docs))

  .then(() => jasql.list({_id: 'posts/Cody/%'}))

  // posts will be in chronological order
  // because they have the date in the id!
  .then((docs) => console.log('All posts by Cody:', docs))
```

### 6. Disconnect if needed

Don't forget to cleanup if you want to application to exit cleanly. This isn't required for long running server applications, but may be useful if your tests seem to "hang".
```javascript
  jasql.destroy()

  .then(() => console.log('jasql is disconnected'))
```


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


# API Documentation

The Jasql class has a simple to use api.

### constructor

The constructor accepts an opts parameter.

| name | type | description |
|------|------|-------------|
| opts | object | [optional] |
| opts.db | object | knex connection object, default sqlite3 using `jasql.sqlite` |
| opts.tableName | string | table to use to store jasql document, default `JASQL` |
| opts.id | string | name of the id field for documents, default `_id` |

`opts.db` is passed to the initializer of knex.
See the [knex documentation](http://knexjs.org/#Installation-client) for details.
Below are some examples:

jasql defaults, **Sqlite3** using `jasql.sqlite`:
```javascript
const jasql = new Jasql()
```

jasql with **Sqlite3** and custom database file:
```javascript
const jasql = new Jasql({
  db: {
    client: 'sqlite3',
    connection: {
      filename: 'path/to/db.sqlite'
    }
  }
})
```

jasql with **Postgres**:
```javascript
const jasql = new Jasql({
  db: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'postgres',
      database: 'postgres'
    }
  }
})
```

### initialize

Initialize a Jasql instance, connecting to the database and creating the table if it does not exist.

| name | type | description |
|------|------|-------------|
| {return} | Promise | returns a promise |

Initialize should be called before executing any other methods on an instance of Jasql.

```javascript
jasql.initialize()
  .then(() => console.log('jasql is ready to rock!'))
```

### create

Creat a new document in the database.

| name | type | description |
|------|------|-------------|
| doc  | object | document to create in the database |

The `doc` object can optionally include an `_id` field to identify the document.
The `_id` must be unique, if a document with the same id already exists, an error will be raised.
If the `doc` does not include an `_id` a random identifier will be automatically generated.

Create a document with a random id:
```javascript
jasql.create({ name: 'Cody', title: 'Software Engineer' })
```

Create a document with a given id:
```javascript
jasql.create({ _id: 'users/Cody', name: 'Cody', title: 'Software Engineer' })
```

_see [Ids and Indexes](#ids-and-indexes) for more details about ids_

### read

Read an existing document from the database.

| name | type | description |
|------|------|-------------|
| id   | string | id of document read |
| {return} | Promise | returns a promise resolving to the read document |

The id must refer to an existing document.
An error will be raised if a document with the given id does not exist.

Read a document with id `users/Cody`:
```javascript
jasql.read('users/Cody')
```

### update

Update an existing document.

| name | type | description |
|------|------|-------------|
| doc  | object | document to update |
| {return} | Promise | returns a promise resolving to the updated document |


The `doc` should have an `_id` of a document existing in the database.
The existing document will be replaced with the new `doc`.

Update a field in a document with id `users/Cody`:
```javascript
jasql.read('users/Cody')
  .then((doc) => {
    doc.title = 'Senior Software Engineer'
    return jasql.update(doc)
  })
```

### del

Delete a document from the database.

| name | type | description |
|------|------|-------------|
| idOrDoc | string \| object | id of document or document to delete |
| {return} | Promise | returns a promise |

The document to delete can either be specified by its id, or by passing
an object that has an `_id` field that matches an existing document.

Delete a document by id:
```javascript
jasql.del('users/Cody')
```

Read and then delete a document:
```javascript
jasql.read('users/Cody')
  .then((doc) => jasql.del(doc))
```

### list

Lists some or all documents in the database

| name | type | description |
|------|------|-------------|
| opts | object | [optional] |
| opts.id | string | id with possible wildcards to search for |
| {return} | Promise | returns a promise resolving to an array of fetched documents |

If called with no parameters, all documents will be returned.
If called with an id (optionally with wildcards), all documents matching the id will be returned.

_For a list of valid wildcards, see [sql wildcards](http://www.w3schools.com/sql/sql_wildcards.asp)._

List all documents:
```javascript
jasql.list()
```

List all documents with ids starting with `users/`:
```javascript
jasql.list({id:'users/%'})
```

# Roadmap

* implement missing db drivers
* add search functionality
* investigate improved indexing
