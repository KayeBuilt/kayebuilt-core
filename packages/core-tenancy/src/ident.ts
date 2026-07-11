/**
 * Quotes a Postgres identifier (table/column/role name) for safe interpolation
 * into raw DDL strings (`CREATE POLICY`, `GRANT`, ...) where drizzle's
 * parameterized `sql` tag can't be used because Postgres doesn't accept bound
 * parameters in place of identifiers. Doubling embedded `"` is the standard
 * Postgres escape for a quoted identifier.
 */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
