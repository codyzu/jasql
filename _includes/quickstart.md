# Getting started with jasql

### 1. Install jasql:

jasql is [available on npm](https://www.npmjs.com/package/jasql) and is easy to install.

```
npm install jasql
```

### 2. Import and initialize jasql

The jasql module exports a single class `Jasql`, we will need to instantiate and also initialize this class.
Instatiating the `Jasql` class with no parameters will result in a sqlite3 database stored in `./jasql.sqlite`.
During the call to `initialize`, jasql will create it's table in the database if it does not already exist.

```javascript
const Jasql = require('jasql')
const jasql = new Jasql()

jasql.initialize()
  .then(() => console.log('jasql is ready to work!'))
```

### 3. Add some documents

Create some documents:

* 2 users, `Cody` and `Brian`
* 2 posts made by `Cody`

Below we will leverage the fact that jasql allows any string for the `_id`.
However, _if no id is provided, jasql will generate a random id_, meaning the `_id` field is optional in the documents.
Since we are prefixing our ids with type of the document, we will benifit by being able to query only the types of documents we want.
**Leveraging the id is an imporant concept that eliminates the need for multpile collection or tables.**
See **link here** for more discussion about indexes and ids.

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

### 4. Read a stored document by id

Of course we can query a document by id.

```javascript
  .then(() => jasql.read('users/Cody'))

  .then((doc) => console.log('User Cody:', doc))
```

### 5. List documents, using wildcards

Now comes the **magic**... we can query documents by type (leveraging the fact we prefixed their id's by type).
jasql supports sql wildcards, so its easy to build interesting queries on the id.
As a bonus, since we stored the date in the id of the posts, they will be retrieved in chronological order because jasql sorts the documents by id!

```javascript
  .then(() => jasql.list({id: 'users/%'}))

  .then((docs) => console.log('All users:', docs))

  .then(() => jasql.list({_id: 'posts/Cody/%'}))

  // posts will be in chronological order
  // because they have the date in the id!
  .then((docs) => console.log('All posts by Cody:', docs))
```

### 6. Disconnect if needed

Don't forget to cleanup if you want to application to exit cleanly.
_This isn't required for long running server applications_, but may be useful if your tests seem to "hang" do to open connections to the database.

```javascript
  .then(() => jasql.destroy())

  .then(() => console.log('jasql is disconnected'))
```
