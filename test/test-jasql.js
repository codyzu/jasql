import test from 'blue-tape'
import Jasql from '../lib'
import {isValid} from 'shortid'

test('models', (t) => {
  const jasql = new Jasql()

  const doc = {
    name: 'cody'
  }

  return jasql.initialize()
    .then(() => jasql.put(doc))
    .then((actualDoc) => {
      console.log('NEW DOC:', actualDoc)
      t.ok(actualDoc.name === doc.name, 'has the name set')
      t.ok(actualDoc._id, 'has _id set')
      t.ok(isValid(actualDoc._id), '_id is a valid shortid')
    })
    .then(
      () => jasql.destroy(),
      (err) => {
        return jasql.destroy()
          .catch((destroyErr) => console.log(`Error on destroy: ${destroyErr}`))
          .then(() => { throw err })
      }
    )
})

// function testJasql(func) {
//   const jasql = new Jasql()

//   jasql.initialize()
//     .then
// }
