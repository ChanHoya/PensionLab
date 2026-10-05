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

## Active Sprint / Story
- **Sprint 34** (완료): 유튜브/전문가 피드백 기반 정합성 고도화 및 신규 모달
  - **Story S34-1**: 정확성 보완 (주택연금 연소자 기준, 의료비/자녀지원비 반영, 단위오류 수정) (완료)
  - **Story S34-2**: 국민연금 증액 로드맵 (`NpsBoostRoadmapModal.tsx`) (완료)
  - **Story S34-3**: 부족액 역산 적립 플랜 (`SavingsPlanModal.tsx`) (완료)
  - **Story S34-4**: S4 배당 옵션 로직 버그 해결 및 실전 배당 ETF 포트폴리오 추천 (`DividendStrategyModal.tsx`) (완료)
  - **Story S34-5**: 조기·정상·연기연금 BEP 심층 대조 및 A·B값 재평가 인사이트 반영 (`NpsEarlyDeferralModal.tsx`) (완료)
- **Sprint 35** (착수 예정): 대시보드 및 AI 리포트 종합 연계 / 사용자 경험(UX) 고도화
  - 후보 과제 1: **Story S35-1** - AI 종합 진단 리포트 내 신규 도구(적립플랜, 배당ETF, 조기/연기BEP) 맞춤 진단 섹션 연동 강화
  - 후보 과제 2: **Story S35-2** - 종합 분석 PDF 다운로드 시 신규 툴(배당 포트폴리오, 증액 로드맵, BEP 분석) 리포트 페이지 확장
  - 후보 과제 3: **Story S35-3** - 온보딩에서 대시보드 및 AI 진단 리포트로 이어지는 전반적 사용자 여정 플로우 점검 및 최적화

## Session Handoff (Sprint 34 완료 & Sprint 35 준비)
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





