# Rule: rest-api-anti-patterns

> REST API anti-patterns for Express, Fastify, Hono, Elysia, Koa, Go (Fiber/Gin/Chi/Echo), and Rust (Axum/Hyper).

- **Validate every boundary with schemas**: Parse params, query, headers, and bodies with Zod / struct validators before touching domain logic.
- **Never allow unbounded queries**: Enforce maximum `limit`/`pageSize` caps and cursor-based pagination on all list endpoints.
- **Eliminate N+1 queries**: Batch lookups with `JOIN`s, `IN (...)`, or DataLoaders; never run SQL queries inside request loops.
- **Enforce timeouts & graceful shutdown**: Set server/DB/upstream timeouts and drain in-flight requests cleanly on `SIGTERM`/`SIGINT`.
- **Never leak internal errors**: Return structured problem responses (`code`, `message`, `requestId`) without stack traces or raw SQL errors.
- **Rate-limit & authenticate by default**: Apply authentication, authorization checks (prevent IDOR/BOLA), and rate limiting at route boundaries.
