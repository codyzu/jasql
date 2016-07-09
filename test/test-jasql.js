import test from 'blue-tape'
import Jasql from '../lib'
import {isValid} from 'shortid'

const jasql = new Jasql()

const doc = {
  name: 'cody'
}

test('setup', (t) => jasql.initialize())

test('put returns the created document with an added _id', (t) => jasql.put(doc)
  .then((actualDoc) => {
    console.log('NEW DOC:', actualDoc)
    t.ok(actualDoc.name === doc.name, 'has the name set')
    t.ok(actualDoc._id, 'has _id set')
    t.ok(isValid(actualDoc._id), '_id is a valid shortid')
  }))

test('get returns document by id', (t) => {
  let id

  return jasql
    .put(doc)
    .then((d) => {
      console.log('CREATED DOC', d)
      return d
    })
    .then((actualDoc) => { id = actualDoc._id })
    .then(() => jasql.get(id))
    .then((actualDoc) => {
      t.equal(actualDoc.name, doc.name, 'has the correct name')
      t.equal(actualDoc._id, id, 'has the correct id')
    })
})

test('getAll returns all documents', (t) => {
  const doc2 = {
    name: 'brian'
  }

  return jasql.put(doc)
    .then(() => jasql.put(doc2))
    .then(() => jasql.getAll())
    .then((docs) => {
      console.log('DOCS:', docs)
      t.ok(Array.isArray(docs), 'the results is an array')
      t.ok(docs.length >= 2, 'there are at least 2 docs')
    })
})

test('teardown', (t) => jasql.destroy())
