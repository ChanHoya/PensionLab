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
- **[Completed]** Story S33-1: 은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너 (실업급여 최대 9개월, 사적연금 분할 인출, 건보료 임의계속가입 36개월, 주택연금 조기 브릿지 4대 수단 모델링 및 수지 균형 타임라인 모달 연동) 완료.
- **[Completed]** Story S33-2: 부부 기대수명 차이에 따른 '홀로 남은 배우자(1인 가구)' 생애 케어 고도화 (1인 생활비 70% 감소율, 국민연금법 제56조 중복급여 조정 유리 대안 자동 판정, 주택연금 100% 종신 승계 및 85세+ 집중 간병비 시뮬레이션 모달 연동) 완료.
- **[Completed]** Story S33-3: ISA 만기 자금 연금계좌 전환 & 절세 3총사(연금저축/IRP/ISA) 통합 플래너 (조특법 제91조의18 만기 전환금 10% 추가 세액공제, 연 최대 1,200만원 한도 환급, 3년 풍차돌리기 누적 절세 및 계좌 3총사 비교 모달 연동) 완료.
- **[Completed]** Story S33-4: 대시보드 툴바 연동 및 스마트폰 모바일 뷰포트 반응형 최적화 (dataActions 3버튼 및 사이드바 3버튼 배치, 모바일 터치 가로스크롤 및 팝업 여백 CSS 최적화, AI 진단 리포트 처방 팁 연동) 완료.

- **[Completed]** Story S34-1: 정확성 보완 (유튜브 「두꺼비 세무사 × 송영욱」 대담 기반 점검) — 주택연금 월지급금 부부 중 연소자 기준·본인 사망 후 배우자 100% 승계(시뮬레이션·주택연금/유족케어 모달·CSV·그래프), 유족케어 배우자 국민연금 하드코딩(80만원) 제거, 온보딩 「연간 의료비」를 은퇴 후 목표·최소 생활비 곡선과 인출전략 부족액에 반영, 「자녀 교육/결혼 지원비 총액」을 비연금 자산으로 먼저 충당하고 남는 금액을 AI 진단 누적 부족액·리스크·실행과제에 반영, 2026년 구직급여 상한 1일 68,100원 반영. 소득 공백기 플래너의 퇴직금·개인연금 만원 단위 이중 환산 오류(1.2억→약 1만원) 수정.
- **[Completed]** Story S34-2: 국민연금 증액 로드맵 (`NpsBoostRoadmapModal.tsx`, `npsBoostRoadmap.ts`) — 반납 → 추납 → 임의계속가입(60세~개시 전) → 연기연금(부분 연기 50~90%) 단계별 월 연금·비용·회수 기간·배수, 본인/배우자/부부 합산, 연기 손익분기(약 84세)·피부양자 2,000만원 경고·정책 리스크 안내, 대시보드 툴바(🪜 연금 증액)·사이드바 국민연금 그룹 진입.
- **[Completed]** Story S34-3: 부족액 역산 적립 플랜 (`SavingsPlanModal.tsx`, `savingsPlan.ts`) — AI 진단과 같은 계산의 은퇴 후 평균 월 부족액(현재가치)·자녀 지원 미충당분을 메우는 월 납입액 역산, 적립·거치·수령 기간과 수익률(보수 3/기준 5/낙관 7%) 시나리오, 월복리·물가 연동 납입, 적립금 잔액 그래프, 연금저축·IRP 세액공제 환급(연 900만원 한도 13.2/16.5%), 「노후 월 500만원 3원칙」 점검표. 영상 「텐텐 공식」(50세 월 100만원 10년 적립·10년 거치·연 7% → 70세 3.4억, 30년 월 약 219만원) 재현 검증.

## Active Sprint / Story
- **Sprint 34** (완료): 영상 기반 보완 — S34-1 정확성 보완(완료) → S34-2 국민연금 증액 로드맵(완료) → S34-3 부족액 역산 적립 플랜(완료)
- **Sprint 33**: 전체 완료 (Sprint 33 로드맵 4대 과제 개발, 단위 검증 및 통합 완수)
  - **Story S33-1**: 은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너 (`IncomeBridgeModal.tsx`, `incomeBridgeCalculator.ts`) (완료)
  - **Story S33-2**: 부부 기대수명 차이에 따른 '홀로 남은 배우자(1인 가구)' 생애 케어 고도화 (`SurvivorCareModal.tsx`, `survivorCareCalculator.ts`) (완료)
  - **Story S33-3**: ISA 만기 자금 연금계좌 전환 & 절세 3총사(연금저축/IRP/ISA) 통합 플래너 (`IsaPensionTransferModal.tsx`, `isaPensionTransferCalculator.ts`) (완료)
  - **Story S33-4**: 대시보드 툴바 연동 및 스마트폰 모바일 뷰포트 반응형 최적화 (`page.tsx`, `DashboardSidebar.tsx`, `globals.css`, `reportNarrative.ts`) (완료)

## Session Handoff (Sprint 33 완료)
- **주요 산출물**:
  1. 은퇴 소득 공백기(소득 크레바스) 브릿지 플래너 (`IncomeBridgeModal.tsx`, `incomeBridgeCalculator.ts`):
     - 주직장 퇴직부터 국민연금 법정 개시 사이 소득 절벽 구간(개월수/총필요자금) 자동 감지
     - 실업급여(최대 9개월, 1일 6.6만원, 월 198만원) + 사적연금 적정 인출 + 건보료 임의계속가입(36개월) + 주택연금 조기 결합 4대 브릿지 수단 모델링
     - 연도별 수지 균형 타임라인 및 준비율(%), 안전도 등급 카드, CFP 3대 조언 제공
  2. 홀로 남은 배우자(1인 가구) 생애 케어 시뮬레이터 (`SurvivorCareModal.tsx`, `survivorCareCalculator.ts`):
     - 부부 기대수명 차이에 따른 1차 사망 후 홀로 생존 기간(년) 및 1인 생활비(부부의 70%) 산출
     - 국민연금법 제56조(중복급여 조정: 본인연금+유족30% vs 유족100%) 자동 유리 대안 도출
     - 주택연금 100% 감액 없는 배우자 종신 승계 및 85세 이상 초고령기 집중 간병비(월 100만원) 리스크 분석
  3. ISA 만기 자금 연금계좌 전환 및 3년 풍차돌리기 플래너 (`IsaPensionTransferModal.tsx`, `isaPensionTransferCalculator.ts`):
     - 3년 만기 ISA 전환금액의 10%(최대 300만원) 추가 세액공제(연 최대 1,200만원 한도) 및 환급액 산출
     - 3년 풍차돌리기 N회 반복 누적 절세액 및 일반계좌 vs ISA vs 연금계좌 3총사 핵심 세제 비교표
  4. 대시보드 연동 및 모바일 반응형 UX 최적화:
     - 대시보드 `dataActions` 바 및 `DashboardSidebar` 내 3대 도구(소득공백기, 유족케어, ISA전환) 퀵 버튼 연동
     - 스마트폰(768px 이하) 터치 가로스크롤(`.data-actions-bar`, 테이블), 모바일 모달 팝업 여백 CSS 최적화
     - AI 종합 진단 리포트 세제 팁 영역에 ISA 전환, 소득 공백기 방어, 홀로 남은 배우자 보호 처방 문구 연동
- **검증 상태**: `npx tsc --noEmit` 0 에러 통과, Next.js 개발 서버 정상 동작, git commit & push 완료.





