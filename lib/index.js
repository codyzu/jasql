import knex from 'knex'
import {generate as shortId} from 'shortid'
import {defaultsDeep as defaults} from 'lodash'

export class JasqlError extends Error {}

export class DocumentNotFoundError extends JasqlError {
  constructor (id) {
    super(`The document with id '${id}' was not found`)
  }
}

export class DatabaseError extends JasqlError {
  constructor (cause) {
    super(`An error occured while accessing database: ${cause}`)
    this.cause = cause
  }
}

export default class Jasql {
  constructor (opts = defaultOptions()) {
    this.db = knex(opts)
    this.name = opts.name || 'JASQL'
  }

  createTable (opts) {
    return this.db.schema.createTable(this.name, tableSchema)
  }

  initialize () {
    return this.db.schema
      .hasTable(this.name)
      .then((exists) => {
        if (!exists) {
          return this.db.schema.createTable(this.name, tableSchema)
        }
      })
  }

  async put (doc) {
    // insert doc into db
    const newDoc = defaults({}, doc)

    if (!newDoc._id) {
      newDoc._id = shortId()
    }

    await this.db
      .insert({id: newDoc._id, doc: JSON.stringify(newDoc)})
      .into(this.name)

    return newDoc
  }

  get (id) {
    // get doc by id
    return this.db
      .select('doc')
      .from(this.name)
      .where({id: id})
      .map((row) => JSON.parse(row.doc))
      .then((rows) => {
        if (rows.length < 1) {
          throw new DocumentNotFoundError(id)
        }

        return rows[0]
      })
  }

  getAll (opts) {
    // get all with id
    return this.db
      .select('doc')
      .from(this.name)
      .map((row) => JSON.parse(row.doc))
  }

  patch (doc) {
    // update document
  }

  delete (id) {
    // delete document by id
  }

  destroy () {
    return this.db.destroy()
  }
}

function defaultOptions () {
  return {
    client: 'sqlite3',
    connection: {
      filename: './jasql.sqlite'
    }
  }
}

function tableSchema (table) {
  console.log('CREATING TABLE')
  table.string('id', 255).index().unique()
  table.specificType('doc', 'clob')
}