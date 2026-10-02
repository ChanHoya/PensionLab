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
- **[Completed]** Sprint 30: 대시보드 시뮬레이션 지표(KPI 4종) 복원 & 4대 산정기준 가로 나란히 탭 바/드롭다운 개편, AI 진단 가구 현금흐름 차트 현재가치 vs 명목가치 토글 탑재, S4 커버드콜 배당 누적·재투자(스노우볼형) 및 비상자금 안전 버퍼 모델링, 스코어카드 콤팩트 레이아웃 개편 완료.
- **[Completed]** Story S31-1: 대한민국 대표 가구 페르소나 3종 원클릭 샘플 로더(40대 맞벌이·50대 퇴직임박·40대 자영업/배당집중) 구축 및 온보딩/대시보드/AI진단 헤더 및 퀵스타트 배너 연동 완료.
- **[Completed]** Story S31-2: AI 종합 진단 리포트와 S4 배당 운용 정책 정밀 연동 및 처방 고도화(스노우볼형 재투자·비상버퍼·전액소비형 정책별 건보료/자산 시뮬레이션 지표 및 전용 인포그래픽 카드, CFP 처방 narrative 고도화) 완료.
- **[Completed]** Story S31-3: 국민연금 조기노령연금 vs 정상 vs 연기연금 손익분기점(BEP) 인터랙티브 비교기(법정 개시나이·감액률 -30%·가산율 +36% 연산 엔진, 골든 크로스오버 나이, Recharts 누적 곡선 차트, 전략별 카드, 대시보드 4중 진입점 모달) 완료.
- **[Completed]** Story S31-4: 시뮬레이션 연도별 상세 테이블 필터링(1년 단위·5년 간격·주요 마일스톤) 및 UTF-8 BOM 엑셀(CSV) 내보내기 연동 & [Hotfix] React Hook 호출 순서 규칙(Rules of Hooks) 준수 완료.
- **[Completed]** UI/UX 개선: 온보딩 Step 0 탭 바 내 '페르소나 체험하기' 버튼 재배치 및 금융감독원 자료 업로드 안내 문구 추가 완료.
- **[Completed]** 소득세법 정합성: 사적연금(퇴직·개인연금) 인출 시작 최소 연령(만 55세) 전 계산 엔진 및 사이드바 UI 강제화 완료.
- **[Completed]** Story S32-1: 사적연금 연 1,500만원 절세 한도 최적화기(연간 1,500만원 초과 연도 감지, 16.5% 분리과세 vs 종합과세 비교 판정, 수령기간 연장 분산 절세액 제시 모달 연동) 완료.
- **[Completed]** Story S32-2: 은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 절감 계산기(재산 과표 1억 공제 후 등급제, 공적연금 50% 인정, 금융소득 1,000만원 초과 전액 부과, 영수증 고지서 모달 연동) 완료.
- **[Completed]** Story S32-3: 한국주택금융공사(HF) 주택연금(역모기지) 결합 시뮬레이션(공시가격 12억 한도 및 가입나이별 선형 보간 계수, 부부 시뮬레이션 및 차트·CSV 연동 On/Off 모달) 완료.
- **[Completed]** Story S32-4: 대시보드 퀵 수비 지표 도구(dataActions 및 사이드바 내 접이식 그룹) & AI 진단 리포트 세제·인출 최적화 팁 연동 완료.

## Active Sprint / Story
- **Sprint 32**: 전체 완료 (Sprint 32 로드맵 4대 과제 개발 및 통합 검증 완수)
  - **Story S32-1**: 사적연금 연 1,500만원 절세 한도 최적화기 (`PrivatePensionTaxModal.tsx`, `privatePensionTaxOptimizer.ts`) (완료)
  - **Story S32-2**: 은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 절감 계산기 (`HealthInsuranceBillModal.tsx`, `localHealthInsuranceCalculator.ts`) (완료)
  - **Story S32-3**: 한국주택금융공사 주택연금(역모기지) 결합 시뮬레이션 (`ReverseMortgageModal.tsx`, `reverseMortgageCalculator.ts`, `coupleSimulation.ts`, `pensionSeries.ts`, `exportCsv.ts`) (완료)
  - **Story S32-4**: 대시보드 퀵 수비 지표 탭 바 & AI 진단 리포트 연동 (`page.tsx`, `DashboardSidebar.tsx`, `reportNarrative.ts`) (완료)

## Session Handoff (Sprint 32 완료)
- **주요 산출물**:
  1. 사적연금 연 1,500만원 절세 한도 최적화기 (`PrivatePensionTaxModal.tsx`, `privatePensionTaxOptimizer.ts`):
     - 소득세법 제20조의3/제129조의2 기준 사적연금(연금저축/IRP) 연 1,500만원 초과 연도 및 초과액 실시간 산출
     - 16.5% 분리과세 vs 종합과세 유불리 자동 비교 판정 및 수령기간 연장(스프레드) 시 저율과세(3.3~5.5%) 혜택 복원에 따른 절세액 제시
  2. 은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 계산기 (`HealthInsuranceBillModal.tsx`, `localHealthInsuranceCalculator.ts`):
     - 2024~2026년 건보료 기준(자동차 폐지, 재산 과표 1억원 기본공제 후 60등급 점수제, 공적연금 50% 인정, 사적연금 0원 비과세, 금융소득 1,000만원 허들) 정밀 모의 고지서
     - 퇴직 후 36개월간 종전 직장보험료 납부 시 3년간 총 절감액 및 공단 신청 기한 가이드
  3. 한국주택금융공사(HF) 주택연금(역모기지) 결합 시뮬레이터 (`ReverseMortgageModal.tsx`, `reverseMortgageCalculator.ts`):
     - HF 공시 기준 연령별 주택가격 1억원당 월지급금 계수(종신지급방식 정액형) 선형 보간 연산
     - 부부 시뮬레이션 및 현금흐름 차트(`pensionSeries.ts`), 연도별 테이블 및 엑셀 다운로드(`exportCsv.ts`)에 주택연금 고정 레이어 On/Off 결합 지원
  4. 대시보드 퀵 수비 지표 3종 도구 및 AI 진단 리포트 연동:
     - 대시보드 `dataActions` 바 및 사이드바 내 「은퇴 자산 수비 & 절세 도구」 그룹에 3대 모달 직결 버튼 제공
     - AI 종합 진단 리포트 세제 최적화 섹션에 임의계속가입 및 주택연금 연동 처방 팁 탑재
- **검증 상태**: `npx tsc --noEmit` 0 에러 통과, Next.js 개발 서버 정상 동작, git commit & push 완료.





