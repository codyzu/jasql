import {isString, isPlainObject as isObject, isNumber} from 'lodash'

const queryOperators = {
  $eq: (q, j, l, r) => `${j(l)} = ${getOperandValue(r)}`,
  $lt: (q, j, l, r) => `${j(l)} < ${getOperandValue(r)}`,
  $gt: (q, j, l, r) => `${j(l)} > ${getOperandValue(r)}`
}

const logicalOperators = {
  $and: (q, j, exps) => exps.map((e) => `(${parseSearchEntry(q, j, e)})`).join(' and '),
  $or: (q, j, exps) => exps.map((e) => `(${parseSearchEntry(q, j, e)})`).join(' or ')
}

export default function parseSearch (query, jsonExtract, search) {
  const s = Object.keys(search).length > 1 ? {$and: Object.keys(search).map((k) => {
    const o = {}
    o[k] = search[k]
    return o
  })} : search

  console.log('SEARCH:', s)

  return parseSearchEntry(query, jsonExtract, s)
}

function parseSearchEntry (query, jsonExtract, search) {
  for (let key in search) {
    if (key in logicalOperators) {
      console.log('LOGICAL:', key)
      const exps = search[key]
      console.log('EXPRESSIONS:', exps)
      return logicalOperators[key](query, jsonExtract, exps)
    } else {
      const field = key
      const value = search[key]
      console.log(`KEY: ${field} VALUE: ${value}`)

      if (Object.keys(value).length === 1 && Object.keys(value)[0] in queryOperators) {
        // query operator
        const operator = Object.keys(value)[0]
        const expression = value[operator]
        return queryOperators[operator](query, jsonExtract, field, expression)
      }

      // implied $eq (could be nested object)

      return queryOperators.$eq(query, jsonExtract, field, search[key])
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

