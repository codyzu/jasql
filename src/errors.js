export class JasqlError extends Error {}

export class DocumentNotFoundError extends JasqlError {
  constructor (id) {
    super(`The document with id '${id}' was not found`)
  }
}

export class DatabaseError extends JasqlError {
  constructor (cause) {
    super(`An error occured while accessing database: ${cause}`)
    this.cause = cause
  }
}
