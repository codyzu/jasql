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
      ctx.addTable()
    }

    return currSql
  }).join(' AND ')
  // $or: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' or ')
}

export default function parseSearch (query, sql, curQuery) {
  const s = Object.keys(query).length > 1 ? {$and: Object.keys(query).map((k) => {
    const o = {}
    o[k] = query[k]
    return o
  })} : query

  // console.log('SEARCH:', s)
  // sql.from('json_tree(jsonColName)')

  const ctx = new QueryContext()
  const bindings = {}
  const whereRaw = parseSearchEntry(sql, s, ctx)
  console.log('RAW:', whereRaw)
  console.log('BINDINGS', ctx.bindings)
  console.log('TABLE COUNT:', ctx.tableCount)
  for (let index = 0; index < ctx.tableCount; index++) {
    console.log('JOIN')
    if (index === 0) {
      curQuery.from(sql.raw(`?? as ??, json_tree(??) as ??`, ['JASQL', `jasql${index}`, 'JASQL.doc', `json${index}`]))
    } else {
      curQuery.joinRaw(`JASQL as jasql${index}, json_tree(JASQL.doc) as json${index} ON jasql${index - 1} = jasql${index}`)
    }
  }
  curQuery.where(sql.raw(whereRaw, ctx.bindings))
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
    this.tableIndex = 0
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
    return `json${this.tableIndex}`
  }

  addTable () {
    this.tableCount += 1
    return this.currentTable()
  }
}
