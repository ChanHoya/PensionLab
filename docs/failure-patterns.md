# Failure Patterns

- **FP-001**: Prisma 7 does not support `url` in `schema.prisma`. Always configure connection urls in `prisma.config.ts` and instantiate the client using `@prisma/adapter-pg`.
- **FP-002**: Local `pgvector` compilation must match the target PostgreSQL instance version (e.g., PostgreSQL 16 instead of 17/18 installed by default on brew).
