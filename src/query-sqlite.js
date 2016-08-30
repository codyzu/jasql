import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (path, value, ctx) => {
    return ctx.whereQuery(path, '=', value)
  }
  // $lt: (sql, path, value) => `${j(field)} < ${getOperandValue(value)}`,
  // $gt: (sql, path, value) => `${j(field)} > ${getOperandValue(value)}`
}

const logicalOperators = {
  // $and: (sql, exps) => exps.reduce((prev, cur, index) => {
  $and: (exps, ctx) => ctx.whereLogical('AND', exps, 'innerJoin'),
  // $or: (exps, ctx) => ctx.whereLogical('OR', exps, 'fullOuterJoin')
  // $or: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' or ')
}

export default function parseSearch (search, sql, tableName, jsonColName, idColName) {
  const s = Object.keys(search).length > 1 ? {$and: Object.keys(search).map((k) => {
    const o = {}
    o[k] = search[k]
    return o
  })} : search

  const ctx = new QueryContext(sql, tableName, jsonColName, idColName)
  const whereRaw = parseSearchEntry(s, ctx)

  return ctx.finalize(whereRaw)
}

function parseSearchEntry (query, ctx) {
  for (let key in query) {
    if (key in logicalOperators) {
      console.log('LOGICAL:', key)
      // logical operator: { $operator: [exp1, exp2, ...]}

      const operator = key
      const expressions = query[key]
      return logicalOperators[operator](expressions, ctx)
    } else {
      const field = key
      const value = query[key]
      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator: { field: { $operator: expression }}
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        return queryOperators[operator](field, expression, ctx)
      }

      // implied equals: { field1: value1} or { field1: {nested: object}
      console.log('IMPLIED EQUALS')
      return queryOperators.$eq(field, query[key], ctx)
    }
  }
}

function getOperandValue (operand) {
  if (isObject(operand)) {
    return JSON.stringify(operand)
  } else if (isNumber(operand)) {
    return operand
  } else { // string
    return operand
  }
}

class QueryContext {
  constructor (sql, tableName, jsonColName, idColName) {
    this.sql = sql
    this.tableName = tableName
    this.jsonColName = jsonColName
    this.idColName = idColName

    this.bindings = {}
    this.joins = 0

    const fromClause = this._fromTablesClause()

    this.query = sql
      .distinct(`${this._currentJasqlTableName()}.${this.jsonColName}`)
      .from(sql.raw(fromClause.sql, fromClause.bindings))
  }

  _currentJasqlTableName () {
    return `jasql${this.joins}`
  }

  _currentJsonTableName () {
    return `json${this.joins}`
  }

  _fromTablesClause () {
    return {
      sql: `?? as ??, json_tree(??) as ??`,
      bindings: [
        this.tableName, this._currentJasqlTableName(),
        `${this._currentJasqlTableName()}.${this.jsonColName}`, this._currentJsonTableName()
      ]
    }
  }

  whereQuery (path, operator, value) {
    const valueBinding = this.addBinding(getOperandValue(value))
    const pathColumn = this.addBinding(`${this.currentTable()}.fullkey`)
    const valueColumn = this.addBinding(`${this.currentTable()}.value`)
    const sql = `:${pathColumn}: ${operator} '$.${path}' AND :${valueColumn}: = :${valueBinding}`
    return sql
  }

  whereLogical (operator, expressions, joinOperation) {
    const ctx = this
    return expressions.map((exp, index) => {
      const currSql = `(${parseSearchEntry(exp, ctx)})`
      console.log(`OPERATOR ${operator}:`, currSql)

      // only join a new table if we are not at the last index
      if (index < expressions.length - 1) {
        ctx._joinTable(joinOperation)
      }

      return currSql
    }).join(` ${operator} `)
  }

  addBinding (value) {
    const bindingKey = `param${Object.keys(this.bindings).length}`
    this.bindings[bindingKey] = value
    return bindingKey
  }

  currentTable () {
    return `json${this.joins}`
  }

  _joinTable (joinOperation) {
    console.log('JOINING')
    const currentJasqlTable = this._currentJasqlTableName()

    this.joins += 1

    const fromClause = this._fromTablesClause()

    // join another table
    this.query[joinOperation](this.sql.raw(`${fromClause.sql} ON ?? = ??`, [
      ...fromClause.bindings,
      `${currentJasqlTable}.${this.idColName}`, `${this._currentJasqlTableName()}.${this.idColName}`
    ]))

    return this.currentTable()
  }

  finalize (whereRaw) {
    console.log('WHERE:', whereRaw)
    console.log('BINDINGS: ', this.bindings)
    console.log('JOINS:', this.joins)
    return this.query.whereRaw(whereRaw, this.bindings)
  }
}
