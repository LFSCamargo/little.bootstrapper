# Rule: orm-database-rules

> Database & ORM safety rules for Kysely, Drizzle, TypeORM, and Mongoose.

- **Parameterized queries only**: Never interpolate user input into raw SQL or MongoDB `$where` expressions.
- **Zero N+1 queries**: Use `JOIN`s, `IN (...)` batch queries, Drizzle relational queries, or DataLoaders instead of queries inside loops.
- **Explicit column projections**: Avoid `SELECT *` in API hot paths; select only required columns to prevent over-fetching and secret leaks.
- **Index every foreign key & hot filter**: Define explicit composite indexes in migrations/schemas and verify query plans on large tables.
- **Atomic multi-write transactions**: Wrap related mutations in explicit DB transactions and keep migrations reversible.
