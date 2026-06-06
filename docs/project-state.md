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
- **[Completed]** Sprint 9: 데이터 저장 트랜잭션 안정화 & 대시보드 시각화 색상/필터 최적화.
- **[Completed]** Sprint 10: 온보딩 Step 0 개인/가족/지출 정보 신설 및 대시보드 범례/차트 UX 고도화.

## Active Sprint / Story
- **Sprint 10**: 온보딩 Step 0 개인/가족/지출 정보 신설 및 대시보드 범례/차트 UX 고도화 — **COMPLETED**
  - **[Story S10-1]** [Completed] 대시보드 3층 연금구조 하우스 세로폭 확대 및 범례 배치 동기화 (1층 ➔ 2층 ➔ 3층 순서)
  - **[Story S10-2]** [Completed] Prisma schema 및 Zustand 스토어에 현재나이, 가족 프로필, 노후 지출 목표 필드 추가 및 로컬 DB 마이그레이션
  - **[Story S10-3]** [Completed] 온보딩 Wizard에 `STEP 0` 개인/가족/노후재무설계 입력 단계 신설 및 DB 저장 API 연동

