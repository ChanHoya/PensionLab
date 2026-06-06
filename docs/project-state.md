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
- **Sprint 7**: 개인연금 및 퇴직연금(IRP) 계좌 실데이터 연동 (Codef FSS API 2-Way 연동) — **COMPLETED**
  - **[Completed] Story S7-1**: 금융감독원 통합연금포털 Codef API 간편인증 동기화 및 UI 개발
    - route.ts: 금융감독원 기관코드("0020") 기반 등록 연금 조회 API 및 2-Way 간편인증 분기 처리, 데이터 자동 정제 로직 구축
    - onboarding/page.tsx: 퇴직연금 및 개인연금 단계에 FSS 간편인증 탭 및 스마트폰 푸시 본인인증 대기 상태 머신 이식
    - Zustand: 스크래핑된 계좌 정보(DB/DC/IRP, 개인연금저축, 연금보험)를 파싱하여 스토어에 일괄 바인딩 처리 완료






