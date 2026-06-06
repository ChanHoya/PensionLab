# Failure Patterns

- **FP-001**: Prisma 7 does not support `url` in `schema.prisma`. Always configure connection urls in `prisma.config.ts` and instantiate the client using `@prisma/adapter-pg`.
- **FP-002**: Local `pgvector` compilation must match the target PostgreSQL instance version (e.g., PostgreSQL 16 instead of 17/18 installed by default on brew).
- **FP-003**: In Next.js client components utilizing SSR with dynamic libraries (like Recharts), always wrap the component rendering in client-side mounting protection (e.g., `isMounted` state checked after `useEffect` mount) to prevent React hydration mismatch warnings.
- **FP-004**: Executing batch scripts via standard `node` that require TypeScript imports (such as custom-generated Prisma Clients) will fail in CJS. Always execute them using `tsx` (e.g., `npx tsx scripts/script-name.ts` or configure script scripts using tsx).
