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
- **[Completed]** Sprint 8: 대시보드 차트 시각화 UX 개선 & 온보딩 저장 오류 트러블슈팅.

## Active Sprint / Story
- **Sprint 9**: 데이터 저장 트랜잭션 안정화 & 대시보드 시각화 색상/필터 최적화 — **COMPLETED**
  - **[Completed] Story S9-1**: 온보딩 데이터 저장 Prisma 트랜잭션 타임아웃 연장 ({ timeout: 15000 })
  - **[Completed] Story S9-2**: 대시보드 수령액 시뮬레이션 그래프에서 금액이 0원인 연금 제외 (Area & 범례 필터링)
  - **[Completed] Story S9-3**: 1/2/3층 대시보드 차트 색상 테마 동기화 (패밀리 룩 HSL/HEX 색상 적용) 및 툴팁 나이 뒤 '세' 접미사 추가
