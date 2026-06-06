# Project State

## Quick Summary
- Next.js 14+ responsive web app initialized with TypeScript, App Router, and Vanilla CSS.
- PostgreSQL 16 local database set up with `pgvector` extension.
- Prisma 7 models created and successfully migrated (with HNSW vector index).
- Database singleton client pool configured and validated.
- **[Completed]** Story S1-1: Zustand client state store, Landing page, Onboarding wizard, and save API.
- **[Completed]** Story S1-2: Pension Calculation Engine (calculating 3-tier payouts and 2026 reform schedules) and Dashboard UI integrated with Recharts Donut & Stacked Area charts.
- **[Completed]** Story S1-3: YouTube Expert Content Crawler and RAG Chat Q&A API using pgvector and OpenAI.
- **[Completed]** Story S2-1: YouTube Video Player Modal integration in RAG Q&A Chat.
- **[Completed]** Story S2-2: Premium Report PDF Generation & Toss Payments mock integration.
- **[Completed]** Story S2-3: NPS Codef API Sync Mock & Onboarding Integration.
- **[Completed]** Story S3-1: Zustand LocalStorage Caching & Hydration Patch.
- **[Completed]** Story S3-2: JSON Backup Export/Import & Privacy Warning Banner.
- **[Completed]** Story S4-1: Prisma Client Generation & Vercel/Render Cloud Deployment Configuration (with DB SSL & Gemini API Support).
- **[Completed]** Sprint 5: UI/UX ETF Lens Theme Sync, PDF Viewer fixed, 3-Tier House Chart, and Navigation Highlighting/Alignment.
- **[Completed]** Sprint 6: National Pension Service (NPS) Codef 2-Way Easy Authentication Integration & UI State Machine.
- **[Completed]** Sprint 7: 금융감독원(FSS) 통합연금포털 API 2-Way 간편인증 연동 및 UI 개발.

## Active Sprint / Story
- **Sprint 8**: 대시보드 차트 시각화 UX 개선 & 온보딩 저장 오류 트러블슈팅 — **PLANNING**
  - **[Story S8-1]** 온보딩 최종 저장 API(`route.ts`) 에러 디버깅 및 Vercel 자동 마이그레이션 배포
  - **[Story S8-2]** 대시보드 3층 연금구조 하우스 차트 가운데 정렬 및 가로폭 최적화 (범례 하단 가로 배치)
  - **[Story S8-3]** 생애연금 시뮬레이션 AreaChart 폰트 크기 축소 및 다크 테마 커스텀 툴팁(Tooltip) 구현







