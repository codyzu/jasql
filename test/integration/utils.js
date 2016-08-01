export function deleteAllRows (jasql) {
  return jasql.db(jasql.tableName).del()
}
