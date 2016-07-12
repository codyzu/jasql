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

Don't forget to cleanup if you want to application to exit cleanly.
This isn't required for long running server applications, but may be useful if your tests seem to "hang".

```javascript
  jasql.destroy()

  .then(() => console.log('jasql is disconnected'))
```
