import knex from 'knex'
import {generate as shortId} from 'shortid'
import {defaultsDeep as defaults, get} from 'lodash'
import {DocumentNotFoundError, DatabaseError} from './errors'
import sqlLiteQuery from './query-sqlite'

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
    this.dbOptions = options.db
    this.tableName = options.tableName
    this.id = options.idName
    this.jsonColName = 'doc'
    this.idColName = 'id'
    this.jsonColType = getJsonType(options.db)
  }

  initialize () {
    this.db = knex(this.dbOptions)

    return this.db.schema
      .hasTable(this.tableName)
      .then((exists) => {
        if (!exists) {
          return this.db.schema
            .createTable(this.tableName, (table) => tableSchema(table, this))
        }
      })
      .catch(handleDbError)
  }

  async create (doc) {
    console.log('CREATING:', doc)
    // insert doc into db
    const newDoc = defaults({}, doc)

    if (!newDoc._id) {
      newDoc._id = shortId()
    }

    await this.db
      .insert({id: newDoc._id, doc: JSON.stringify(newDoc)})
      .into(this.tableName)
      .catch(handleDbError)

    return newDoc
  }

  read (id) {
    // get doc by id
    return this.db
      .select(this.jsonColName)
      .from(this.tableName)
      .where({id: id})
      .map((row) => this._rowToDocument(row))
      .then(
        (rows) => {
          if (rows.length < 1) {
            throw new DocumentNotFoundError(id)
          }

          return rows[0]
        },
        handleDbError)
  }

  list (opts) {
    let query

    if (opts && opts.search) {
      query = sqlLiteQuery(opts.search, this.db, this.tableName, this.jsonColName, this.idColName)
    } else {
      // get all with id
      query = this.db
        .distinct(`${this.tableName}.${this.jsonColName}`)
        .from(knex.raw('??, json_tree(??)', [
          this.tableName,
          `${this.tableName}.${this.jsonColName}`
        ]))

      // if an id is included, add the 'where like' clause
      if (opts && opts.id) {
        query.where(`${this.tableName}.${this.idColName}`, 'like', opts.id)
      }
    }

    // add the 'order by' clause
    const desc = opts && opts.desc
    query.orderBy(`${this.tableName}.${this.idColName}`, desc ? 'DESC' : 'ASC')

    return query
      .map((row) => this._rowToDocument(row))
      .catch(handleDbError)
  }

  async update (doc) {
    // update document
    await this.db(this.tableName)
      .where(this.idColName, 'like', doc._id)
      .update(this.jsonColName, JSON.stringify(doc))
      .catch(handleDbError)

    return doc
  }

  del (idOrDoc) {
    // delete document by id
    let id = idOrDoc
    if (idOrDoc._id) {
      id = idOrDoc._id
    }

    return this.db(this.tableName)
      .where(this.idColName, 'like', id)
      .del()
      .catch(handleDbError)
  }

  destroy () {
    return this.db
      .destroy()
      .catch(handleDbError)
  }

  _rowToDocument (row) {
    if (this._isPostgres()) {
      return row[this.jsonColName]
    }

    return JSON.parse(row[this.jsonColName])
  }

  _isPostgres () {
    return this.dbOptions.client === 'pg'
  }
}

function handleDbError (err) {
  throw new DatabaseError(err)
}

function tableSchema (table, jasql) {
  table.string(jasql.idColName, 255).index().unique().primary()
  table.specificType(jasql.jsonColName, jasql.jsonColType)
}

function getJsonType (dbOptions) {
  // maps the db client to the db type used for storing json
  const jsonTypes = {
    pg: 'jsonb',
    mysql: 'json',
    sqlite3: 'clob'
  }

  return get(jsonTypes, dbOptions.client, 'text')
}
