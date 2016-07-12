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
