# Jasql class

The Jasql class has a simple to use api.

---

## `constructor`

The constructor accepts an opts parameter.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>opts</td>
      <td>object</td>
      <td>[optional]</td>
    </tr>
    <tr>
      <td>opts.db</td>
      <td>object</td>
      <td>knex connection object, default sqlite3 using <code class="highlighter-rouge">jasql.sqlite</code></td>
    </tr>
    <tr>
      <td>opts.tableName</td>
      <td>string</td>
      <td>name of the id field for documents, default <code class="highlighter-rouge">_id</code></td>
    </tr>
  </tbody>
</table>

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

---

## `initialize`

#### Initialize a Jasql instance, connecting to the database and creating the table if it does not exist.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves when jasl is initialized</td>
    </tr>
  </tbody>
</table>

Initialize should be called before executing any other methods on an instance of Jasql.

```javascript
jasql.initialize()
  .then(() => console.log('jasql is ready to rock!'))
```

---

## `create`

#### Creat a new document in the database.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>doc</td>
      <td>object</td>
      <td>document to create in the database</td>
    </tr>
  </tbody>
</table>

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

---

## `read`

#### Read an existing document from the database.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>id</td>
      <td>string</td>
      <td>id of document to read</td>
    </tr>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves to the read document</td>
    </tr>
  </tbody>
</table>

The id must refer to an existing document.
An error will be raised if a document with the given id does not exist.

Read a document with id `users/Cody`:

```javascript
jasql.read('users/Cody')
```

---

## `update`

#### Update an existing document.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>doc</td>
      <td>Object</td>
      <td>document to update</td>
    </tr>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves to the updated document</td>
    </tr>
  </tbody>
</table>

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

---


## `list`

#### Lists some or all documents in the database.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>opts</td>
      <td>object</td>
      <td>[optional]</td>
    </tr>
    <tr>
      <td>opts.id</td>
      <td>string</td>
      <td>id with possible wildcards to search for</td>
    </tr>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves to an array of fetched documents</td>
    </tr>
  </tbody>
</table>

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

---

## `del`

#### Delete a document from the database.

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>idOrDoc</td>
      <td>string | Object</td>
      <td>id of document or document to delete</td>
    </tr>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves when the document has been deleted</td>
    </tr>
  </tbody>
</table>

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

---

## `destroy`

#### Closes any open connections to the database

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>name</th>
      <th>type</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{return}</td>
      <td>Promise</td>
      <td>resolves when all connections are closed</td>
    </tr>
  </tbody>
</table>

_Calling `destroy` is not required for long running server applications._
However, it can be useful in your tests if they seem to "hang" do to open connections to the database.

```javascript
  jasql.destroy()
```

---
