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
- **[Completed]** Sprint 12: Gemini 2.0 Flash 단일 모델 API 연동 및 은퇴 자산 포트폴리오 진단/연금 리밸런싱 처방 기능 개발, 404 라우트 구현 및 DB 풀링 최적화.
- **[Completed]** Sprint 13: 시뮬레이터 차트 및 레이아웃 복구, Gemini API 진단 디버깅 최적화, 대한민국 정책브리핑 RSS 실시간 뉴스 연동 및 유튜브 가이드 카드 추가 배치 완료, Gemini 3.5 Flash 최신 모델 마이그레이션.

## Active Sprint / Story
- **Sprint 13**: 시뮬레이터 UI 복구, Gemini 진단 에러 디버그 노출 및 정책 뉴스 실시간 연동 & 유튜브 연계 — **COMPLETED**
  - **[Story S13-1]** [Completed] 시뮬레이터 페이지 Recharts ResponsiveContainer 높이 붕괴 수정 및 설명글 겹침 현상 해결
  - **[Story S13-2]** [Completed] 좌/우측 카드 타이틀의 수평 정렬 일치화를 위한 대칭형 `chartTitleContainer` 헤더 구조 적용
  - **[Story S13-3]** [Completed] Gemini API key 에러 발생 시 구체적인 디버깅 예외 로그를 클라이언트 `thinking` 최상단에 바인딩하여 진단성 강화
  - **[Story S13-4]** [Completed] 대한민국 정책브리핑 RSS 실시간 뉴스 수집 API (`/api/news`) 구현 및 HTML 정제 가공
  - **[Story S13-5]** [Completed] 뉴스 상세 모달 내 정책 포털 아웃링크("정책 원문 보기 ➔") 탑재 및 유튜브 전문가 추천 아웃링크 카드 신설
  - **[Story S13-6]** [Completed] Gemini API의 gemini-2.0-flash 모델 만료에 따른 gemini-3.5-flash 모델 마이그레이션 및 UI 브랜드 교체
