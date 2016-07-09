import test from 'blue-tape'
import Jasql, {DocumentNotFoundError, DatabaseError} from '../lib'
import {isValid} from 'shortid'

const jasql = new Jasql()

test('setup', (t) => jasql.initialize())

test('create returns the created document with an added _id', (t) => {
  const doc = {
    name: 'cody'
  }

  return jasql.create(doc)
    .then((actualDoc) => {
      t.ok(actualDoc.name === doc.name, 'has the name set')
      t.ok(actualDoc._id, 'has _id set')
      t.ok(isValid(actualDoc._id), '_id is a valid shortid')
    })
})

test('creating document with existing id rejects', (t) => {
  const doc = {
    name: 'cody',
    _id: 'cody'
  }

  return deleteAllRows()
    .then(() => jasql.create(doc))
    .then(() => jasql.create(doc))
    .then(
      () => t.fail('expected database error did not occur'),
      (err) => t.ok(err instanceof DatabaseError, 'error is database'))
})

test('read returns document by id', (t) => {
  const doc = {
    name: 'cody'
  }

  let id

  return jasql
    .create(doc)
    .then((actualDoc) => { id = actualDoc._id })
    .then(() => jasql.read(id))
    .then((actualDoc) => {
      t.equal(actualDoc.name, doc.name, 'has the correct name')
      t.equal(actualDoc._id, id, 'has the correct id')
    })
})

test('read rejects if the document does not exist', (t) => {
  return deleteAllRows()
    .then(() => jasql.read('does not exist'))
    .then(
      () => t.fail('expected document not found error did not occur'),
      (err) => t.ok(err instanceof DocumentNotFoundError, 'error is document not found'))
})

test('list returns all documents', (t) => {
  const doc1 = {
    name: 'cody'
  }

  const doc2 = {
    name: 'brian'
  }

  return deleteAllRows()
    .then(() => jasql.create(doc1))
    .then(() => jasql.create(doc2))
    .then(() => jasql.list())
    .then((docs) => {
      t.ok(Array.isArray(docs), 'the results is an array')
      t.equal(docs.length, 2, 'there is exactly 2 docs')
    })
})

test('list can use wildcards', (t) => {
  const doc1 = {
    _id: 'a1'
  }

  const doc2 = {
    _id: 'a2'
  }

  const doc3 = {
    _id: 'b1'
  }

  return deleteAllRows()
    .then(() => jasql.create(doc1))
    .then(() => jasql.create(doc2))
    .then(() => jasql.create(doc3))
    .then(() => jasql.list({_id: 'a%'}))
    .then((docs) => {
      t.ok(Array.isArray(docs), 'the results is an array')
      t.equal(docs.length, 2, 'there is exactly 2 docs')
    })
})

test('del removes document', (t) => {
  const doc1 = {
    _id: 'a1'
  }

  const doc2 = {
    _id: 'a2'
  }

  const doc3 = {
    _id: 'b1'
  }

  return deleteAllRows()
    .then(() => jasql.create(doc1))
    .then(() => jasql.create(doc2))
    .then(() => jasql.create(doc3))
    .then((doc) => jasql.read(doc._id))
    .then((doc) => jasql.del(doc))
    .then((count) => t.equal(count, 1))
    .then(() => jasql.list())
    .then((docs) => {
      t.equal(docs.length, 2, 'there is exactly 2 docs')
    })
})

test('update returns updated document', (t) => {
  const doc = {
    name: 'cody'
  }

  return jasql.create(doc)
    .then((doc) => {
      doc.name = 'brian'
      return jasql.update(doc)
    })
    .then((updatedDoc) => {
      t.equal(updatedDoc.name, 'brian', 'name is updated')
    })
})

test('update modifies document', (t) => {
  const doc = {
    name: 'cody'
  }

  let id

  return jasql.create(doc)
    .then((doc) => {
      id = doc._id
      doc.name = 'brian'
      return jasql.update(doc)
    })
    .then(() => jasql.read(id))
    .then((updatedDoc) => {
      t.equal(updatedDoc.name, 'brian', 'name is updated')
    })
})

test('teardown', (t) => jasql.destroy())

function deleteAllRows () {
  return jasql.db(jasql.tableName).del()
}
