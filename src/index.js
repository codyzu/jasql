import knex from 'knex'
import {generate as shortId} from 'shortid'
import {defaultsDeep as defaults, get, isString, isPlainObject as isObject, isNumber} from 'lodash'
import {DocumentNotFoundError, DatabaseError} from './errors'
import parser from 'mongo-parse'
import parse from './query'

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
    this.db = knex(options.db)
    this.tableName = options.tableName
    this.id = options.idName
    this.jsonColName = 'doc'
    this.idColName = 'id'
    this.jsonColType = getJsonType(options.db)
  }

  initialize () {
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
    // get all with id
    const query = this.db
      .select(this.jsonColName)
      .from(this.tableName)

    // if an id is included, add the 'where like' clause
    if (opts && opts.id) {
      query.where(this.idColName, 'like', opts.id)
    }

    if (opts && opts.search) {
      this._buildSearchClauses(query, opts.search)
    }

    // add the 'order by' clause
    const desc = opts && opts.desc
    query.orderBy(this.idColName, desc ? 'DESC' : 'ASC')

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

  _buildSearchClauses (query, search) {
    // const p = parse(search, (p) => `json_extract(${this.jsonColName}, '$.${p}')`)
    const p = parseSearch(query, (p) => `json_extract(${this.jsonColName}, '$.${p}')`, search)
    console.log('PARSE:', p)
    query.whereRaw(p)
    // const q = parser.parse(search)
    // console.log('QUERY:', JSON.stringify(q, null, 2))
    // search.forEach((s) => this._buildSearchClause(query, s))
  }

  _buildSearchClause (query, search) {
    if (search.path && search.equals) {
      query.whereRaw(`json_extract(${this.jsonColName}, '$.${search.path}') = ?`, search.equals)
    }
  }

  _isPostgres () {
    return this.dbOptions.client === 'pg'
  }
}

const queryOperators = {
  $eq: (q, j, l, r) => `${j(l)} = ${getOperandValue(r)}`,
  $lt: (q, j, l, r) => `${j(l)} < ${getOperandValue(r)}`,
  $gt: (q, j, l, r) => `${j(l)} > ${getOperandValue(r)}`,
}

const logicalOperators = {
  $and: (q, j, exps) => exps.map((e) => `(${parseSearchEntry(q, j, e)})`).join(' and '),
  $or: (q, j, exps) => exps.map((e) => `(${parseSearchEntry(q, j, e)})`).join(' or ')
}

function parseSearch(query, jsonExtract, search) {
  const s = Object.keys(search).length > 1 ? {$and: search} : search

  return parseSearchEntry(query, jsonExtract, s)
}

function parseSearchEntry(query, jsonExtract, search) {
  for (let key in search) {
    if (key in logicalOperators) {
      console.log('LOGICAL:', key)
      return logicalOperators[key](query, jsonExtract, search[key])
    } else {
      const field = key
      const value = search[key]

      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        
        // if (!(operator in queryOperators)) {
        //   throw new Error(`opertaor '${operator}' not valid`)
        // }

        console.log('QUERY:', operator)
        return queryOperators[operator](query, jsonExtract, field, expression)

        // throw new Error(`operator '${key}' has invalid value: ${JSON.stringify(search[key])}`)
      }

      // implied $eq (could be nested object)

      // if(isObject(value)) {
      //   // nested object equality
      // }

      return queryOperators.$eq(query, jsonExtract, field, search[key])
    }
    // } else if (key in queryOperators) {
    //   console.log('QUERY:', key)
    //   return queryOperators[key](query, jsonExtract, key, )
    // } else {
    //   // assume implicit equals if the operator is not found
    //   console.log('OTHER:', key)
    //   return queryOperators.$eq(query, jsonExtract, l, r)
    // }
  }  
}

function getOperandValue(operand) {
  if (isObject(operand)) {
    return `'${JSON.stringify(operand)}'`
  } else if (isNumber('number')) {
    return operand
  } else { // string
    return `'${operand}'`
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
