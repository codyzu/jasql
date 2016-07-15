<h1 class="text-center">Getting started with jasql</h1>

## 1. Install jasql:

#### jasql is [available on npm](https://www.npmjs.com/package/jasql) and is easy to install.

```
npm install jasql
```

jasql is tested and verified on the latest releases of **Node v4, v5, and v6**.
If you need to support another version of node, create an issue or even better a pull request!

**One of the supported database drivers should also be installed!**

* `sqlite3` for Sqlite3 support
* `pg` for postres support
* `mysql` for MySQL support

<i class="fa fa-warning"></i> The above dependencies are marked as <em>optionalDependencies<em> in the package.json.
This means npm will try to install them all, and continue happily even if they fail.
One is required, feel free to uninstall the dependencies ones you don't use.

## 2. Import and initialize jasql

#### The jasql module exports a single class `Jasql`, we will need to instantiate and also initialize this class.

<em>Instatiating the `Jasql` class with no parameters will result in a sqlite3 database stored in `./jasql.sqlite`.</em>

During the call to `initialize`, jasql will create it's table in the database if it does not already exist.

```javascript
var Jasql = require('jasql')
var jasql = new Jasql()

jasql.initialize()
  .then(() => console.log('jasql is ready to work!'))
```

## 3. Add some documents

#### Create some documents:

* 2 users, `Cody` and `Brian`
* 2 posts made by `Cody`

Below we will leverage the fact that jasql allows any string for the `_id`.
However, _if no id is provided, jasql will generate a random id_, meaning the `_id` field is optional in the documents.
Since we are prefixing our ids with type of the document, we will benifit by being able to query only the types of documents we want.
**Leveraging the id is an imporant concept that eliminates the need for multpile collection or tables.**
See [Ids and Indexes](#ids-and-indexes) for more discussion on how to use jasql's powerful indexing.

```javascript
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
```

## 4. Read a stored document by id

#### Querying a single document by id is easy.

```javascript
  .then(() => jasql.read('users/Cody'))

  .then((doc) => console.log('User Cody:', doc))
```

## 5. List documents, using wildcards

#### **Magic time!** Query our documents... _by type!_.

We can query documents by type (leveraging the fact we prefixed their id's by type).
jasql supports sql wildcards, so its easy to build interesting queries on the id.
As a bonus, since we stored the date in the id of the posts, they will be retrieved in chronological order because jasql sorts the documents by id!

See the [list function documentation](#list-opts) for more details.

```javascript
  .then(() => jasql.list({id: 'users/%'}))

  .then((docs) => console.log('All users:', docs))

  .then(() => jasql.list({_id: 'posts/Cody/%'}))

  // posts will be in chronological order
  // because they have the date in the id!
  .then((docs) => console.log('All posts by Cody:', docs))
```

## 6. Disconnect if needed

#### Don't forget to cleanup if you want to application to exit cleanly.

_This isn't required for long running server applications_, but may be useful if your tests seem to "hang" do to open connections to the database.

```javascript
  .then(() => jasql.destroy())

  .then(() => console.log('jasql is disconnected'))
```
