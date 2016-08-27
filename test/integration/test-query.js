import * as utils from './utils'

export default function testQuery (testFixture, jasql) {
  const deleteAllRows = () => utils.deleteAllRows(jasql)

  const testDocs = [
    {
      name: 'cody',
      status: 'A',
      address: {
        city: 'Annecy'
      },
      age: 36,
      tags: ['a', 'b', 'c']
    },
    {
      name: 'brian',
      status: 'A',
      address: {
        city: 'Paris'
      },
      age: 43,
      tags: ['a', 'b']
    },
    {
      name: 'sarah',
      status: 'B',
      age: 16,
      tags: []
    }]

  testFixture.test('setup: add test docs', (t) => {
    return deleteAllRows()
      .then(() => {
        const createPromises = testDocs.map((doc) => jasql.create(doc))
        return Promise.all(createPromises)
      })
  })

  testFixture.test('single depth equality', (t) => {
    return jasql.list({
      search: {name: 'cody'}
    })
    .then((docs) => {
      t.equal(docs.length, 1, 'returns 1 document')
      t.equal(docs[0].name, 'cody', 'return document with name cody')
    })
  })

  testFixture.test('nested object equality', (t) => {
    return jasql.list({
      search: {address: {city: 'Annecy'}}
    })
    .then((docs) => {
      t.equal(docs.length, 1, 'returns 1 document')
      t.equal(docs[0].name, 'cody', 'return document with name cody')
    })
  })

  testFixture.test('and equality explicit', (t) => {
    return jasql.list({
      search: {$and: [{status: 'A'}, {age: 43}]}
    })
    .then((docs) => {
      t.equal(docs.length, 1, 'returns 1 document')
      t.equal(docs[0].name, 'brian', 'return document with name brian')
    })
  })

  // testFixture.test('and equality implicit', (t) => {
  //   return jasql.list({
  //     search: {status: 'A', age: 43}
  //   })
  //   .then((docs) => {
  //     t.equal(docs.length, 1, 'returns 1 document')
  //     t.equal(docs[0].name, 'brian', 'return document with name brian')
  //   })
  // })

  // testFixture.test('or operator', (t) => {
  //   return jasql.list({
  //     search: {$or: [{name: 'cody'}, {status: 'B'}]}
  //   })
  //   .then((docs) => {
  //     t.equal(docs.length, 2, 'returns 2 documents')
  //     console.log(docs.map((d) => d.name))
  //     t.equal(docs.map((d) => d.name).indexOf('cody') > -1, true, 'returns 1 document with name cody')
  //     t.equal(docs.map((d) => d.name).indexOf('sarah') > -1, true, 'returns 1 document with name sarah')
  //   })
  // })

  // testFixture.test('$lt operator', (t) => {
  //   return jasql.list({
  //     search: {age: {$lt: 30}}
  //   })
  //   .then((docs) => {
  //     t.equal(docs.length, 1, 'returns 1 document')
  //     t.equal(docs[0].name, 'sarah', 'return document with name sarah')
  //   })
  // })

  // testFixture.test('$gt operator', (t) => {
  //   return jasql.list({
  //     search: {age: {$gt: 40}}
  //   })
  //   .then((docs) => {
  //     t.equal(docs.length, 1, 'returns 1 document')
  //     t.equal(docs[0].name, 'brian', 'return document with name brian')
  //   })
  // })

  // testFixture.test('test array contains value', (t) => {
  //   return jasql.list({
  //     search: {'tags': 'b'}
  //   })
  //   .then((docs) => {
  //     t.equal(docs.length, 2, 'returns 2 documents')
  //     t.equal(docs.map((d) => d.name).indexOf('cody') > -1, true, 'returns 1 document with name cody')
  //     t.equal(docs.map((d) => d.name).indexOf('brian') > -1, true, 'returns 1 document with name sarah')
  //   })
  // })
}
