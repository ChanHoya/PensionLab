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
- **[Completed]** Sprint 15: 대시보드 리포트 결제/배너 UI 제거, 은퇴 진단 종합 리포트 및 시각 차트 요소를 AI 포트폴리오 처방(AI Advisor) 페이지 내로 통합, html2canvas & jsPDF 연동 처방전 PDF 다운로드 기능 탑재.
- **[Completed]** Sprint 15-2: 유튜브 RAG Q&A 이설 및 종합처방전 시각화 고도화.
- **[Completed]** Sprint 16: AI 종합 처방전 시각 차트 최적화 및 3단계 은퇴 평가 개편.

## Active Sprint / Story
- **Sprint 16**: AI 종합 처방전 시각 차트 최적화 및 3단계 은퇴 평가 개편 — **COMPLETED**
  - **[Story S16-1]** [Completed] 3층 구조 연금 주택 차트의 크기를 180px x 240px로 확대하여 박스 면적 가독성 개선
  - **[Story S16-2]** [Completed] 마크다운 렌더러에서 `<think>` 및 기타 추론 찌꺼기 텍스트 차단 및 빈 네모 불릿 필터링 로직 강화
  - **[Story S16-3]** [Completed] 은퇴 준비도 종합평가의 필요자금 및 국민연금 차감 후 실질 필요액을 3단계(적극활동기/안정활동기/비활동기) 분석 구조로 개편 (Gemini API 프롬프트 및 로컬 fallback 개선)
  - **[Story S16-4]** [Completed] 네비게이션 헤더 메뉴 명칭 및 순서를 '자산관리 > AI포트폴리오 진단 > 관련 뉴스 > 추천영상'으로 전면 개편 및 관련 4개 파일 일괄 수정 완료
  - **[Story S16-5]** [Completed] API 라우트 프롬프트 지침 내 인라인 코드용 백틱 이스케이프 오류 해결 및 빌드 무결성 확보 완료


