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

const DEFAULT_OPTIONS = {
  db: {
    client: 'sqlite3',
    connection: {
      filename: './jasql.sqlite'
    }
  },
  tableName: 'JASQL',
  id: '_id'
}

export default class Jasql {
  constructor (opts) {
    let options = defaults({}, opts, DEFAULT_OPTIONS)
    this.db = knex(options.db)
    this.tableName = options.tableName
    this.id = options.idName
    this.jsonColName = 'doc'
    this.idColName = 'id'
    this.jsonColType = 'clob'
  }

  initialize () {
    return this.db.schema
      .hasTable(this.tableName)
      .then((exists) => {
        if (!exists) {
          return this.db.schema.createTable(this.tableName, (table) => tableSchema(table, this))
        }
      })
  }

  async create (doc) {
    // insert doc into db
    const newDoc = defaults({}, doc)

    if (!newDoc._id) {
      newDoc._id = shortId()
    }

    await this.db
      .insert({id: newDoc._id, doc: JSON.stringify(newDoc)})
      .into(this.tableName)

    return newDoc
  }

  read (id) {
    // get doc by id
    return this.db
      .select(this.jsonColName)
      .from(this.tableName)
      .where({id: id})
      .map((row) => JSON.parse(row.doc))
      .then((rows) => {
        if (rows.length < 1) {
          throw new DocumentNotFoundError(id)
        }

        return rows[0]
      })
  }

  list (opts) {
    // get all with id
    const query = this.db
      .select(this.jsonColName)
      .from(this.tableName)

    if (opts && opts._id) {
      query.where(this.idColName, 'like', opts._id)
    }

    return query.map((row) => JSON.parse(row.doc))
  }

  async update (doc) {
    // update document
    await this.db(this.tableName)
      .where(this.idColName, 'like', doc._id)
      .update(this.jsonColName, JSON.stringify(doc))

    return doc
  }

  del (idOrDoc) {
    // delete document by id
    let id = idOrDoc
    if (idOrDoc._id) {
      id = idOrDoc._id
    }

    console.log('DELETING DOC ID:', id)
    return this.db(this.tableName)
      .where(this.idColName, 'like', id)
      .del()
  }

  destroy () {
    return this.db.destroy()
  }
}

function tableSchema (table, jasql) {
  console.log('THIS:', this)
  console.log('CREATING TABLE')
  table.string(jasql.idColName, 255).index().unique()
  table.specificType(jasql.jsonColName, jasql.jsonColType)
}
