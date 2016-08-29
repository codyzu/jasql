import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (sql, path, value, ctx, tableAlias) => {
    console.log('PATH:', `$.${path}`)
    console.log('VALUE:', getOperandValue(value))
    // const pathBinding = nextBinding(bindings)
    // bindings[pathBinding] = `$.${path}`
    const valueBinding = ctx.addBinding(getOperandValue(value))
    const pathColumn = ctx.addBinding(`${tableAlias}.fullkey`)
    const valueColumn = ctx.addBinding(`${tableAlias}.value`)
    return `:${pathColumn}: = '$.${path}' AND :${valueColumn}: = :${valueBinding}`
  }
  // $lt: (sql, path, value) => `${j(field)} < ${getOperandValue(value)}`,
  // $gt: (sql, path, value) => `${j(field)} > ${getOperandValue(value)}`
}

const logicalOperators = {
  // $and: (sql, exps) => exps.reduce((prev, cur, index) => {
  $and: (sql, exps, ctx, tableAlias) => exps.map((exp, index) => {
    const currTable = index ? ctx.addTable() : tableAlias
    return `(${parseSearchEntry(sql, exp, ctx, currTable)})`
  }).join(' AND ')

  // $and: (sql, exps) => exps.reduce((prev, cur, index) => {
  //   console.log('AND')
  //   const currSql = parseSearchEntry(sql, cur).wrap('(', ')')

  //   console.log('AND PREV:', prev)
  //   console.log('AND CUR:', currSql)

  //   if (prev) {
  //     return prev.andWhere(currSql)
  //   } else {
  //     return currSql
  //   }
  // })
  // $and: (sql, exps) => exps.map((e) => `(${parseSearchEntry(sql, e)})`).join(' AND ') // ,
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
  console.log('BINDINGS', bindings)
  curQuery.where(sql.raw(whereRaw, bindings))
}

function parseSearchEntry (sql, query, ctx, tableAlias) {
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
        return queryOperators[operator](sql, field, expression, ctx, tableAlias)
      }

      // implied equals: { field1: value1} or { field1: {nested: object}
      console.log('IMPLIED EQUALS')
      return queryOperators.$eq(sql, field, query[key], ctx, tableAlias)
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
    this.tables = 1
  }

  addBinding (value) {
    const bindingKey = `param${Object.keys(this.bindings).length}`
    this.bindings[bindingKey] = value
    return bindingKey
  }

  getCurrentTableAlias () {
    return `json${this.tables}`
  }

  addTable () {
    this.tables += 1
    return this.getCurrentTableAlias
  }
}
