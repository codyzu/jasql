import parser from 'mongo-parse'

const simpleComparators = {
  $gt: function (a, b) { return a > b },
  $gte: function (a, b) { return a >= b },
  $lt: function (a, b) { return a < b },
  $lte: function (a, b) { return a <= b },
  $ne: function (a, b) { return a !== b }

  // $mod:function(docValue,operand) {return docValue%operand[0] === operand[1]},
  // $regex:function(docValue,operand) {return typeof(docValue) === 'string' && docValue.match(RegExp(operand)) !== null},

  // $exists:function(docValue,operand) {return (docValue !== undefined) === operand},

  // $in:function(docVal,operand) {
  //     if(Array.isArray(docVal)) {
  //         return docVal.some(function(val) {
  //             return operand.indexOf(val) !== -1;
  //         });
  //     } else {
  //         return operand.indexOf(docVal) !== -1
  //     }
  // },
  // $nin:function(docVal,operand) {
  //     if(Array.isArray(docVal)) {
  //         return docVal.every(function(val) {
  //             return operand.indexOf(val) === -1;
  //         });
  //     } else {
  //         return operand.indexOf(docVal) === -1
  //     }
  // },
  // $all:function(docVal,operand) {
  //     return docVal instanceof Array && docVal.reduce(function(last,cur) {
  //         return last && operand.indexOf(cur) !== -1
  //     },true)
  // },
}

var compoundOperatorComparators = {
  $and: function (document, parts) {
    for (let n = 0; n < parts.length; n++) {
      if (!matches(parts[n].parts, document)) {
        return false
      }
    }
    // else
    return true
  }
  // $or: function (document, parts) {
  //   for(var n=0;  n<parts.length; n++) {
  //     if(matches(parts[n].parts, document)) {
  //       return true
  //     }
  //   }
  //   // else
  //   return false
  // },
  // $nor: function (document, parts) {
  //   for(var n=0;  n<parts.length; n++) {
  //     if(matches(parts[n].parts, document)) {
  //       return false
  //     }
  //   }
  //   // else
  //   return true
  // }
}

export default function parse (q) {
  const query = parser.parse(q)
  return query
}

var matches = function (parts, document, validate) {
  // if(validate !== false) {
  //   validateDocumentObject(document)
  // }

  for (let n = 0; n < parts.length; n++) {
    let part = parts[n]
    if (!partMatches(part, document)) {
      return false
    }
  }
  // else

  return true
}

function partMatches (part, document) {
  if (part.operator in simpleComparators) {
    return true
  } else if (part.operator in compoundOperatorComparators) {
    return true
  }

  // var pointers = DotNotationPointers(document, part.field)
  // for(var p=0; p<pointers.length; p++) {
  //   var pointer = pointers[p]

  //   if(part.operator === undefined) { // equality
  //     if(!valueTest(pointer.val, part.operand, mongoEqual)) {
  //       continue; // this part doesn't match
  //     }
  //   } else if(part.operator in simpleComparators) {
  //     var test = valueTest(pointer.val, part.operand, simpleComparators[part.operator])
  //     if(!test)
  //       continue; // this part doesn't match
  //   } else if(part.operator in compoundOperatorComparators) {
  //     if(!compoundOperatorComparators[part.operator](document, part.parts)) {
  //       continue; // this part doesn't match
  //     }
  //   } else if(part.operator === '$not') {
  //     if(part.parts.length > 0) {
  //       if(matches(part.parts, document)) {
  //         continue; // this part doesn't match
  //       }
  //     } else {
  //       if(valueTest(pointer.val, part.operand, mongoEqual) === true)
  //         continue; // this part doesn't match
  //     }
  //   } else if(part.operator === '$size') {
  //     return pointer.val instanceof Array && pointer.val.length === part.operand

  //   } else if(part.operator === '$elemMatch') {
  //     var documentField = pointer.val
  //     if(documentField === undefined)
  //       continue; // this part doesn't match

  //     if(part.implicitField) {
  //       for(var n=0; n<part.parts.length; n++) {
  //         part.parts[n].field = 'x' // some fake field so it can be tested against
  //       }
  //     }

  //     var anyMatched = false
  //     for(var n=0; n<documentField.length; n++) {
  //       if(part.implicitField) {
  //         var documentToMatch = {x:documentField[n]}
  //       } else {
  //         var documentToMatch = documentField[n]
  //       }

  //       if(matches(part.parts, documentToMatch)) {
  //         anyMatched = true
  //         break;
  //       }
  //     }
  //     if(!anyMatched)
  //       continue; // this part doesn't match

  //   } else if(part.operator === '$where') {
  //     if(part.field !== undefined) {
  //       var objectContext = pointer.val
  //     } else {
  //       var objectContext = document
  //     }

  //     if(!part.operand.call(objectContext))
  //       continue; // this part doesn't match
  //   } else if(part.operator === '$comment') {
  //     return true // ignore it
  //   } else {
  //     throw new Error("Unsupported operator: "+parts.operator)
  //   }
  //   // else
  //   return true
  // }
  // // else
  // return false
}
