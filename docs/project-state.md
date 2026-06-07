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
- **[Completed]** Sprint 17: 통합연금 PDF 업로드 자동 파싱, 3층 간편인증 연동 탭 숨김 처리, 연금 정보창고 기능 신설, 및 헤더 메뉴/시작 버튼 배치 최적화.

## Active Sprint / Story
- **Sprint 17**: 통합연금 PDF 업로드 자동 파싱, 3층 간편인증 연동 탭 숨김 처리, 연금 정보창고 기능 신설, 및 헤더 메뉴/시작 버튼 배치 최적화 — **COMPLETED**
  - **[Story S17-1]** [Completed] 1층(국민연금), 2층(퇴직연금), 3층(개인연금) 온보딩 내 기존 Codef API Easy Auth 간편인증 탭 제거(숨김 처리) 및 `📄 금융감독원 통합연금 자료 등록` 탭 신설
  - **[Story S17-2]** [Completed] 통합연금포털 링크(100lifeplan.fss.or.kr) 제공 및 암호 해제 안내 가이드 배너 구현
  - **[Story S17-3]** [Completed] 클라이언트 브라우저에서 `pdfjs-dist`를 동적 로드하여 PDF 텍스트를 고속 추출하는 헬퍼 핸들러 완성
  - **[Story S17-4]** [Completed] `/api/pension/pdf-parse` API 엔드포인트를 구현하여 추출한 PDF 텍스트를 `gemini-3.5-flash` 모델을 통해 정확하게 구조화된 JSON 데이터로 파싱하고 Zustand store에 일괄 바인딩 완료
  - **[Story S17-5]** [Completed] Zustand Store에 `setRetirementPensions`, `setPersonalPensions`, `setPensionInsurances` 액션을 신설하여 타입 에러를 수정하고 프로덕션 빌드 무결성 확인
  - **[Story S17-6]** [Completed] 초기화면의 '연금 개혁안 정보' 메뉴를 '연금 정보창고'로 명칭 변경 및 4개 PDF 보고서(연금 개혁안, 수령 비교전략, ISA 마스터플랜, 코어-새틀라이트 전략)를 선택 조회할 수 있는 카드 뷰 라이브러리 모달 추가 완료
  - **[Story S17-7]** [Completed] 초기화면의 '유튜브 전문가 팁' 메뉴를 삭제하고, 우측 끝에 있던 '시작하기' 링크를 '진단 시작하기'로 이름을 변경하여 메뉴 목록의 우측(유튜브 팁 자리)으로 이동 배치 완료


