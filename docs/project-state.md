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

- **[Completed]** Sprint 18: 벤치마킹 참고 서비스 탐색 메뉴 추가 및 랜딩 페이지 UI 고도화 (ReferenceServicesModal 개발 및 아웃링크 카드 그리드 연동)
- **[Completed]** Sprint 19: 3층 연금 세제/건보 룰셋 반영 인출전략 시뮬레이터 및 비교 대시보드 개발, PDF 리포트 다운로드 연동 및 **[Hotfix] 인출 시뮬레이션 기말 피크(Peak) 및 사전 더블 복리(Double Compounding) 오류 해결** (PMT 평탄화, 이자/세제원 동기화 및 수령 전 중복복리 차단 적용)

- **[Completed]** Sprint 20: 인출전략 계산 엔진 검증용 서브에이전트(`withdrawal-validator`) 정의, `scratch/validateWithdrawalSuite.ts` 종합 테스트 구축 및 치명적 버그 2종(타 소득 연/월 단위 불일치 및 자산 사전 복리연산 유실/더블복리 버그) 수정, 전체 테스트 통과 및 Vercel 배포 빌드 오류 해결 완료.

- **[Completed]** Sprint 21: 인출전략 시뮬레이터 연도별 상세 현금흐름 테이블 하단에 전체 세전/세후 수령액 및 세금/건보료 합계(Total) 행 추가

- **[Completed]** Sprint 22: S2(절세형+국민연금 5년 연기) 전략의 개인연금 개시 시점 동적화 및 70세 시점 국민연금 유입에 따른 수령액 급증(피크)을 막기 위한 "사적연금 인출액 안분 감액(Spread & Leveling) 오프셋" 계산 로직 적용 완료

- **[Completed]** Sprint 23: 대시보드 레이아웃 구조 개편 및 인출전략 시뮬레이터 통합 (KPI 5열 축소, 3층 차트 제거, 슬라이더 3열 그리드화, 로컬 데이터 KPI 이관 및 withdrawal 리다이렉트)

- **[Completed]** Sprint 24: S4 건보료 최적화 하이브리드(배당+연금) 인출 전략 신설 — 커버드콜 ETF 월 분배금 배당소득을 인당 연 1,000만원 이하로 통제하여 건보료 피부양자 자격 방어, 부부 명의 분산 토글, 건보료 assessHealthInsurance 함수 금융소득 1,000만원 허들 룰 정밀화(전액 합산 vs 0원), 재산 요건 3단계(5.4억/9억) 적용, 대시보드 S4 탭/슬라이더/피부양자 진단 UI 추가
- **[Completed]** Sprint 27: 부부 가구 AI 연금 종합 진단 & 전문 컨설팅 리포트 (DiagnosisReport) — 1인 텍스트 진단을 부부 가구 기반으로 전환, 동일 계산 엔진(추납·반납 + 부부 통합 시뮬레이션 + S0~S4 가구 인출전략) 기반 5대 영역 점수화(충분성·안정성·세후효율·3층분산·장수유족대비) 및 A~E 등급, Gemini 3.8 Flash 구조화 JSON 스키마 진단, 표지·게이지·레이더·누적현금흐름·3층피라미드/도넛·리스크매트릭스·로드맵 인포그래픽 리포트 및 PDF 다운로드 연동
- **[Completed]** Sprint 29: 현재가치(실질 구매력) 기준 일원화 및 연령대별(60~100세) 정교한 지출 설계 — 자산관리 대시보드와 AI 진단 리포트의 화폐가치 기준을 '현재가치(실질 구매력)' 기본값으로 일원화하여 국민연금 수평선(물가연동 구매력 보존) 및 생활비선 비교 정합성을 확보하고(현재가치/명목 토글 스위치 지원), 60대(초기 활동기), 70대(소비 안정기), 80대(활동 감소기), 90대+(간병·노년기)로 세분화된 연령대별 목표/최소 생활비 슬라이더 및 권장 체감형 프리셋 제공, 연령대 간 완만한 스무딩 보간 및 100세 이상 horizon 결측치 버그 픽스 완료.
- **[Completed]** Sprint 30: 대시보드 설명 요약 & 4대 산정기준 접이식 탭 UI 개편, AI 진단 가구 현금흐름 차트 현재가치 vs 명목가치 토글 탑재, S4 커버드콜 배당 누적·재투자(스노우볼형) 및 비상자금 안전 버퍼 모델링 개발 완료.

## Active Sprint / Story
- **Sprint 30**: 완료 (대시보드 설명 요약 및 4대 산정기준 탭, AI진단 실질/명목 토글, S4 배당 누적·재투자 및 안전버퍼)
- **Next Sprint**: 대기 중

## Session Handoff (Sprint 30 완료)
- **주요 산출물**:
  1. 대시보드 상단 설명 요약 및 4대 산정기준 접이식 탭(Accordion Details) 구현 (`CoupleSimulationSection.tsx`):
     - 핵심 1문장 압축 요약
     - `▶ 유족연금 산정 기준과 계산 보기`
     - `▶ 국민연금 적립·인상 산정 기준` (국민연금법 제51조 물가연동 연복리 3% 증액, 구매력 보존 수평선 원리)
     - `▶ 퇴직·개인연금 적립금 산정 기준` (인출 후 잔여 적립금의 연 2.5~4.5% 연복리 운용수익 가산, 세제원 자동 동기화)
     - `▶ 소득 평탄화 & 지출 곡선 인출 상세` (기존의 긴 파란색 평탄화 박스를 접이식 탭으로 숨겨 화면 요약성 극대화)
  2. AI 포트폴리오 진단 화면(03 가구 연금 현금흐름 & 맞춤 지출 곡선) 실질 vs 명목 토글 탑재 (`DiagnosisReport.tsx`):
     - `[현재가치(실질) | 명목 금액]` 세그먼트 토글 스위치 제공 및 실시간 차트/서브타이틀 동적 반응 연동
  3. S4 커버드콜 배당금 운용 정책 3대 모드 신설 및 동적 인출·세제 엔진 고도화 (`usePensionStore.ts`, `withdrawalCalculator.ts`, `DashboardSidebar.tsx`, `page.tsx`):
     - `dividendPolicy`: `"REINVEST"` (스노우볼형 재투자), `"BUFFER"` (비상자금 안전버퍼형), `"PAYOUT"` (전액 현금화 소비)
     - 생활비 부족분만 배당금에서 충당하고, 잉여 배당금은 원금 재투자(자산 복리 증식) 또는 비상자금 풀(연 2.5% MMF 복리)에 차곡차곡 적립
     - 15.4% 원천징수 후 세후 배당금 기준 재투자 및 인당 1,000만원 건보료 피부양자 허들 정합성 유지
     - S4 탭 배너에 적용 정책, 최종 커버드콜 원금 증식액, 누적 비상자금 잔고 실시간 인포그래픽 카드 표시
   4. AI 진단 스코어카드 콤팩트 레이아웃 개편 및 연금 구조 분석 차트 명칭 개선 (`DiagnosisReport.tsx`):
      - 섹션 02 좌측 레이더 차트 크기 확대(`outerRadius: 84%`) 및 여백 활용 극대화
      - 섹션 02 우측 5개 진단 영역 세로 압축: `[항목명] 가중치 N% : [설명1]` 인라인 배치 및 점수 우측 정렬, 하단 프로그레스 바 및 설명2(코멘트) 구조로 콤팩트화
      - 섹션 04 '3층' 표현을 '연금'으로 정비: `3층 비중(가구)` → `연금 비중(가구)`, `사람별 3층 수령액` → `개인별 연금 수령액 비중`, 서브타이틀 3층 구성 → 연금 구성
- **검증 상태**: `npx tsc --noEmit` 0 에러, 브라우저 subagent UI 검증 완료.





