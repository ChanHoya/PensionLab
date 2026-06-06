# Failure Patterns

- **FP-001**: Prisma 7 does not support `url` in `schema.prisma`. Always configure connection urls in `prisma.config.ts` and instantiate the client using `@prisma/adapter-pg`.
- **FP-002**: Local `pgvector` compilation must match the target PostgreSQL instance version (e.g., PostgreSQL 16 instead of 17/18 installed by default on brew).
- **FP-003**: In Next.js client components utilizing SSR with dynamic libraries (like Recharts), always wrap the component rendering in client-side mounting protection (e.g., `isMounted` state checked after `useEffect` mount) to prevent React hydration mismatch warnings.
- **FP-004**: Executing batch scripts via standard `node` that require TypeScript imports (such as custom-generated Prisma Clients) will fail in CJS. Always execute them using `tsx` (e.g., `npx tsx scripts/script-name.ts` or configure script scripts using tsx).
- **FP-005**: In Next.js App Router, client-side components that call `useSearchParams()` must be wrapped in a `<Suspense>` boundary. If they are not wrapped, Next.js bails out of static generation, causing `next build` to fail during prerendering.
- **FP-006**: In Next.js App Router (Turbopack), changes to `.env` variables (e.g., Codef API credentials) might not automatically clear cache for dynamic route handlers. The dev server must be manually restarted to reload environment variables.
- **FP-007**: When testing PASS Easy Authentication via Codef, the telecom carrier code (`telecom`: SKT "0", KT "1", LGU+ "2") is a mandatory parameter. Missing carrier codes will prevent the authorization push from reaching the smartphone.
- **FP-008**: FSS API(통합연금포털) 연동 시, 다수의 계좌 정보가 단일 API 응답으로 함께 반환됩니다. 이를 Zustand 스토어에 바인딩할 때 기존 저장된 계좌들을 먼저 클리어하지 않으면 이전 수동 입력값이나 기존 정보와 합산되어 중복 누적 연산 에러가 발생하므로, 일괄 삭제 후 추가 루프를 돌아야 합니다.
