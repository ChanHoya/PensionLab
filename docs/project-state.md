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
- **[Completed]** Sprint 11: 활동기 집중형(체감식) 은퇴 연금 인출전략 도입 및 대시보드 차트 레이아웃 2차 고도화.
- **[Completed]** Sprint 12: MiniMax M3 모델 API 연동 및 은퇴 자산 포트폴리오 진단/연금 리밸런싱 처방 기능 개발.

## Active Sprint / Story
- **Sprint 12**: MiniMax M3 모델 API 연동 및 은퇴 자산 포트폴리오 진단/연금 리밸런싱 처방 기능 개발 — **COMPLETED**
  - **[Story S12-1]** [Completed] MiniMax M3 모델 OpenAI SDK 호환 API 연동 구현 (`src/app/api/ai/advisor/route.ts`)
  - **[Story S12-2]** [Completed] 대시보드 헤더 메뉴 링크 연동 및 글래스모피즘 기반 AI Advisor UI 페이지 (`src/app/dashboard/ai-advisor/page.tsx`) 구축
  - **[Story S12-3]** [Completed] MiniMax M3의 고성능 Reasoning 사고 과정(Thinking) 파싱 및 클라이언트 아코디언 렌더링 구현
  - **[Story S12-4]** [Completed] 로컬 개발 서버 환경 동작 및 렌더링 검증 완료 (TypeScript 빌드 이상 무)

