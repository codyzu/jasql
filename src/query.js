import {isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (j, l, r) => `${j(l)} = ${getOperandValue(r)}`,
  $lt: (j, l, r) => `${j(l)} < ${getOperandValue(r)}`,
  $gt: (j, l, r) => `${j(l)} > ${getOperandValue(r)}`
}

const logicalOperators = {
  $and: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' and '),
  $or: (j, exps) => exps.map((e) => `(${parseSearchEntry(j, e)})`).join(' or ')
}

export default function parseSearch (jsonExtract, search) {
  const s = Object.keys(search).length > 1 ? {$and: Object.keys(search).map((k) => {
    const o = {}
    o[k] = search[k]
    return o
  })} : search

  console.log('SEARCH:', s)

  return parseSearchEntry(jsonExtract, s)
}

function parseSearchEntry (jsonExtract, search) {
  for (let key in search) {
    if (key in logicalOperators) {
      // logical operator: { $operator: [exp1, exp2, ...]}

      const operator = key
      const expressions = search[key]
      return logicalOperators[operator](jsonExtract, expressions)
    } else {
      const field = key
      const value = search[key]
      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator: { field: { $operator: expression }}
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        return queryOperators[operator](jsonExtract, field, expression)
      }

      // implied equals: { field1: value1} or { field1: {nested: object}

      return queryOperators.$eq(jsonExtract, field, search[key])
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

