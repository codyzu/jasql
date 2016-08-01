import test from 'blue-tape'
import Jasql from '../../src'
import {DocumentNotFoundError, DatabaseError} from '../../src/errors'
import {isValid} from 'shortid'

export default function testCrudl(testFixture, jasqlOptions) {
  let jasql

  testFixture.test('setup', (t) => {
    jasql = new Jasql(jasqlOptions)
    return jasql.initialize()
  })

  testFixture.test('create returns the created document with an added _id', (t) => {
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

  testFixture.test('creating document with existing id rejects', (t) => {
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

  testFixture.test('read returns document by id', (t) => {
    const doc = {
      name: 'cody'
    }

    let id

    return jasql
      .create(doc)
      .catch((err) => {
        console.log('ERROR CREATE:', err)
        throw err
      })
      .then((actualDoc) => { id = actualDoc._id })
      .then(() => jasql.read(id))
      .catch((err) => {
        console.log('ERROR READ:', err)
        throw err
      })
      .then((actualDoc) => {
        t.equal(actualDoc.name, doc.name, 'has the correct name')
        t.equal(actualDoc._id, id, 'has the correct id')
      })
  })

  testFixture.test('read rejects if the document does not exist', (t) => {
    return deleteAllRows()
      .then(() => jasql.read('does not exist'))
      .then(
        () => t.fail('expected document not found error did not occur'),
        (err) => t.ok(err instanceof DocumentNotFoundError, 'error is document not found'))
  })

  testFixture.test('list returns all documents', (t) => {
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

  testFixture.test('list can use wildcards', (t) => {
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
      .then(() => jasql.list({id: 'a%'}))
      .then((docs) => {
        t.ok(Array.isArray(docs), 'the results is an array')
        t.equal(docs.length, 2, 'there is exactly 2 docs')
      })
  })

  testFixture.test('list sorts ascending by default', (t) => {
    const docA = {
      _id: 'a'
    }

    const docC = {
      _id: 'c'
    }

    const docB = {
      _id: 'b'
    }

    return deleteAllRows()
      .then(() => jasql.create(docA))
      .then(() => jasql.create(docC))
      .then(() => jasql.create(docB))
      .then(() => jasql.list())
      .then((docs) => {
        t.equal(docs[0]._id, docA._id, 'docA at index 0')
        t.equal(docs[1]._id, docB._id, 'docB at index 1')
        t.equal(docs[2]._id, docC._id, 'docC at index 2')
      })
  })

  testFixture.test('list sorts descending if opts.desc is true', (t) => {
    const docA = {
      _id: 'a'
    }

    const docC = {
      _id: 'c'
    }

    const docB = {
      _id: 'b'
    }

    return deleteAllRows()
      .then(() => jasql.create(docA))
      .then(() => jasql.create(docC))
      .then(() => jasql.create(docB))
      .then(() => jasql.list({desc: true}))
      .then((docs) => {
        t.equal(docs[0]._id, docC._id, 'docC at index 0')
        t.equal(docs[1]._id, docB._id, 'docB at index 1')
        t.equal(docs[2]._id, docA._id, 'docA at index 2')
      })
  })

  testFixture.test('del removes document', (t) => {
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

  testFixture.test('update returns updated document', (t) => {
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

  testFixture.test('update modifies document', (t) => {
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

  testFixture.test('initialize creates the table if it does not exist', (t) => {
    return jasql.db.schema.dropTable(jasql.tableName)
      .then(() => jasql.destroy())
      .then(() => {
        jasql = new Jasql(jasqlOptions)
      })
      .then(() => jasql.initialize())
      .then(() => t.pass('sucessfully re-initialize'))
  })

  testFixture.test('search', {skip: true}, (searchFixture) => {
    const testDocs = [
      {
        name: 'cody',
        status: 'A',
        address: {
          city: 'Annecy'
        },
        age: 36
      },
      {
        name: 'brian',
        status: 'A',
        address: {
          city: 'Paris'
        },
        age: 43
      },
      {
        name: 'sarah',
        status: 'B',
        age: 16
      }
    ]

    searchFixture.test('setup: add test docs', (t) => {
      const createPromises = testDocs.map((doc) => jasql.create(doc))
      return Promise.all(createPromises)
    })

    searchFixture.test('single depth equality', (t) => {
      return jasql.list({
        search: {name: 'cody'}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'cody', 'return document with name cody')
      })
    })

    searchFixture.test('nested object equality', (t) => {
      return jasql.list({
        search: {address: {city: 'Annecy'}}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'cody', 'return document with name cody')
      })
    })

    searchFixture.test('and equality explicit', (t) => {
      return jasql.list({
        search: {$and: [{status: 'A'}, {age: 43}]}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'brian', 'return document with name brian')
      })
    })

    searchFixture.test('and equality implicit', (t) => {
      return jasql.list({
        search: {status: 'A', age: 43}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'brian', 'return document with name brian')
      })
    })

    searchFixture.test('or operator', (t) => {
      return jasql.list({
        search: {$or: [{name: 'cody'}, {status: 'B'}]}
      })
      .then((docs) => {
        t.equal(docs.length, 2, 'returns 2 documents')
        console.log(docs.map((d) => d.name))
        t.equal(docs.map((d) => d.name).indexOf('cody') > -1, true, 'returns 1 document with name cody')
        t.equal(docs.map((d) => d.name).indexOf('sarah') > -1, true, 'returns 1 document with name sarah')
      })
    })

    searchFixture.test('$lt operator', (t) => {
      return jasql.list({
        search: {age: {$lt: 30}}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'sarah', 'return document with name sarah')
      })
    })

    searchFixture.test('$gt operator', (t) => {
      return jasql.list({
        search: {age: {$gt: 40}}
      })
      .then((docs) => {
        t.equal(docs.length, 1, 'returns 1 document')
        t.equal(docs[0].name, 'brian', 'return document with name brian')
      })
    })
  })

  testFixture.test('teardown', (t) => jasql.destroy())

  function deleteAllRows () {
    return jasql.db(jasql.tableName).del()
  }
}