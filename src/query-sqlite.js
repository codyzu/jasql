import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (sql, path, value, ctx) => {
    return ctx.query(path, '=', value)
  }
  // $lt: (sql, path, value) => `${j(field)} < ${getOperandValue(value)}`,
  // $gt: (sql, path, value) => `${j(field)} > ${getOperandValue(value)}`
}

const logicalOperators = {
  // $and: (sql, exps) => exps.reduce((prev, cur, index) => {
  $and: (sql, exps, ctx) => exps.map((exp, index) => {
    const currSql = `(${parseSearchEntry(sql, exp, ctx)})`
    console.log('AND:', currSql)
    if (index < exps.length - 1) {
      console.log('INCREMENT TABLE')
      ctx.addTable()
    }

    return currSql
  }).join(' AND ')
  // $or: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' or ')
}

export default function parseSearch (search, sql) {
  const s = Object.keys(search).length > 1 ? {$and: Object.keys(search).map((k) => {
    const o = {}
    o[k] = search[k]
    return o
  })} : search

  // console.log('SEARCH:', s)
  // sql.from('json_tree(jsonColName)')

  const ctx = new QueryContext()
  const whereRaw = parseSearchEntry(sql, s, ctx)
  console.log('RAW:', whereRaw)
  console.log('BINDINGS', ctx.bindings)
  console.log('TABLE COUNT:', ctx.tableCount)

  const query = sql
    .distinct('jasql0.doc')

  for (let index = 0; index < ctx.tableCount; index++) {
    console.log('JOIN')
    if (index === 0) {
      query.from(sql.raw(`?? as ??, json_tree(??) as ??`, ['JASQL', `jasql${index}`, `jasql${index}.doc`, `json${index}`]))
    } else {
      query.innerJoin(sql.raw(`?? as ??, json_tree(??) as ?? ON ?? = ??`, ['JASQL', `jasql${index}`, `jasql${index}.doc`, `json${index}`, `jasql${index - 1}.id`, `jasql${index}.id`]))
    }
  }
  query.where(sql.raw(whereRaw, ctx.bindings))
  return query
}

function parseSearchEntry (sql, query, ctx) {
  for (let key in query) {
    if (key in logicalOperators) {
      console.log('LOGICAL:', key)
      // logical operator: { $operator: [exp1, exp2, ...]}

      const operator = key
      const expressions = query[key]
      return logicalOperators[operator](sql, expressions, ctx)
    } else {
      const field = key
      const value = query[key]
      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator: { field: { $operator: expression }}
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        return queryOperators[operator](sql, field, expression, ctx)
      }

      // implied equals: { field1: value1} or { field1: {nested: object}
      console.log('IMPLIED EQUALS')
      return queryOperators.$eq(sql, field, query[key], ctx)
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

// function nextBinding (bindings) {
//   return `param${Object.keys(bindings).length}`
// }

// function addBinding(bindings, value) {
//   const bindingKey = `param${Object.keys(bindings).length}`
//   bindings[bindingKey] = value
//   return bindingKey
// }

class QueryContext {
  constructor () {
    this.bindings = {}
    this.tableCount = 1
    // this.tableIndex = 0
  }

  query (path, operator, value) {
    const valueBinding = this.addBinding(getOperandValue(value))
    const pathColumn = this.addBinding(`${this.currentTable()}.fullkey`)
    const valueColumn = this.addBinding(`${this.currentTable()}.value`)
    const sql = `:${pathColumn}: ${operator} '$.${path}' AND :${valueColumn}: = :${valueBinding}`
    console.log('QUERY SQL:', sql)
    return sql
  }

  addBinding (value) {
    const bindingKey = `param${Object.keys(this.bindings).length}`
    console.log('BINDING KEY:', bindingKey)
    console.log('BINDING VALUE:', value)
    this.bindings[bindingKey] = value
    return bindingKey
  }

  currentTable () {
    // return `json${this.tableIndex}`
    return `json${this.tableCount - 1}`
  }

  addTable () {
    this.tableCount += 1
    return this.currentTable()
  }
}
