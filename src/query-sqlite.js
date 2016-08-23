import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (sql, path, value) => sql.raw('json_tree.fullkey = ? AND json_tree.value = ?', [`$.${path}`, value])
  // $lt: (sql, path, value) => `${j(field)} < ${getOperandValue(value)}`,
  // $gt: (sql, path, value) => `${j(field)} > ${getOperandValue(value)}`
}

const logicalOperators = {
  $and: (sql, exps) => exps.reduce((prev, cur, index) => {
    const currSql = parseSearchEntry(sql, cur).wrap('(', ')')

    if (prev) {
      return prev.andWhere(currSql)
    } else {
      return currSql
    }
  })
  // $and: (sql, exps) => exps.map((e) => `(${parseSearchEntry(sql, e)})`).join(' AND ') // ,
  // $or: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' or ')
}

export default function parseSearch (query, sql, jsonColName) {
  const s = Object.keys(query).length > 1 ? {$and: Object.keys(query).map((k) => {
    const o = {}
    o[k] = query[k]
    return o
  })} : query

  console.log('SEARCH:', s)
  sql.from('json_tree(jsonColName)')

  return parseSearchEntry(sql, s)
}

function parseSearchEntry (sql, query) {
  for (let key in query) {
    if (key in logicalOperators) {
      // logical operator: { $operator: [exp1, exp2, ...]}

      const operator = key
      const expressions = query[key]
      return logicalOperators[operator](sql, expressions)
    } else {
      const field = key
      const value = query[key]
      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator: { field: { $operator: expression }}
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        return queryOperators[operator](sql, field, expression)
      }

      // implied equals: { field1: value1} or { field1: {nested: object}

      return queryOperators.$eq(sql, field, query[key])
    }
  }
}

function getOperandValue (operand) {
  if (isObject(operand)) {
    return `'${JSON.stringify(operand)}'`
  } else if (isNumber(operand)) {
    return operand
  } else { // string
    return `'${operand}'`
  }
}

