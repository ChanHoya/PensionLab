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
- **[Completed]** 인출전략 시나리오 현재가치(실질 구매력) vs 명목 금액 토글 및 동기화: 부부 통합 연금 시뮬레이션(실질 구매력 디폴트)과 인출전략 시나리오(기존 명목만 표기) 간의 수치 불일치(152,704만원 vs 224,431만원) 원인 규명 및 해결. 인출전략 헤더에 현재가치/명목 토글 스위치를 신설하고 상단 시뮬레이션과 연동. 현재가치 선택 시 연도별 할인율 `(1+infl/100)^t`를 적용하여 카드·바차트·에어리어/라인 차트·상세 테이블·CSV 내보내기까지 일관되게 현재가치 실질/명목 금액으로 변환 지원.
- **[Completed]** Story S34-2: 국민연금 증액 로드맵 (`NpsBoostRoadmapModal.tsx`, `npsBoostRoadmap.ts`) — 반납 → 추납 → 임의계속가입(60세~개시 전) → 연기연금(부분 연기 50~90%) 단계별 월 연금·비용·회수 기간·배수, 본인/배우자/부부 합산, 연기 손익분기(약 84세)·피부양자 2,000만원 경고·정책 리스크 안내, 대시보드 툴바(🪜 연금 증액)·사이드바 국민연금 그룹 진입.
- **[Completed]** Story S34-3: 부족액 역산 적립 플랜 (`SavingsPlanModal.tsx`, `savingsPlan.ts`) — AI 진단과 같은 계산의 은퇴 후 평균 월 부족액(현재가치)·자녀 지원 미충당분을 메우는 월 납입액 역산, 적립·거치·수령 기간과 수익률(보수 3/기준 5/낙관 7%) 시나리오, 월복리·물가 연동 납입, 적립금 잔액 그래프, 연금저축·IRP 세액공제 환급(연 900만원 한도 13.2/16.5%), 「노후 월 500만원 3원칙」 점검표. 영상 「텐텐 공식」(50세 월 100만원 10년 적립·10년 거치·연 7% → 70세 3.4억, 30년 월 약 219만원) 재현 검증.
- **[Completed]** UI/UX 개선: 온보딩 Step 0 탭 명칭 변경('기본정보' → '적용대상') 및 제목('기본 정보') 우측 가로 정렬 배치 최적화 (적용대상 → 재무목표 → 금감원 자료 업로드 → 페르소나 체험하기)
- **[Completed]** UI/UX 개선: 온보딩 전체 탭 상단 헤더와 본문 사이 과도한 상하 여백 축소(50px→24px) 및 Step 0 '본인 및 가족 정보' 우측 '배우자 유무' 라디오 버튼 가로 인라인 배치 최적화
- **[Completed]** UI/UX 개선: 온보딩 각 탭 오른쪽 제목 창 아래 설명글을 STEP 배지 우측으로 가로 이동 배치 (헤더 세로 공간 절약 및 가독성 최적화)
- **[Completed]** UI/UX 개선: 온보딩 Step 4 상단 '종합 분석하기 🚀' 버튼 화면 우측 끝 위치 정렬 (`marginLeft: auto`) & 대시보드 부부 시뮬레이션 '조기 vs 정상 vs 연기 손익분기(BEP)' 버튼 부제목 우측 이동 및 상단 부가기능 박스와 세로폭(높이) 일치 정렬 완료.
- **[Completed]** UI/UX 버튼 재배치 및 간소화: 최상단 네비게이션 헤더의 중복 '손익분기(BEP)' 버튼 제거, 부부 통합 연금 시뮬레이션 상단 바 내 '대표 페르소나 체험' 및 '손익분기(BEP)' 중복 버튼 정리, 그리고 부제목 영역에 있던 '조기 vs 정상 vs 연기 손익분기(BEP)' 버튼을 시뮬레이션 상단 툴바('💎 ISA전환' 우측)로 일원화 이동 배치 완료.
- **[Completed]** 연령대별 월 생활비 설정값-그래프 일치화 및 AI 포트폴리오 진단 정합성 동기화: 사이드바 기본설정값(예: 60대 목표 450/최소 300)과 오른쪽 그래프 간 발생하던 +100만원 단차(은퇴 시점 인위적 의료비 합산으로 인한 급등)를 해결하기 위해 `spendingCurve.ts`의 `targetReal`/`minReal`을 연령대별 보간값과 100% 일치하도록 보정. `householdScenarios.ts` 결손액 산정 및 AI 포트폴리오 진단(`householdReport.ts`) 또한 동일한 연령대별 맞춤 지출 곡선 기준을 적용하도록 완전 동기화 완료.
- **[Completed]** 시뮬레이션 차트 툴팁 합계 오류 수정 및 인출전략 차트 맞춤 생활비 곡선 추가:
  1. 부부 통합 연금 시뮬레이션 및 AI 진단 차트 마우스 오버 시 `ChartTooltip`의 `total` 연산에서 누적 스택이 아닌 지출 기준선(`targetSpending`, `minSpending`, `totalPostTax`)이 일괄 합산되어 상단 표시 금액이 742만원이 아닌 1,492만원으로 왜곡되던 버그 수정. `DEFAULT_EXCLUDED_KEYS` 필터링 및 `totalLabel="월 연금 합계"` 명시를 통해 순수 연금 수령액 합계(예: 742만원/월)만 정확히 계산되도록 개선 완료.
  2. 대시보드 인출전략 시나리오 비교 그래프(`ComposedChart`)에 연령대별 맞춤 목표 생활비선(🔴 실선) 및 최저 생활비선(🟡 점선)을 신규 탑재. 현재가치(실질 연간 금액) 및 명목(물가상승 반영) 동기화, `CustomTooltip`에 월 환산액 병기 및 연금 세전 합계 분리 연산 적용 완료.
- **[Completed]** S4 하이브리드 배당 옵션 로직 버그 해결 & 대표 연금 배당 투자 포트폴리오 추천 가이드 모달 신설:
  1. 배당소득 1,000만원 강제 캡핑(Clamping) 버그 수정: `withdrawalCalculator.ts`에서 과거 피부양자 방어 목적으로 `dividendPreTax = Math.min(rawDividend, maxDividendForHI)` 코드로 인해 4억(연 4,000만)을 투자해도 1,000만원으로 배당 발생액 자체가 1/4 토막 삭감되던 오류 제거 (`dividendPreTax = rawDividend` 전액 반영).
  2. 생애 총 연금액(세후 수령액) 미반영 및 불변 오류 해결: 생활비 부족분 미발생 시 배당 소비액이 0원이 되어 세후 수령액에 배당이 누락되던 현상 해결. 기본 배당 정책을 `PAYOUT`(전액 현금화 소비)으로 최적화하고, `REINVEST`/`BUFFER` 정책에서도 축적된 순 배당 자산 증가분을 생애 세후 총액에 온전히 합산하여 투자금과 분배율 조절 시 생애 총 연금액이 정직하게 증가하도록 전면 개선.
  3. `DividendStrategyModal.tsx` 전문가 실전 ETF 기반 전면 개편: 국내 대표 연금 전문가(박곰희, 김성일 작가, 자산운용사 등)의 포트폴리오 다각도 조사 기반 업데이트. 4대 대표 포트폴리오에 실제 매수 가능한 국내 상장 ETF(TIGER 미국배당다우존스 458730, SOL 미국배당미국채혼합50 490490, TIGER 미국배당+7%프리미엄 458760, KODEX 한국부동산리츠인프라 476830 등) 및 종목코드(티커), IRP 적격 분류 매핑.
  4. '🏢 추천 실전 ETF 10선' 탭 및 '📌 격주 배당 캘린더 & IRP 30% 안전자산 룰 활용 꿀팁' 신설, 원클릭 종목코드 복사 기능 연동 완료.
  5. 사이드바 및 대시보드 연동: `DashboardSidebar.tsx` S4 그룹 내 `💡 배당금 투자 전략 추천` 버튼 및 상단 툴바 버튼 추가 완료.

- **[Completed]** 국민연금 조기 vs 정상 vs 연기 연금 손익분기점(BEP) 유튜브 분석 영상 정밀 대조 및 A·B값 재평가 인사이트 보완:
  1. 법정 단순비율(77세/84세)과 5년간 A값(전체 평균소득) 및 B값(과거소득 재평가율) 매년 4~5% 상승에 따른 실질 체감 BEP(조기-정상 약 72세 / 정상-연기 약 81세, 약 3~5년 단축) 원리 규명 및 모달 상단 배너 카드 탑재.
  2. 근로·사업 소득자 감액 회피 치트키(A값 월 320만원 초과 시 조기는 전액 지급정지되나, 65~69세 소득자는 연기연금 신청 시 최대 50% 감액을 100% 방어하고 연 7.2% 가산 보존) 가이드 추가.
  3. 건보료 피부양자(연 2,000만원) 탈락 방어 및 부분연기(50~90%) 활용 절세 팁을 `NpsEarlyDeferralModal.tsx` 및 `npsEarlyDeferralBep.ts` CFP 처방전에 동기화 완료.

- **[Completed]** Story S35-1: AI 종합 진단 리포트 & 신규 도구 처방 심층 연동
  1. Gemini 3.8 Flash 시스템 프롬프트 및 `fallbackNarrative`에 신규 8대 전문 분석 도구(SAVINGS_PLAN, DIVIDEND_STRATEGY, NPS_BEP, NPS_BOOST, INCOME_BRIDGE, SURVIVOR_CARE, ISA_TRANSFER, REVERSE_MORTGAGE) 팩트 주입 및 실행 로드맵(`actions`) `toolId` 매핑.
  2. AI 종합 진단 리포트(`DiagnosisReport.tsx`) 섹션 07 실행 로드맵 카드 내 전용 `바로가기 ↗` 버튼 제공.
  3. 섹션 10 **"맞춤 은퇴 처방 툴킷 (Solution Toolkit)"** 인터랙티브 카드 그리드 신설 및 AI 진단 페이지(`page.tsx`) 원클릭 모달 연동 완료.
- **[Completed]** Story S35-2: 종합 분석 PDF 다운로드 리포트 확장 및 인쇄 최적화
  1. 표지 KPI 직후 인쇄 모드(`isPrintMode`) 전용 3열 경영 요약본(Executive Summary: 진단 결론, 최적 인출 전략, 우선 권장 과제) 패널 신설.
  2. 섹션 07 실행 로드맵 카드에서 버튼 대신 인쇄용 '연계 솔루션' 배지 렌더링.
  3. 섹션 10 Solution Toolkit을 A4 인쇄 친화적 4열 그리드, 문서형 배지, 맞춤형 폰트 크기로 자동 치환 렌더링 완료.
- **[Completed]** Story S35-3: 온보딩 ➔ 대시보드 ➔ AI 진단 사용자 여정 UX 고도화
  1. 온보딩 Step 4 요약 탭 상단 및 하단 버튼에 `[대시보드 바로가기 📊]`와 `[AI 종합 진단 받기 🔮]` 듀얼 내비게이션 버튼 제공.
  2. 대시보드 상단 결과 영역에 AI 종합 진단 리포트 안내 배너 탑재(원클릭 진단 이동).
  3. 대시보드 ↔ AI 진단 리포트 상호 이동 플로우 및 모바일 반응형 터치 호버 CSS(`toolkit-card-hover`, `btn-action-tool`) 고도화 완료.

- **[Completed]** Story S36-1: 보안 안내 및 기본값 정합성 동기화
  1. 대시보드 보안 배너 문구를 "개인식별정보(PII) 미수집 및 브라우저 LocalStorage 로컬 우선 보관"으로 기술적 정합성 완전 일치화.
  2. `dividendPolicy` 기본값을 전액소비형(`PAYOUT`)으로 store, 사이드바, 계산 엔진 및 대시보드 전체 일원화.
- **[Completed]** Story S36-2: S4 커버드콜 배당 엔진 현실화 (가격 수익률 축 추가 & 금융당국 핵심위험 고지)
  1. 커버드콜 2변수 모델 구축: `coveredCallPriceReturnRate`(연간 가격수익률 %, 기본 0.0%) 필드 신설 및 은퇴 후 NAV 침식(보수 -5% 시 20년 뒤 1,792만원) 현실화.
  2. shortfall 연산 시 물가상승률(`inflationFactor = (1+infl)^t`) 인덱싱 적용으로 기준 불일치(FP-020) 해결.
  3. 사이드바 및 모달에 금감원 2026 커버드콜 핵심위험 고지 박스 탑재 및 단위 테스트(`validateCoveredCallModel.ts`) 통과.
- **[Completed]** Story S36-3: 연금계좌 분리 & IRP 70% 안전자산 진단기
  1. 배당 투자 계좌 유형(`coveredCallAccountType: "TAXABLE" | "PENSION"`) 선택 옵션 신설: 연금계좌 선택 시 15.4% 원천징수 면제 및 연금소득세(3.3~5.5%) 과세이연, 건보료 금융소득 1,000만원 기준에서 제외(피부양자 안전 방어).
  2. 퇴직연금감독규정 IRP 70% 위험자산 한도 & 30% 안전자산 의무 판정 엔진(`pensionAccountRules.ts`) 및 단위 테스트(`validatePensionAccountRules.ts`) 통과.

- **[Completed]** Story S37-1: transitions.dev 기반 모션 디자인 시스템 토큰 및 공통 인터랙션 컴포넌트 구축 (`globals.css` 모션 토큰/클래스, `NumberPopIn`, `SlidingTabs`, `CopyCheckButton`, `CardTilt` 및 `DividendStrategyModal` 스프링 모달/성공체크 연동 완료)
- **[Completed]** Story S37-2: 대시보드 KPI 롤링 카운터, 슬라이딩 탭 및 8대 전문 모달 스프링 트랜지션 연동 (`CoupleSimulationSection` 및 `dashboard/page.tsx`에 `NumberPopIn`, `SlidingTabs` 탑재, 전체 전문 모달에 `t-modal-spring` 적용 완료)
- **[Completed]** Story S37-3: AI 종합 진단 (AI Advisor) Thinking States & Reasoning Stream 프리미엄 연출 (`AiThinkingStream.tsx` 4단계 스트리밍 시뮬레이션 및 `DiagnosisReport.tsx` 게이지 스코어 `NumberPopIn` 연동 완료)
- **[Completed]** Story S37-4: 온보딩 슬라이딩 탭 및 랜딩 페이지 3D 틸트/글로시 CTA 비주얼 업그레이드 (`onboarding/page.tsx` Step 0 `SlidingTabs`, `page.tsx` 히어로 `t-btn-glossy`, 벤치마킹 카드 `CardTilt` 및 모달 `t-modal-spring` 연동 완료)
- **[Completed]** 전체 모달 컴포넌트 다크/라이트 테마 일관성 일원화: `globals.css` 모달 토큰 확장 및 11개 전문 팝업 모달 하드코딩 다크 스타일 제거, 라이트모드 텍스트 묻힘 해결 및 테마 동기화 완료
- **[Completed]** AI 종합 진단 PDF 빈 화면(Blank Page) 출력 버그 수정: 오프스크린 인쇄 전용 컨테이너(`#ai-prescription-pdf-root`)의 `opacity: 0`을 `1`로 정상화하고 `exportPdf.ts`에 일시적 opacity 안전 복구 및 캔버스 크기 검증 로직 추가 (FP-030)
- **[Completed]** Story S38-1: 은퇴 자산 포트폴리오 시장 시나리오 백테스트 & 배당 복리 시뮬레이터 (`portfolioBacktest.ts`, `PortfolioBacktestModal.tsx`, 대시보드 툴바/사이드바 및 AI 진단 툴킷 연동)
- **[Completed]** Story S38-2: 모바일 뷰포트 터치 제스처 & 접근성(a11y) 세부 폴리싱 (`globals.css` 768px 미디어 쿼리, 바텀시트 모달 래퍼, 터치 슬라이더, 관성 스크롤, 대화상자 WAI-ARIA role/label/focus 링)
- **[Completed]** Sprint 40: 초심자 친화적 UX 고도화 (30초 퀵 간편 진단 Easy Mode & 스마트 금융/연금 용어사전 툴팁 시스템) 및 대시보드 모달/툴바 리팩토링
  - Story S40-1: 스마트 금융/연금 용어사전 DB(`src/config/glossary.ts`) 및 인라인 툴팁 컴포넌트(`src/components/GlossaryTooltip.tsx`) 구현 (14대 핵심 전문 용어에 대한 1줄 쉬운 일상 비유, 상세 원리, 실전 꿀팁 및 관련 모달 바로가기 연동)
  - Story S40-2: 초심자를 위한 30초 퀵 간편 진단 엔진(`src/services/quickDiagnosis.ts`) 및 인터랙티브 모달(`src/components/QuickDiagnosisModal.tsx`) 개발 (4개 질문으로 대한민국 평균 통계 기반 은퇴 월 연금·부족액·준비율·A~E등급 즉시 산출 및 "🚀 이 결과로 대시보드 바로 체험하기" 원클릭 이동 지원)
  - Story S40-3: `src/app/dashboard/page.tsx` 대규모 모달 상태 단일화(`activeModal: DashboardModalType`), `DashboardToolbar.tsx` 및 `DashboardModalManager.tsx` 분리 리팩토링 완료
  - Story S40-4: 프로덕션 빌드(`npm run build`), 브라우저 서브에이전트 실화면 렌더링 검증, Git 커밋/푸시

## Active Sprint / Story
- **Sprint 42** (개발, 코드리뷰, 검증, Git Push 완료): 4대 은퇴 실행력 & 사용자 경험 극대화 종합 패키지
  - **Story S42-1 (완료)**: 은퇴 생애 D-Day 로드맵 & 실행 체크리스트 (`src/services/retirementRoadmapService.ts`, `src/components/RetirementRoadmapModal.tsx`)
  - **Story S42-2 (완료)**: 복수 은퇴 시나리오 비교함 (A안 기준 vs B안 조기 vs C안 연기연금 Side-by-Side) (`src/services/scenarioComparisonService.ts`, `src/components/ScenarioComparisonModal.tsx`)
  - **Story S42-3 (완료)**: 2026 절세 계좌 4총사(ISA/연금저축/IRP/일반) 자산배분 최적화 매트릭스 (`src/services/accountTaxMatrixService.ts`, `src/components/AccountTaxMatrixModal.tsx`)
  - **Story S42-4 (완료)**: 모바일 전용 바텀 네비게이션(Bottom Tab Bar) & 스마트 PWA 설치 안내 배너 (`src/components/MobileBottomNav.tsx`, `src/components/PwaInstallBanner.tsx`)
  - **Story S42-5 (완료)**: 전사 생태계 연동 (대시보드 툴바/사이드바/모달매니저, 랜딩 6대 솔루션 그리드, AI 진단 섹션 07 로드맵 버튼, 스마트 용어사전 3대 신규 용어)
  - **Story S42-6 (완료)**: 프로덕션 빌드(`npm run build`) 성공 (21/21 routes), Chrome 브라우저 실화면 렌더링 검증, 코드 리뷰 통과, GitHub 원격 저장소(`main`) Push 완료

## Session Handoff (Sprint 42 4대 패키지 개발 및 배포 완료)
- **주요 산출물**:
  1. `RetirementRoadmapModal.tsx` & `retirementRoadmapService.ts`:
     - 나이대별 D-Day 타임라인, localStorage 영구 저장 체크리스트, 연계 도구 스마트 링크
  2. `ScenarioComparisonModal.tsx` & `scenarioComparisonService.ts`:
     - 기준 플랜 vs 조기 은퇴 vs 연기연금 3열 카드 비교 및 원클릭 대시보드 변수 즉시 적용
  3. `AccountTaxMatrixModal.tsx` & `accountTaxMatrixService.ts`:
     - 2026 개정 세법 기준 4계좌 세제 룰 비교표 및 자산군(미국배당/지수/채권/국내주식)별 최적 바구니 추천
  4. `MobileBottomNav.tsx` & `PwaInstallBanner.tsx`:
     - 스마트폰 환경 하단 고정 5버튼 네비게이션 및 7일 쿨다운 A2HS 홈 화면 설치 배너
  5. 전사 생태계 통합:
     - 대시보드 상단 툴바 3대 버튼 (`🧭 D-Day 로드맵`, `📊 시나리오 비교`, `📑 절세 매트릭스`), 사이드바 바로가기, 모달 매니저 통합
     - 메인 랜딩 페이지 6대 실전 솔루션 그리드
     - AI 종합 진단 리포트 섹션 07 로드맵 액션 버튼 및 AI 어드바이저 시스템 프롬프트 반영
     - 스마트 용어사전 3대 신규 용어 (`RETIREMENT_ROADMAP`, `SCENARIO_COMPARISON`, `ACCOUNT_TAX_MATRIX`)
- **검증 상태**: `npm run build` 성공 (0 errors), Chrome 브라우저 실화면 렌더링 검증 통과, 코드 리뷰 완료, GitHub 원격 저장소(`main`) Push 완료.







- **주요 산출물**:
  1. AI 종합 진단 리포트 & 8대 솔루션 툴킷 심층 연동 (S35-1):
     - Gemini 3.8 Flash 및 fallbackNarrative 8대 도구(SAVINGS_PLAN, DIVIDEND_STRATEGY, NPS_BEP, NPS_BOOST, INCOME_BRIDGE, SURVIVOR_CARE, ISA_TRANSFER, REVERSE_MORTGAGE) 매핑
     - 섹션 07 로드맵 바로가기 버튼 및 섹션 10 맞춤 은퇴 처방 툴킷 인터랙티브 그리드 탑재
  2. PDF 인쇄 모드 확장 및 Executive Summary (S35-2):
     - `isPrintMode` 대응 3열 경영 요약본 패널 및 4열 인쇄 그리드 최적화
  3. 온보딩 ➔ 대시보드 ➔ AI 진단 사용자 여정 UX 고도화 (S35-3):
     - 온보딩 Step 4 듀얼 진입 버튼, 대시보드 상단 AI 진단 안내 배너 탑재
- **검증 상태**: `npx tsc --noEmit` 통과, `npm run build` 프로덕션 빌드 성공(0 errors), Chrome 브라우저 화면 검증 완료.
- **주요 산출물**:
  1. 국민연금 조기 vs 정상 vs 연기 연금 심층 비교 (`NpsEarlyDeferralModal.tsx`, `npsEarlyDeferralBep.ts`):
     - 법정 단순비율 기준(77세/84세)과 A·B값 재평가 반영 기준(72세/81세) 동시 안내 배너 카드 추가
     - 65~69세 소득 발생 시 감액 100% 회피 연기연금 치트키 및 부분연기(50~90%) 절세 팁 연동
  2. S4 하이브리드 배당 옵션 정상화 및 전문가 실전 ETF 포트폴리오 (`DividendStrategyModal.tsx`, `withdrawalCalculator.ts`):
     - 1,000만원 하드코딩 캡핑 제거 및 PAYOUT/REINVEST/BUFFER 정책별 생애 총액 정확 반영
     - 박곰희/김성일/운용사 추천 실전 국내 ETF 10선, 티커 복사, 격주 배당 캘린더 탑재
  3. 시뮬레이션 지표 일치화:
     - 연령대별 생활비 기본값-곡선 일치화, 툴팁 연금 순합계 버그 수정, 인출전략 차트 목표/최저 생활비선 추가
- **검증 상태**: `npm run build` 성공(0 errors), git commit & push 완료.

- **[Completed]** Sprint 43: 실전 은퇴 가계부 & 런웨이 트래커, 1:1 대화형 AI 어드바이저, 금감원 엑셀/CSV 파서, 모달 번들 분할 & PWA 오프라인 캐싱
  1. 실전 은퇴 가계부 & 연금 인출 트래커 (`CashflowTrackerModal.tsx`, `cashflowTrackerService.ts`):
     - 은퇴 후 4대 지출(주거/식비/의료/생활) 및 4대 수입(공적/사적/금융/기타) 모델링
     - 목표 대비 괴리율(Gap), 수지차, 런웨이(Runway), 재무건전성 점수, 12개월 추이 차트 제공
  2. 1:1 대화형 AI 인터랙티브 은퇴 어드바이저 (`InteractiveChatAdvisorModal.tsx`, `interactiveAdvisorService.ts`, API route):
     - 사용자 연금 자산 컨텍스트 실시간 주입, Gemini API 연동 및 지능형 폴백, 5대 추천 질문 칩, 연계 전문 시뮬레이터 원클릭 바로가기 지원
  3. 금융감독원 통합연금포털 엑셀(XLSX/CSV) 데이터 업로드 파서 (`fssExcelParser.ts`, `FssUploadPanel.tsx`, `onboarding/page.tsx`):
     - 금감원 통합연금포털 CSV/Excel 데이터 파싱 엔진 구축 및 온보딩 Step 0 업로드 지원
  4. 번들 사이즈 최적화 & PWA 오프라인 캐싱 강화 (`DashboardModalManager.tsx`, `manifest.ts`, `sw.js`):
     - 18개 모달 전체 `next/dynamic` 분할 로딩 적용으로 초기 페이지 번들 최적화
     - Service Worker 캐싱 및 PWA 오프라인 복원력 확보
- **검증 상태**: `npm run build` 성공(0 errors), Playwright/Chrome 브라우저 화면 렌더링 검증 완료.

- **[Completed]** Sprint 44: 은퇴 세무·건보 통합 A4 명세서, 월별 배당 인컴 캘린더, 가족 공유 스냅샷, 3중 복합 위기 스트레스 테스트 2.0
  1. 은퇴 세무 & 건강보험료 모의 고지서 통합 A4 명세서 (`TaxAndHealthStatementModal.tsx`, `taxAndHealthStatementService.ts`):
     - 공적연금 소득세, 사적연금 원천징수세(저율분리 vs 16.5%), 금융소득세 및 지역건보료(재산/소득/장기요양) 결합
     - A4 인쇄 친화적 국세청/건보공단 고지서 스타일 명세표 및 실수령액 산출
  2. 월별 배당 인컴 캘린더 & 연금 인출 스케줄러 (`DividendCalendarModal.tsx`, `dividendCalendarService.ts`):
     - 1~12월 배당금 입금일(15일/28일), 국민연금 입금일(25일), 생활비 인출일(1일) 매핑
     - 월별 수지차(잉여/적자) 및 격주 분배 포트폴리오 토글 지원
  3. 은퇴 시뮬레이션 부부·가족 공유 스냅샷 (`ShareSnapshotModal.tsx`, `shareSnapshotService.ts`, `dashboard/page.tsx`):
     - 시뮬레이션 파라미터를 URL-safe Base64로 압축 인코딩, 카카오톡/문자 전송용 요약문 및 URL `?snapshot=` 복원(Hydration) 연동
  4. 3중 복합 위기 스트레스 테스트 매트릭스 2.0 (`StressTestModal.tsx`, `stressTestEngine.ts`):
     - 고물가 4.5% + 국민연금 68세 순연 + 시장 -30% 폭락 3대 위기별 자산 고갈 나이, 런웨이 단축 연수 및 3대 긴급 방어 처방전 제시
- **검증 상태**: `npm run build` 성공(0 errors), 브라우저 화면 렌더링 검증 완료.







