import test from 'blue-tape'
import mkdir from 'mkdirp-promise'
import {dirname} from 'path'
import testCrudl from './integration/test-crudl'
import testQuery from './integration/test-query'
import Jasql from '../src'

const TEST_DATABASE = 'target/test.sqlite'

const JASQL_OPTIONS_SQLITE3 = {
  db: {
    client: 'sqlite3',
    connection: {
      filename: TEST_DATABASE
    }
  }
}

const JASQL_OPTIONS_PG = {
  db: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'jasqluser',
      password: 'jasqlpass',
      database: 'jasqldb'
    }
  }
}

const JASQL_OPTIONS_MYSQL = {
  db: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'jasqluser',
      password: 'jasqlpass',
      database: 'jasqldb'
    }
  }
}

test('SQLITE3', (fixture) => {
  return mkdir(dirname(TEST_DATABASE))
    .then(() => testDatabase(fixture, JASQL_OPTIONS_SQLITE3))
})

test('POSTGRES', {skip: false}, (fixture) => testDatabase(fixture, JASQL_OPTIONS_PG))

test('MYSQL', {skip: false}, (fixture) => testDatabase(fixture, JASQL_OPTIONS_MYSQL))

function testDatabase (testFixture, jasqlOptions) {
  let jasql

  testFixture.test('setup: create Jasql instance', (t) => {
    jasql = new Jasql(jasqlOptions)
    return jasql.initialize()
  })

  testFixture.test('CRUDL', (t) => testCrudl(t, jasql, jasqlOptions))
  testFixture.test('query', {skip: true}, (t) => testQuery(t, jasql))

  testFixture.test('teardown: destroy Jasql instance', (t) => jasql.destroy())
}
