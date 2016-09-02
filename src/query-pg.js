import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (path, value, ctx) => ctx.whereQuery(path, '=', value),
  $lt: (path, value, ctx) => ctx.whereQuery(path, '<', value),
  $gt: (path, value, ctx) => ctx.whereQuery(path, '>', value)
}

const logicalOperators = {
  $and: (exps, ctx) => ctx.whereLogical('AND', exps),
  $or: (exps, ctx) => ctx.whereLogical('OR', exps)
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

    this.query = sql
      .distinct(`${this.tableName}.${this.jsonColName}`, `${this.tableName}.${this.idColName}`)
  }

  whereQuery (path, operator, value) {
    const jsonColumnBinding = this.addBinding(`${this.tableName}.${this.jsonColName}`)
    const pathAsObject = path.split('.').join(',')
    const valueBinding = this.addBinding(getOperandValue(value))
    return `:${jsonColumnBinding}:${isObject(value) ? '#>' : '#>>'}'{${pathAsObject}}' ${operator} :${valueBinding}`
  }

  whereLogical (operator, expressions) {
    const ctx = this
    return expressions.map((exp, index) => {
      const currSql = `(${parseSearchEntry(exp, ctx)})`
      console.log(`OPERATOR ${operator}:`, currSql)

      // only join a new table if we are not at the last index
      if (index < expressions.length - 1) {
        ctx._joinTable()
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

  _joinTable () {
    this.joins += 1
  }

  finalize (whereRaw) {
    console.log('WHERE:', whereRaw)
    console.log('BINDINGS: ', this.bindings)
    console.log('JOINS:', this.joins)

    // add a json table using json_tree for each join
    // const fromRaw = [...Array(this.joins + 1).keys()]
    //   .reduce((raw, index) => {
    //     raw.sql = `${raw.sql}, json_tree(??) as ??`
    //     raw.bindings = [...raw.bindings, `${this.tableName}.${this.jsonColName}`, `json${index}`]
    //     return raw
    //   }, {sql: '??', bindings: [this.tableName]})

    return this.query
      .from(`${this.tableName}`)
      .whereRaw(whereRaw, this.bindings)
  }
}
