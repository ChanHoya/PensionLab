# Feature Registry

- **[FEAT-001] 3층 연금 통합 대시보드**: 국민연금, 기초연금, 퇴직연금, 개인연금 통합 차트 시각화 (Phase 1)
- **[FEAT-002] MVP 다층 연금 수동 입력 온보딩**: 온보딩 단계에서 각 층별 연금 필수 변수 입력 (Phase 1)
- **[FEAT-003] AI 연금 시뮬레이터**: 실시간 시급 시점 및 변수 시뮬레이터 (Phase 1)
- **[FEAT-004] 유튜브 전문가 콘텐츠 RAG**: Whispher/자막 파싱 및 pgvector 기반 연금 상담 Q&A (Phase 1)
- **[FEAT-005] 유튜브 전문가 동영상 임베딩 플레이어**: RAG 추천 영상 출처를 대시보드 내에서 바로 시청할 수 있는 iframe 모달 (Story S2-1)
- **[FEAT-006] 토스페이먼츠 연동 및 프리미엄 은퇴 처방 보고서 PDF 발행**: 1회성 결제를 통한 정밀 은퇴 자산 처방전 출력 및 PDF 다운로드 기능 (Story S2-2)
- **[FEAT-007] 국민연금공단(NPS) Codef API 간편인증 동기화**: 국민연금공단 인증 내역 9대 항목 자동 수집 및 Zustand store 매핑 (Story S2-3)
- **[FEAT-008] 금융감독원(FSS) 통합연금포털 Codef API 간편인증 동기화**: 금융감독원 인증 내역(퇴직연금, 개인연금, 연금보험) 자동 수집 및 Zustand store 매핑 (Story S7-1)
- **[FEAT-009] 활동기 집중형(체감식) 은퇴 연금 인출전략 (Spending Smile) 시뮬레이션 및 토글 기능**: 은퇴 초기 소비활동기 집중 지출 패턴을 적용한 체감형 인출 시뮬레이션 및 대시보드/리포트 연계 토글 구현 (Story S11-1)
- **[FEAT-010] MiniMax M3 기반 은퇴 자산 포트폴리오 진단 및 연금 리밸런싱 처방 기능**: 사용자의 3층 연금/가계 정보를 토대로 MiniMax M3의 고성능 추론(Reasoning) 과정을 통한 최적의 은퇴 포트폴리오 리밸런싱 및 인출 시기 처방 페이지 구현 (Story S12-1)
- **[FEAT-011] 금융감독원 통합연금 PDF 업로드 및 AI 자동 파싱**: 사용자가 통합연금포털에서 받아온 PDF 보고서 텍스트를 pdfjs-dist로 추출하고, gemini-3.5-flash 모델을 통해 1/2/3층 연금 데이터를 한 번에 파싱하여 Zustand store에 바인딩하는 기능 (Sprint 17)
- **[FEAT-012] 연금 정보창고(다중 PDF 도서관)**: 사용자가 은퇴 설계 전략을 참조할 수 있도록 랜딩 페이지에서 4가지 주요 연금/절세 리포트 PDF를 선택적으로 PdfViewerModal을 통해 읽을 수 있게 제공하는 디지털 도서관 기능 (Sprint 17)
- **[FEAT-013] 인출전략 비교 시뮬레이터 및 리포트/PDF 고도화**: 소득세법 및 건보료 피부양자 기준 룰셋을 반영한 S0~S3 비교 차트, 사용자 입력 위저드, 상세 연도별 테이블 및 PDF 다운로드 처방 리포트 기능 (Sprint 19)
- **[FEAT-014] 건보료 최적화 하이브리드(배당+연금) 인출 전략 (S4)**: 커버드콜 ETF 월 분배금 배당소득을 인당 연 1,000만원 이하로 통제하여 건보료 피부양자 자격을 방어하고, 부족 생활비는 건보료 비과세 사적연금(연 1,500만원 한도)/퇴직연금에서 우선 인출, 부부 명의 분산 토글 및 재산 요건 3단계 건보료 피부양자 판정 로직 (Sprint 24)
- **[FEAT-015] 국민연금 추가납부(추납) 대상 등록 및 손익분기 시뮬레이션**: 온보딩 STEP 1의 간편 시뮬레이션을 대체. 최초 가입년월·지속 가입개시 년월·중단 기간·사유·가입 상태로 추납 자격(최대 119개월)을 판정하고, 납부기한월 보험료율(2026년 9.5%→2033년 13%, 첫 납부기한 = 신청 다음 달) 기준 일시납/분납 추납액(분할납부이자 1년 단위 복리), 일시납 vs 분납 12·24·60회 납부·수령 비교표, 소득공제 환급, 추납 후 연금 월액, 현재가치 손익분기 나이, 기준소득월액 3안 비교를 제공. 룰셋 `src/config/npsRules.ts`, 대시보드 반영 토글 지원. 연금 정보창고에 「국민연금 추가납부 플랜」 PDF 추가 (Sprint 25)
- **[FEAT-016] 부부 통합 연금 진단·시뮬레이션**: 진단 단계를 본인/배우자 층별(국민·퇴직·개인연금 본인/배우자, 기초연금 2인)로 재구성하고 기본정보를 본인·배우자 2열(나이·은퇴·기대수명)로 입력. 국민연금 가입내역조회 화면 출력 PDF 업로드(규칙 기반 파싱)로 예상연금·반환일시금·추납 공백 자동 입력. 반환일시금 반납(공단 고지액 우선, 공단 고시 연도별 정기예금 이자율 복리 추정, 당시 소득대체율 복원)과 대안 D/B/C/A(현행·반납·추납·반납+추납) 원금 회수 비교. 기초연금 소득인정액·부부감액·국민연금 연계감액·소득역전 판정. 대시보드 부부 통합 섹션에서 연도별 부부 합산 국민·기초·퇴직·개인연금과 먼저 사망 시 유족연금 중복급여 조정(제56조)을 시뮬레이션 (Sprint 26)
- **[FEAT-017] 부부 가구 기반 AI 연금 종합 진단 & 전문 컨설팅 리포트**: 1인 중심 텍스트 진단을 부부 가구 관점으로 개편. 대시보드와 동일한 계산 엔진(추납·반납 반영 + 부부 통합 시뮬레이션 + S0~S4 가구 인출전략 시나리오)을 기반으로 5대 진단 차원(소득 충분성, 안정성, 세후효율, 3층분산, 장수·유족대비) 점수(0~100점) 및 종합 등급(A~E) 산출. Gemini 3.8 Flash 구조화 JSON(ReportNarrative) 기반 맞춤 처방과 계산 기반 기본 진단(fallback) 상시 제공. 표지, 6대 KPI 카드, 레이더 차트, 누적 흐름 영역 차트, 3층 피라미드/도넛, 리스크 매트릭스, 실행 로드맵, 인출순서/세제 최적화 인포그래픽 리포트 및 PDF 다운로드 기능 탑재 (Sprint 27)
- **[FEAT-018] 시기별 지출 곡선(연금 규모 설계) 맞춤형 인출 & AI 진단 와이드 뷰/PDF 가독성 분리**: 은퇴 초기 활동기(기본 5년) 여행·여가 등 기존 소비수준 100% 유지 후 연차별로 완만히 체감하는 맞춤 지출 곡선(활동기 집중형 / 3단계 생애주기형 / 균등형) 설계 옵션 추가, 사적연금 평탄화 및 인출 엔진 연동, 가구 종합 진단 현실화(고정치 결손액 대신 지출 곡선 대비 충족률 및 충분성/안정성 재산정), AI 포트폴리오 진단 화면 가로폭을 자산관리와 동일하게 1680px로 최대 확장하면서도 PDF 출력 시에는 A4 세로 규격 최적 가독성(1040px 고정 렌더링)으로 별도 캡처/출력되도록 분리 (Sprint 28)
- **[FEAT-020] 대시보드 시뮬레이션 설명 요약 & 4대 산정기준 접이식 탭, AI 진단 실질/명목 토글, S4 커버드콜 배당 누적·재투자(스노우볼형) 및 비상자금 안전 버퍼 모델링**:
  1) 대시보드 시뮬레이션 지표(KPI 4종) 복원 및 4대 산정기준 가로 나란히 탭 바 & 드롭다운 개편: 4개 줄을 차지하던 접이식 박스를 1개 행의 4버튼 탭 바로 콤팩트화하고, 줄어든 상단 공간에 은퇴 후 평균 월 연금액, 생애 총 수령 연금액 등 대시보드 핵심 지표 4종 배치 (현재가치/명목 토글 실시간 연동) (Sprint 30)
  2) AI 포트폴리오 진단 화면(03 가구 연금 현금흐름 & 맞춤 지출 곡선)에 대시보드와 동일한 `[현재가치(실질) | 명목 금액]` 세그먼트 토글 스위치 및 실시간 차트/서브타이틀 반응형 전환 기능 추가 (Sprint 30)
  3) S4 하이브리드 전략의 배당금 운용 정책(`dividendPolicy`: "REINVEST" | "BUFFER" | "PAYOUT") 신설 및 계산 엔진(`withdrawalCalculator.ts`) 고도화: 생활비 부족분 충당 후 잉여 배당금을 커버드콜 원금에 재투자하여 배당 원금을 복리 증식(스노우볼형)하거나, 별도의 안전 비상자금 풀(연 2.5% MMF/파킹 복리)에 적립하여 초고령기 간병비 버퍼로 확보하는 모델링 구현, 사이드바 옵션 및 대시보드 배너/테이블 연동 완료 (Sprint 30)
  4) AI 진단 스코어카드(섹션 02) 레이더 차트 확대 및 우측 5대 진단 영역 항목·가중치·설명1 인라인 콤팩트화(`[항목명] 가중치 N% : [설명1]` / 점수 우측 정렬 / 프로그레스 바 / 설명2 코멘트), 섹션 04 연금 구조 분석 차트 명칭 정비(`3층 비중` → `연금 비중`, `사람별 3층 수령액` → `개인별 연금 수령액 비중`) (Sprint 30)
- **[FEAT-021] 대표 가구 페르소나 3종 원클릭 샘플 로더 및 대시보드/온보딩/AI진단 연동**:
  1) 40대 맞벌이 직장인(표준 3층 연금/스노우볼형), 50대 외벌이 대기업·공기업 퇴직 준비(고액 DB/IRP/추납/안전버퍼형), 40대 자영업·전문직 프리랜서(IRP/노란우산/월배당 전액소비형) 등 3대 가구 페르소나 데이터셋(`src/config/personas.ts`) 구축
  2) 원클릭 프리셋 로더 모달(`src/components/PersonaPresetModal.tsx`) 제작: 카드별 핵심 지표 4종, 태그 배지, 타겟 설명, 전략 팁을 시각화하고 즉시 로컬 메모리에 동기화 적용
  3) 온보딩 첫 화면 퀵스타트 배너 & 헤더 버튼, 자산관리 대시보드 상단 헤더 & `dataActions` 바, AI 포트폴리오 진단 헤더 전반에 원클릭 연동 지원 (Sprint 31, Story S31-1)
- **[FEAT-022] S4 배당 운용 정책(스노우볼/안전버퍼/소비형) 정밀 연동 및 AI 종합 진단 리포트 고도화**:
  1) 가구 인출 시나리오(`householdScenarios.ts`)에서 S4의 `finalCoveredCallAsset`(최종 커버드콜 잔고) 및 `finalDividendBuffer`(최종 비상자금 버퍼 잔고)를 병합 집계하도록 확장
  2) 가구 종합 진단 계산기(`householdReport.ts`)에 `S4DividendAnalysis` 인터페이스 신설: 초기 투자원금, 1인당 배당금, 건보료 피부양자 안전 여부, 누적 생활비 충당액/재투자액/버퍼적립액, 최종 잔고 및 정책별 핵심 이점/리스크/전략 처방 자동 산출, 장수·유족 대비 평가에 비상버퍼 안전성 실시간 반영
  3) AI 진단 프롬프트 및 리포트 팩트(`reportNarrative.ts`, `api/ai/advisor/route.ts`): S4 배당 정책 지표 블록 주입 및 Gemini 시스템 프롬프트에 CFP 전문가 심층 처방 지침 강화, fallbackNarrative 정책별 맞춤 처방(강점·리스크·실행로드맵·절세팁) 탑재
  4) AI 종합 진단 리포트(`DiagnosisReport.tsx`): 섹션 05 인출전략 비교 내 S4 배당 운용 정책 전용 인포그래픽 패널 신설(정책 배지, 4대 핵심 지표 카드, 전문 처방 및 건보료 가이드 콜아웃) (Sprint 31, Story S31-2)
- **[FEAT-023] 국민연금 조기노령 vs 정상 vs 연기연금 손익분기점(BEP) 인터랙티브 비교기**:
  1) 국민연금법(제61조·제61조의2·제62조)에 따른 출생연도별 법정 개시 나이(60~65세), 조기 감액률(연 6%, 최대 -30%), 연기 가산율(연 7.2%, 최대 +36%) 기반 정밀 BEP 연산 엔진(`src/services/npsEarlyDeferralBep.ts`) 구축
  2) 골든 크로스오버 나이(조기 vs 정상 크로스오버 약 76.7세, 정상 vs 연기 크로스오버 약 83.9세, 조기 vs 연기 크로스오버 약 80.6세) 및 사용자 기대수명 기준 맞춤 추천 전략 자동 도출
  3) 인터랙티브 Recharts 누적 수령액 곡선 차트(ReferenceLine 크로스오버/기대수명 마커 및 커스텀 툴팁), 3대 전략 상세 비교 카드(개시 나이·월 수령액·80/85/90세 누적액·건보료 피부양자 자격 판정·장단점·권장 대상) 및 CFP 의사결정 가이드 탑재
  4) 대시보드 상단 헤더(`btn-header-nps-bep`), `dataActions` 바(`btn-nps-bep-actions`), `CoupleSimulationSection` 탭 바 및 `국민연금 적립·인상 기준` 상세 드롭다운 내 손익분기 비교기 모달(`src/components/NpsEarlyDeferralModal.tsx`) 연동 (Sprint 31, Story S31-3)
- **[FEAT-024] 시뮬레이션 연도별 상세 테이블 필터링 및 엑셀(CSV) 내보내기**:
  1) UTF-8 BOM(\uFEFF) 지원 한국어 엑셀 호환 CSV 다운로드 유틸리티(`src/utils/exportCsv.ts`) 구현 (쉼표/따옴표/줄바꿈 완벽 이스케이프 및 즉시 브라우저 다운로드)
  2) 부부 연금 시뮬레이션 요약 표(`CoupleSimulationSection.tsx`): 5년 간격 요약(`5YEARS`) vs 주요 마일스톤(`EVENTS`: 은퇴, 국민연금개시, 기초연금, 70/80세, 유족연금전환 등) vs 전체 연도(`ALL`: 1년 단위) 세그먼트 필터 및 비고 이벤트 태그, `📥 엑셀(CSV) 다운로드` 기능 추가
  3) 인출전략 연도별 상세 현금흐름 및 세후 시뮬레이션 표(`page.tsx`): 전체 연도(`ALL`) vs 5년 간격(`5YEARS`) vs 주요 마일스톤(`EVENTS`: 소득공백, 연금개시, 세제감면종료, 적자발생, 피부양자탈락 등) 필터 및 전략별 세전/세후/공제액 정리 `📥 엑셀(CSV) 다운로드` 기능 연동 (Sprint 31, Story S31-4)
- **[FEAT-025] 소득세법상 사적연금 인출 시작 최소 연령(만 55세) 강제화 및 UI 가이드**:
  1) 소득세법 제20조의3, 제129조의2 및 근로자퇴직급여 보장법에 의거, 사적연금(퇴직연금 DB/DC/IRP, 개인연금저축, 연금보험)의 최소 수령 가능 연령을 `MIN_PENSION_WITHDRAWAL_AGE = 55`로 계산 엔진(`withdrawalCalculator.ts`, `coupleSimulation.ts`, `pensionCalculator.ts`) 전반에 강제 클램핑
  2) 부부 가구 지출 평탄화 분배(`planHouseholdSmoothing`) 시 본인 및 배우자가 만 55세 미만인 연도에는 사적연금 수령 자격을 차단(0원 처리)하고 각자 55세에 도달한 시점부터만 인출 배분되도록 분리
  3) 대시보드 사이드바 인출 시작 나이 인풋에 `min={55}`, 55세 미만 시 `비우면 55세 (법정 최소 55세)` 플레이스홀더, 포커스 아웃 시 55세 자동 보정(`onBlur`), 및 소득세법 법정 최소 연령 안내 캡션 추가
- **[FEAT-026] 사적연금 연 1,500만원 절세 한도 최적화기**:
  1) 소득세법 제20조의3/제129조의2 기준 연 1,500만원(월 125만원) 초과 연도 실시간 감지 및 경고 배지 산출 엔진(`src/services/privatePensionTaxOptimizer.ts`) 구현
  2) 16.5% 분리과세 vs 종합소득세율 유불리 자동 판정 및 초과 페널티 세액 산출
  3) 수령 기간 연장(스프레드) 시 전액 저율과세(3.3~5.5%) 혜택 복원에 따른 생애 절세액 및 권장 수령 기간 제시 모달(`src/components/PrivatePensionTaxModal.tsx`) 연동 (Sprint 32, Story S32-1)
- **[FEAT-027] 은퇴 후 지역건강보험료 모의 고지서 및 임의계속가입(36개월) 절감 계산기**:
  1) 2024~2026년 국민건강보험법 기준 재산세 과세표준(1억원 기본공제 후 등급제, 점수당 208.4원), 공적연금(50% 인정, 7.09%), 금융소득(1,000만원 초과 시 전액 7.09%), 장기요양보험료(12.95%) 합산 지역보험료 정밀 모의 고지서 연산 엔진(`src/services/localHealthInsuranceCalculator.ts`) 구현
  2) 퇴직 후 36개월간 종전 직장보험료 수준 납부가 가능한 임의계속가입 제도 비교 및 36개월간 총 절감액 산출
  3) 영수증 고지서 스타일 모달 UI 및 실시간 자산·소득 조정 슬라이더(`src/components/HealthInsuranceBillModal.tsx`) 연동 (Sprint 32, Story S32-2)
- **[FEAT-028] 한국주택금융공사(HF) 주택연금(역모기지) 결합 시뮬레이션**:
  1) 한국주택금융공사 공시 기준 연령별 주택가격 1억원당 월지급금 계수(만 55세 16만원 ~ 만 90세 89만원 선형 보간) 기반 정밀 역모기지 연산 엔진(`src/services/reverseMortgageCalculator.ts`) 구현
  2) 부부 시뮬레이션 엔진(`coupleSimulation.ts`) 및 현금흐름 차트 계열(`pensionSeries.ts`), 엑셀 내보내기(`exportCsv.ts`)에 주택연금 고정 월지급금 레이어 추가
  3) 주택 공시가(1억~12억 상한) 및 개시 나이(55~85세) 슬라이더, 4대 안심 보장 안내 및 시뮬레이션 On/Off 결합 모달(`src/components/ReverseMortgageModal.tsx`) 연동 (Sprint 32, Story S32-3)
- **[FEAT-029] 대시보드 은퇴 자산 수비 3종 도구 및 AI 진단 리포트 연동**:
  1) 대시보드 `dataActions` 바 및 `DashboardSidebar` 내 전용 접이식 그룹(은퇴 자산 수비 & 절세 도구)에 절세 1,500만 한도·지역건보료 모의·주택연금 결합 3대 퀵 모달 연동
  2) AI 종합 진단 리포트(`reportNarrative.ts`, `DiagnosisReport.tsx`) 세제 및 인출 최적화 섹션에 임의계속가입 활용법 및 주택연금 결합 처방 팁 자동 생성 (Sprint 32, Story S32-4)
- **[FEAT-030] 은퇴 소득 공백기(소득 크레바스) 브릿지 집중 플래너**:
  1) 주직장 퇴직(55~60세)부터 국민연금 법정 개시(63~65세) 사이 소득 공백 구간 및 결손 총액 자동 산정 엔진(`src/services/incomeBridgeCalculator.ts`) 구현
  2) 실업급여(구직급여: 최대 9개월, 2026년 이직자 1일 상한 68,100원, 월 약 204만원), 사적연금(퇴직/개인연금) 분할 인출, 건보료 임의계속가입(36개월) 절감 및 주택연금 조기 브릿지 4대 방어 수단 모델링
  3) 소득 공백기 월간 수지 타임라인 테이블, 자금 충족률 및 안전도 등급 카드, CFP 3대 조언 모달(`src/components/IncomeBridgeModal.tsx`) 연동 (Sprint 33, Story S33-1)
- **[FEAT-031] 부부 기대수명 차이에 따른 '홀로 남은 배우자(1인 가구)' 생애 케어 고도화**:
  1) 부부 중 1인 먼저 사망 시 OECD 기준 1인 가구 생활비(부부 생활비의 70%) 감소 계수 반영
  2) 국민연금법 제56조(중복급여 조정: 본인 노령연금 + 유족연금 30% vs 유족연금 100%) 자동 유리 대안 판정 엔진(`src/services/survivorCareCalculator.ts`) 구현
  3) 주택연금(역모기지) 100% 종신 승계 보장 및 만 85세 이후 초고령기 집중 간병비(월 100만원) 리스크 시뮬레이터 모달(`src/components/SurvivorCareModal.tsx`) 연동 (Sprint 33, Story S33-2)
- **[FEAT-032] ISA 만기 자금 연금계좌 전환 & 절세 3총사(연금저축/IRP/ISA) 통합 플래너**:
  1) 조세특례제한법 제91조의18 기준 3년 만기 ISA 전환금액의 10%(최대 300만원) 추가 세액공제(연간 최대 1,200만원 한도) 및 연말정산 환급액(13.2~16.5%) 산출 엔진(`src/services/isaPensionTransferCalculator.ts`) 구현
  2) 3년 주기 풍차돌리기 반복 회차별 누적 절세액 및 일반계좌 vs ISA vs 연금계좌 5대 핵심 세제 비교표
  3) 인터랙티브 자금/총급여 슬라이더 및 전문가 운용 팁 모달(`src/components/IsaPensionTransferModal.tsx`) 연동 (Sprint 33, Story S33-3)
- **[FEAT-033] 대시보드 툴바 연동 및 스마트폰 모바일 뷰포트 반응형 최적화**:
  1) 대시보드 `dataActions` 바(소득공백기·유족케어·ISA전환) 및 `DashboardSidebar` 내 전용 퀵 버튼 3종 추가 배치
  2) 모바일 스마트폰(화면 폭 768px 이하) 환경 터치 가로 스크롤(`.data-actions-bar`, 터치 테이블) 및 팝업 모달 여백/반응형 높이 CSS 최적화
  3) AI 종합 진단 리포트(`reportNarrative.ts`) 세제 팁 영역에 ISA 만기 전환, 소득 공백기 방어, 홀로 남은 배우자 보호 처방 조언 연동 (Sprint 33, Story S33-4)
- **[FEAT-034] 국민연금 증액 로드맵 (반납 → 추납 → 임의계속가입 → 연기연금)**:
  1) 입력된 반납·추납 정보와 화면 옵션(임의계속가입 기준소득, 연기 기간·비율)으로 단계별 월 연금(현재가치), 증가분, 드는 돈(반납금·추납 순비용·임의계속 보험료·연기로 미루는 수령액), 단순 회수 기간, 최종 배수 산출 (`src/services/npsBoostRoadmap.ts`)
  2) 본인/배우자 탭과 부부 합산 KPI, 계단식(워터폴) 차트, 부분 연기연금(50~90%)·연기 손익분기 약 84세·건보 피부양자 연 2,000만원 초과 경고·추납 제도 개편 리스크 안내 (`src/components/NpsBoostRoadmapModal.tsx`, Sprint 34, Story S34-2)
- **[FEAT-035] 부족액 역산 적립 플랜**:
  1) 매월 납입(물가 연동 선택) → 거치 → 수령의 월복리 적립 엔진, 현재가치·명목 적립금과 실질 수익률 기준 월 수령액, 부족액(월 부족액 + 일시 필요액)을 메우는 필요 월 납입액 역산, 연금저축·IRP 세액공제 환급 (`src/services/savingsPlan.ts`)
  2) 진단 부족액·필요 납입액·월 수령·세액공제 KPI, 적립금 잔액 그래프, 수익률 3시나리오 표, 「노후 월 500만원 3원칙」(국민연금 30년·연금계좌 월 75만원·내 집) 점검표, 대시보드 툴바(🎯 적립 플랜)·사이드바 진입 (`src/components/SavingsPlanModal.tsx`, Sprint 34, Story S34-3)
- **[FEAT-036] 인출전략 시나리오 현재가치(실질) vs 명목금액 전환 및 상단 시뮬레이션 양방향 동기화**:
  1) 인출전략 시나리오 헤더에 `[현재가치(실질 구매력) | 명목 금액]` 토글 스위치 신설 및 상단 부부 통합 연금 시뮬레이션 토글과의 양방향 상태 동기화
  2) 현재가치(실질) 선택 시 연도별 물가 할인율 `(1+infl/100)^t`를 적용하여 4대 인출 전략(S0, S1, S3, S4)의 세후 수령액, 세금&건보료, 바 차트, 영역/라인 차트, 상세 테이블, CSV 다운로드까지 일관된 실질 구매력 지표로 실시간 변환 지원 (Sprint 34)
- **[FEAT-037] 실전 연금 배당 투자 포트폴리오 가이드 및 격주 배당 캘린더**:
  1) 국내 대표 연금 전문가 포트폴리오 다각도 조사 기반 4대 대표 배당 포트폴리오(배당성장형, 월배당 인컴형, 안전 복합형, 리츠 인프라형)와 실제 국내 상장 ETF(TIGER 미국배당다우존스 458730, SOL 미국배당미국채혼합50 490490 등) 티커 매핑
  2) IRP 30% 안전자산 룰 적격 여부 가이드, 실전 추천 ETF 10선 원클릭 티커 복사, 월초/월중/월말 격주 배당 캘린더 모달(`src/components/DividendStrategyModal.tsx`) 연동 및 대시보드/사이드바 연결 완료 (Sprint 34, Story S34-4)
- **[FEAT-038] AI 종합 진단 리포트 신규 처방 도구 툴킷 심층 연동**:
  1) Gemini 3.8 Flash 시스템 프롬프트 및 `fallbackNarrative`에 신규 8대 전문 시뮬레이션 도구(SAVINGS_PLAN, DIVIDEND_STRATEGY, NPS_BEP, NPS_BOOST, INCOME_BRIDGE, SURVIVOR_CARE, ISA_TRANSFER, REVERSE_MORTGAGE) 팩트 주입 및 실행 로드맵(`actions`) `toolId` 매핑
  2) AI 종합 진단 리포트(`DiagnosisReport.tsx`) 섹션 07 실행 로드맵 카드 내 전용 `바로가기 ↗` 버튼 제공
  3) 섹션 10 **"맞춤 은퇴 처방 툴킷 (Solution Toolkit)"** 인터랙티브 카드 그리드 신설 및 AI 진단 페이지(`page.tsx`) 원클릭 모달 연동 완료 (Sprint 35, Story S35-1)
- **[FEAT-039] 종합 진단 PDF 다운로드 리포트 확장 & 인쇄 최적화**:
  1) PDF 인쇄 모드(`isPrintMode`) 전용 3열 경영 요약본(Executive Summary: 진단 결론·최적 인출 전략·우선 권장 과제) 패널 신설
  2) 실행 로드맵(섹션 07) 버튼을 인쇄용 연계 배지로 자동 치환 및 섹션 10 처방 툴킷을 A4 가로 인쇄 최적화 4열 그리드 및 문서형 배지로 전환 (Sprint 35, Story S35-2)
- **[FEAT-040] 온보딩 ➔ 대시보드 ➔ AI 진단 사용자 여정 UX 고도화**:
  1) 온보딩 Step 4 완료 시 `[대시보드 바로가기 📊]` 및 `[AI 종합 진단 받기 🔮]` 듀얼 내비게이션 버튼 제공
  2) 대시보드 상단 결과 영역에 AI 종합 진단 리포트 안내 배너 탑재 및 상호 직관적 이동 지원 (Sprint 35, Story S35-3)
- **[FEAT-041] S4 커버드콜 가격수익률(NAV 변동률) 2변수 모델 및 shortfall 인플레이션 인덱싱**:
  1) `SimulationParamsState`에 `coveredCallPriceReturnRate`(연간 가격수익률 %, 기본 0.0%) 필드 신설 및 은퇴 후 연차별 자본손익 복리 반영
  2) 보수(-5%) 시나리오 시 20년 뒤 원금이 약 1,792만원으로 하락하는 현실적 NAV 침식 및 배당금 비례 축소 모델링
  3) S4 shortfall 연산 시 물가상승률(`inflationFactor = (1+infl)^t`) 인덱싱 적용으로 기준 불일치(FP-020) 해결 및 금감원 핵심위험 안내 고지 탑재 (Sprint 36, Story S36-1, S36-2)
- **[FEAT-042] 배당 투자 계좌 유형 분리 및 IRP 70% 안전자산 규제 진단기**:
  1) S4 전략 내 계좌 유형(`coveredCallAccountType: "TAXABLE" | "PENSION"`) 선택 지원: 일반 위탁(15.4% 원천징수) vs 연금계좌(3.3~5.5% 과세이연 및 건보료 금융소득 비과세 면제)
  2) 퇴직연금감독규정 기반 IRP 위험자산 70% 한도 및 안전자산 30% 의무 판정 엔진(`src/services/pensionAccountRules.ts`) 구현 및 초과 시 경고·필요 안전자산 산출 (Sprint 36, Story S36-3)
- **[FEAT-043] transitions.dev 기반 모션 디자인 시스템 및 마이크로 인터랙션 훅**:
  1) `globals.css` 내 transitions.dev 모션 토큰(`--ease-spring`, `--digit-*`, `--modal-spring-*`, `--tab-slider-*`) 및 키프레임 애니메이션 등록
  2) 공통 마이크로 인터랙션 컴포넌트(`src/components/motion/`): 숫자 팝인(`NumberPopIn`), 슬라이딩 탭(`SlidingTabs`), 성공 체크 복사 버튼(`CopyCheckButton`), 3D 카드 틸트(`CardTilt`) 구축
  3) 전문 모달(`DividendStrategyModal`) 스프링 진입(`t-modal-spring`) 및 종목코드 복사 피드백(`t-success-check`) 연동 완료 (Sprint 37, Story S37-1)
- **[FEAT-044] 대시보드 KPI 롤링 카운터, 슬라이딩 탭 및 8대 모달 스프링 트랜지션**:
  1) `CoupleSimulationSection.tsx` 부부 연금 시뮬레이션 4대 KPI 수치 및 `dashboard/page.tsx` 인출전략 추천 수치에 `NumberPopIn` 카운팅 롤링 모션 연동
  2) 인출 최적화 처방 조언 시나리오 탭(S0, S1, S3, S4)에 부드러운 인디케이터 슬라이딩을 지원하는 `SlidingTabs` 연동
  3) 8대 전문 분석 모달(`PrivatePensionTaxModal`, `HealthInsuranceBillModal`, `ReverseMortgageModal`, `IncomeBridgeModal`, `SurvivorCareModal`, `IsaPensionTransferModal`, `SavingsPlanModal`, `NpsBoostRoadmapModal`, `NpsEarlyDeferralModal`, `PersonaPresetModal`, `PdfViewerModal`) 다이얼로그 래퍼에 `t-modal-spring` 클래스 일괄 적용 완료 (Sprint 37, Story S37-2)
- **[FEAT-045] AI 종합 진단 (AI Advisor) Thinking States & Reasoning Stream 프리미엄 연출**:
  1) Gemini 3.8 Flash 종합 진단 대기 상태 중 transitions.dev Reasoning Stream 인터랙티브 시뮬레이션 컴포넌트(`src/components/motion/AiThinkingStream.tsx`) 개발
  2) 4단계 순차 분석(입력 데이터 검증 → 3층 연금 및 결손액 분석 → AI 맞춤 처방 생성 → 종합 진단 리포트 조립), 상단 실시간 프로그레스 바, 쉬머 텍스트(`t-shimmer-text`), 단계별 완료 체크 피드백 연출
  3) AI 종합 진단 페이지(`dashboard/ai-advisor/page.tsx`) 로딩 중 화면 연동 및 `DiagnosisReport.tsx` 점수 게이지(`ScoreGauge`)에 `NumberPopIn` 카운팅 연동 완료 (Sprint 37, Story S37-3)
- **[FEAT-046] 온보딩 슬라이딩 탭 및 랜딩 페이지 3D 틸트/글로시 CTA 비주얼 업그레이드**:
  1) 온보딩 마법사 Step 0 가로 내비게이션 바(적용대상/재무목표/금감원자료/페르소나체험)에 `SlidingTabs` 연동 및 상단 시작 버튼에 유리 광택(`t-btn-glossy`) 효과 적용
  2) 랜딩 페이지(`src/app/page.tsx`) 히어로 '시뮬레이션 시작하기 🚀' CTA 버튼에 `t-btn-glossy` 모션 적용
  3) 랜딩 페이지 '벤치마킹 참고 서비스 탐색' 카드 그리드에 transitions.dev 인터랙티브 3D 원근 반사 컴포넌트(`CardTilt`) 연동 및 모달 스프링 팝업(`t-modal-spring`) 적용 완료 (Sprint 37, Story S37-4)
- **[FEAT-047] 전체 모달 컴포넌트 다크/라이트 테마 일관성 일원화**:
  1) `globals.css` 내 모달 전용 테마 변수 토큰(`--modal-bg`, `--modal-surface`, `--modal-surface-sub`, `--modal-surface-card`, `--modal-border`, `--modal-border-subtle`, `--modal-subbox-bg`, `--modal-subbox-border`, `--modal-table-th`, `--modal-table-border`, `--tooltip-bg`, `--tooltip-border`, `--tooltip-text`) 정의
  2) 전체 11개 전문 팝업 모달(`NpsBoostRoadmapModal`, `SurvivorCareModal`, `DividendStrategyModal`, `IncomeBridgeModal`, `IsaPensionTransferModal`, `ReverseMortgageModal`, `SavingsPlanModal`, `HealthInsuranceBillModal`, `PrivatePensionTaxModal`, `NpsEarlyDeferralModal`, `PersonaPresetModal`)의 하드코딩된 다크 배경 제거 및 테마 토큰 일괄 바인딩
  3) 라이트모드에서 순백/연회색 카드 배경 및 명확한 글자 대비 가독성 확보, 다크모드 시 ETF Lens 테마 자동 동기화 지원
- **[FEAT-048] 은퇴 자산 포트폴리오 시장 시나리오 백테스트 & 배당 복리 시뮬레이터**:
  1) `src/services/portfolioBacktest.ts` 엔진: 최신 10개년 실전 시장(2016~2025), 복합 위기 스트레스, 횡보 인컴장 시나리오 기반 5대 자산군(미당다, 커버드콜, S&P500, 국채, 리츠) 비중 시뮬레이션
  2) 배당 전액 재투자(스노우볼) vs 현금 인출(소비형) 비교 및 CAGR, 최대 낙폭(MDD), 누적 배당금 산출
  3) `src/components/PortfolioBacktestModal.tsx` 모달: Recharts 복합 차트, KPI 카드, 상세 연도별 테이블, 대시보드 툴바/사이드바 및 AI 진단 툴킷 연동 (Sprint 38, Story S38-1)
- **[FEAT-049] 모바일 뷰포트 터치 제스처 & 접근성(a11y) 세부 폴리싱**:
  1) 모바일 뷰포트(768px 이하) 바텀시트형 모달 래퍼, 슬라이더 터치 타겟(22px thumb) 및 `-webkit-tap-highlight-color: transparent` 터치 제스처 최적화
  2) 모바일 테이블 가로 스크롤 관성 터치(`-webkit-overflow-scrolling: touch`), 슬라이딩 탭 스크롤 최적화
  3) 모달 대화상자 접근성 표준 준수 (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, 닫기 버튼 `aria-label="닫기"`, `:focus-visible` 포커스 링) (Sprint 38, Story S38-2)
- **[FEAT-050] 관련 뉴스 및 유튜브 전문가 추천 영상 실시간 최신화 & 새로고침 파이프라인**:
  1) 실시간 정책 뉴스 갱신 및 HTML 태그 정제 (`src/app/api/news/route.ts`, `src/app/news/page.tsx`):
     - `?refresh=true` 쿼리 파라미터 시 Next.js Data Cache 우회(`cache: "no-store"`) 및 Google News RSS 원본 피드 즉시 재페칭
     - Google News description의 이스케이프된 HTML 엔티티(`&lt;a href...&gt;`) 누출 결함 수정 및 순수 요약 텍스트 정제
     - 뉴스 페이지 상단에 `🔄 최신 뉴스 새로고침` 버튼, 로딩 스핀 애니메이션, 최종 갱신 시각 타임스탬프 인디케이터 탑재 (Sprint 39, Story S39-1)
  2) 3대 연금 채널 공식 YouTube RSS 실시간 수집 및 추천 영상 새로고침 (`src/app/api/youtube/route.ts`, `src/app/youtube/page.tsx`):
     - 박곰희TV(`UCr7XsrSrvAn_WcU4kF99bbQ`), 연금박사 이영주(`UCD9mxN8o9qLei1MbzroeP_A`), 연금이야기(`UCXRlkKtaSUSAiZXQrpOFwaA`) 공식 Channel RSS 피드 파싱 전용 API 라우트 신설
     - API Key 소진 없는 2026년 최신 발행 영상 실시간 수집, 카테고리 자동 판정 및 네트워크 장애 시 기존 시드 안전 Fallback 보장
     - 유튜브 추천 영상 페이지 상단에 `🔄 최신 영상 새로고침` 버튼 및 최근 갱신 시각 탑재, 채널 필터 및 검색과 완벽 연동 (Sprint 39, Story S39-2)
- **[FEAT-051] 뉴스 기사 상세 원문 뷰어(Iframe 프록시 & 와이드 모달)**:
  1) Google News RSS 리다이렉트 URL batchexecute 실시간 디코딩 및 언론사 원본 웹사이트 페칭 서버리스 프록시(`src/app/api/news/proxy/route.ts`) 구축
  2) `X-Frame-Options: ALLOWALL` 및 `frame-ancestors *` 헤더 우회, 상대 경로 리소스 대응 `<base href="...">` 자동 주입, Frame-busting 스크립트 중화
  3) 브라우저 화면 공간을 시원하게 채우는 98vw/94vh 와이드 팝업 모달, 기사 원문 사이트 실시간 렌더링, 상단 툴바(카테고리, 언론사, 일자, 제목, 새 창에서 원문 보기 ↗, 닫기) 탑재 (Sprint 39, Story S39-3)
- **[FEAT-052] 뉴스 TOP 3 기사별 5줄+ 펼치기/접히기 스크롤 & 유튜브 2열 모달(영상 요약 전면 확장 및 단일 박스 핵심 메시지)**:
  1) 관련 뉴스 (`src/app/news/page.tsx`):
     - 뉴스 카드 그리드 상단에 오늘의 연금 주요 뉴스 TOP 3 통합 브리핑 박스(`topSummaryBox`) 탑재
     - 3개 주요 기사 중 원하는 기사를 클릭(또는 `펼치기 ▾` 버튼) 시, 해당 기사 영역이 **5줄 이상 본문이 넉넉히 보이는 높이로 확장**되며 내부 세로 스크롤(`overflowY: "auto"`)로 상세 기사 내용을 끝까지 탐색 가능
     - `내용 접히기 ▴` 클릭 시 다시 1~2줄 컴팩트 요약으로 즉시 복귀, 펼쳐진 상태에서 `🌐 원문 기사 뷰어로 크게 보기 ↗` 원클릭 연동
  2) 유튜브 추천 영상 (`src/app/youtube/page.tsx`, `src/app/api/youtube/route.ts`):
     - 제목 및 본문 요약에서 노이즈 `#키워드`(해시태그) 정규식 완전 제거
     - `📌 영상 요약`: 상단 우측 패널의 남은 세로 공간 전체(`flex: 1`, `minHeight: 160px`)를 시원하게 채우며 말줄임 없는 풀 텍스트와 스크롤 지원
     - `🎯 핵심 메시지`: 빈 공간 낭비가 없도록 개별 카드 분할 대신 **단일 박스(`singleCoreMessageBox`)** 내에서 텍스트 줄간([1]~[4])으로 콤팩트하게 분리하여 깔끔하게 제공

- **[FEAT-053] 초심자 친화적 UX 고도화 (30초 퀵 간편 진단 & 스마트 금융/연금 용어사전 툴팁) 및 대시보드 리팩토링**:
  1) 초심자를 위한 30초 퀵 간편 진단 (Easy Mode, `src/services/quickDiagnosis.ts`, `src/components/QuickDiagnosisModal.tsx`):
     - 현재 나이, 은퇴 나이, 월 소득, 가구 형태(부부/1인) 4가지 입력만으로 통계청/국민연금공단 평균 모델을 기반으로 은퇴 후 예상 월 연금, 목표 생활비 대비 부족액, 준비율(%) 및 A~E 등급 실시간 도출
     - "🚀 이 결과로 대시보드 바로 체험하기" 원클릭 지원으로 초보자의 복잡한 온보딩 입력 장벽을 획기적으로 완화
     - 랜딩 페이지(`/`), 온보딩 페이지(`/onboarding`), 대시보드(`/dashboard`) 상단 헤더에 `⚡ 30초 퀵 진단` 글로벌 진입 버튼 탑재
  2) 스마트 금융/연금 용어사전 및 인라인 툴팁 시스템 (`src/config/glossary.ts`, `src/components/GlossaryTooltip.tsx`):
     - 14개 핵심 전문 용어(소득 크레바스, 피부양자 탈락, 사적연금 1500만 한도, A값/B값, 조기노령 BEP, 추납, 과세이연, 임의계속가입, 주택연금 연소자 기준, ISA 전환 등)에 대한 초등/중학생 눈높이 1줄 쉬운 비유와 실전 꿀팁 제공
     - 점선 밑줄(`borderBottom: dashed`) 및 ⓘ 아이콘, 호버/터치 시 부드러운 스프링 모달 팝오버, 관련 계산기 모달 원클릭 바로가기 버튼 연동
  3) 대시보드 모달 상태 단일화 및 컴포넌트 모듈화 리팩토링 (`src/components/DashboardToolbar.tsx`, `src/components/DashboardModalManager.tsx`, `src/app/dashboard/page.tsx`):
     - 12개의 boolean useState 상태를 `activeModal: DashboardModalType`으로 단일화하고 `DashboardModalManager`로 일괄 분리
     - 약 200줄에 달하던 툴바 액션 JSX를 `DashboardToolbar`로 컴포넌트화하여 코드 가독성과 유지보수성 대폭 향상 (Sprint 40)

- **[FEAT-054] 퇴직연금 DB vs DC 전환 및 임금피크제 최적 타이밍 시뮬레이터**:
  1) 계산 엔진 (`src/services/dbDcTransitionCalculator.ts`):
     - 임금상승률과 DC 기대수익률 간의 크로스오버 분석을 통한 황금 타이밍(Golden Time) 자동 산출
     - 임금피크제(피크 시작 나이, 연차별 임금 삭감률 10~30%) 적용 시 평생 퇴직금 삭감 방어 전략 역산
     - 3대 시나리오 비교: [전략 A: DB 유지] vs [전략 B: 임금피크 직전 DC 전환] vs [전략 C: 즉시 DC 전환]
  2) 모달 UI (`src/components/DbDcTransitionModal.tsx`):
     - 현재 나이, 은퇴 나이, 근속연수, 월 급여, 임금상승률, DC 수익률, 임금피크제 옵션 슬라이더
     - 3대 전략 카드 및 은퇴 시점 퇴직급여 격차(수천만원), Recharts 누적 성장 곡선, 연도별 상세 테이블 제공 (Sprint 41, Story S41-1)

- **[FEAT-055] 은퇴자 맞춤 3-Bucket 현금 버퍼 플래너 (하락장 방패 설계)**:
  1) 계산 엔진 (`src/services/threeBucketCalculator.ts`):
     - Bucket 1 (1~2년 안심 현금: CMA/예금/단기채) + Bucket 2 (3~7년 중기 인컴: 배당성장 ETF/만기매칭 채권/리츠) + Bucket 3 (8년+ 장기 복리 성장: S&P500/나스닥100/TDF) 최적 자산배분
     - 시장 폭락(약세장) 발생 시 주식을 1주도 팔지 않고 은퇴 생활비를 전액 인출할 수 있는 안전 런웨이(Safety Runway, N년) 산출
     - 강세장/약세장 리밸런싱 행동 원칙 및 연간 예상 배당·이자 인컴 도출
  2) 모달 UI (`src/components/ThreeBucketPlanModal.tsx`):
     - 총 은퇴자산, 목표 생활비, 확정 공적연금 인터랙티브 슬라이더 및 자산배분 프로그레스 바
     - 3대 버킷 상세 카드, 추천 포트폴리오 자산군, 리밸런싱 가이드라인 제공 (Sprint 41, Story S41-2)

- **[FEAT-056] 개인연금(IRP/연금저축) 금융사 갈아타기(계좌이체) 실익 분석기**:
  1) 계산 엔진 (`src/services/pensionTransferCalculator.ts`):
     - 세금 불이익(기타소득세 16.5% 해지세) 0원 및 기존 세액공제·가입기간 100% 승계하는 '연금계좌 계약이전 제도' 기반
     - 기존 금융사(은행 신탁, 보험사 연금보험 연 1.5~2.5%) vs 증권사 포트폴리오(ETF/TDF 연 5~7%) 복리 격차 역산
     - 은퇴 시점 만기 자산 격차, 20년 월 수령액 증가분, 누적 수수료 절감액, 연도별 복리 성장 궤적 산출
  2) 모달 UI (`src/components/PensionTransferBenefitModal.tsx`):
     - Recharts 복리 격차 라인 차트, 비대면 3분 원스톱 계좌이체 3단계 신청 가이드, 이전 전 확인 체크리스트(보험 해약환급금 확인 등) 탑재 (Sprint 41, Story S41-3)

- **[FEAT-057] 3대 킬러 기능 전사 생태계(온보딩/랜딩/AI 어드바이저) 유기적 통합**:
  1) 온보딩 마법사 단계별 인라인 배너 (`src/app/onboarding/page.tsx`):
     - Step 2(퇴직연금): '⚖️ DB vs DC 전환 골든타임 & 임금피크제 계산기' 바로가기 배너
     - Step 3(개인연금): '🔄 연 1~2%대 은행·보험사 연금, 증권사 갈아타기 실익 분석' 바로가기 배너
     - Step 4(최종 확인): '🪣 은퇴 후 하락장 방패! 3-Bucket 현금 버퍼 플래너' 바로가기 배너
  2) 메인 랜딩 페이지 히어로 솔루션 그리드 (`src/app/page.tsx`):
     - 히어로 섹션 바로 아래에 "🔥 3대 실전 연금 최적화 솔루션" 프리뷰 카드 3종 및 원클릭 모달 연동
  3) AI 진단 종합 리포트 및 AI Advisor 통합 (`src/app/dashboard/ai-advisor/page.tsx`, `src/services/reportNarrative.ts`, `src/app/api/ai/advisor/route.ts`):
     - 섹션 10 툴킷 카드 배지 및 클릭 시 3대 모달 즉시 호출 연동
     - Gemini 3.8 Flash 시스템 프롬프트 및 fallbackNarrative에 3대 도구 매핑 및 처방 narrative 강화 (Sprint 41, Story S41-4/S41-5)

- **[FEAT-058] 은퇴 생애 D-Day 로드맵 & 실행 체크리스트**:
  1) 계산 서비스 (`src/services/retirementRoadmapService.ts`): 현재 나이부터 80세 초고령기까지 연령대별 법정 절세/인출 D-Day 마일스톤 생성
  2) 인터랙티브 모달 (`src/components/RetirementRoadmapModal.tsx`): 타임라인 네비게이션, localStorage 영구 저장 체크리스트, 연계 도구 바로가기 스마트 링크 지원 (Sprint 42, Story S42-1)

- **[FEAT-059] 복수 은퇴 시나리오 비교함 (A vs B vs C Side-by-Side)**:
  1) 시나리오 엔진 (`src/services/scenarioComparisonService.ts`): A안(기준 플랜) vs B안(55세 조기 은퇴) vs C안(65세 완주 & 연기연금) 월 수령액·고갈나이·생애총액·안전런웨이 연산
  2) 비교 모달 (`src/components/ScenarioComparisonModal.tsx`): 3열 Side-by-Side 카드 및 원클릭 대시보드 변수 즉시 적용 (Sprint 42, Story S42-2)

- **[FEAT-060] 2026 절세 계좌 4총사(ISA/연금저축/IRP/일반계좌) 자산배분 매트릭스**:
  1) 세제 룰 매트릭스 (`src/services/accountTaxMatrixService.ts`): 금융투자소득세 폐지 및 2026 세법 개정 기준 4계좌 세제 혜택 및 자산군(미국배당/해외지수/채권/국내주식)별 세후 실질 수익률 역산
  2) 매트릭스 모달 (`src/components/AccountTaxMatrixModal.tsx`): 자산군별 최적 추천 계좌 패널 및 4계좌 가로 비교표 제공 (Sprint 42, Story S42-3)

- **[FEAT-061] 스마트 PWA 홈 화면 추가 지원**:
  1) 모바일 바텀 네비: Vanilla CSS 환경과의 클래스 충돌 및 데스크톱 날것 텍스트 노출 문제로 제거 및 헤더/사이드바 네비게이션으로 일원화
  2) PWA 설치 지원: PWA 매니페스트 및 서비스워커 기반 오프라인 캐싱 및 모바일 독립형(standalone) 실행 지원

- **[FEAT-062] 실전 은퇴 가계부 & 연금 인출 트래커**:
  1) 계산 엔진 (`src/services/cashflowTrackerService.ts`): 은퇴 후 4대 필수 지출(주거/식비/의료/생활) 및 4대 수입(공적/사적/금융/기타) 모델링, 목표 생활비 대비 괴리율(Gap) 및 수지차 연산, 비연금 자산 소진 런웨이(Runway) 및 재무 건전성 점수(100점 만점), 12개월 월별 추이 로컬스토리지 저장
  2) 모달 UI (`src/components/CashflowTrackerModal.tsx`): 진단 KPI 카드, 지출/수입 상세 내역 입력 탭, 12개월 Recharts 영역 차트 및 맞춤형 재무 처방 가이드 탑재 (Sprint 43, Story S43-1)

- **[FEAT-063] 1:1 대화형 AI 인터랙티브 은퇴 어드바이저**:
  1) 백엔드 & 컨텍스트 엔진 (`src/app/api/ai/interactive-advisor/route.ts`, `src/services/interactiveAdvisorService.ts`): 사용자 맞춤형 은퇴 나이/연금/자산 컨텍스트 주입, Gemini API 및 규칙 기반 지능형 fallback, 전문 시뮬레이터(DB/DC, 3-Bucket, 계좌이전, 조기/연기 손익분기 등) 매핑
  2) 모달 UI (`src/components/InteractiveChatAdvisorModal.tsx`): 실시간 1:1 대화형 인터페이스, 5대 대표 고민 추천 질문 칩, 연계 시뮬레이터 원클릭 바로가기 버튼 탑재 (Sprint 43, Story S43-2)

- **[FEAT-064] 금융감독원 통합연금포털 엑셀(XLSX/CSV) 데이터 업로드 파서**:
  1) 파서 엔진 (`src/services/fssExcelParser.ts`): 금감원 엑셀/CSV 데이터에서 국민연금, 퇴직연금, 개인연금 계약 정보, 납입원금, 예상수령액 및 개시나이 자동 추출
  2) 온보딩 연동 (`src/components/FssUploadPanel.tsx`, `src/app/onboarding/page.tsx`): PDF 외 CSV/Excel 확장자 수용 안내 및 파싱 데이터 스토어 즉시 적용 (Sprint 43, Story S43-3)

- **[FEAT-065] 번들 사이즈 최적화(코드 분할) & PWA 오프라인 캐싱 강화**:
  1) 번들 분할 (`src/components/DashboardModalManager.tsx`): 18개 전문 모달 전체를 `next/dynamic` (`ssr: false`) 분할 로딩으로 전환하여 초기 페이지 번들 용량 대폭 경감
  2) PWA 오프라인 캐싱 (`public/sw.js`, `src/app/manifest.ts`, `src/components/PwaInstallBanner.tsx`): 서비스 워커 등록, 정적 자산 프리캐싱 및 오프라인 네트워크 복원력 확보 (Sprint 43, Story S43-4)

- **[FEAT-066] 은퇴 세금 & 건강보험료 모의 고지서 통합 A4 명세서**:
  1) 계산 서비스 (`src/services/taxAndHealthStatementService.ts`): 소득세법(공적연금 간이세율, 사적연금 1500만 이하 3.3~5.5% vs 초과 16.5% 분리과세, 금융소득세)과 국민건강보험법(재산과표 1억 공제 후 1~60등급, 공적연금 50% 인정, 금융소득 1000만 초과 전액) 결합 연산
  2) 모달 UI (`src/components/TaxAndHealthStatementModal.tsx`): 국세청/건보공단 스타일 모의 고지서 양식, 실수령액(Net) 산출, 피부양자 자격 유지 여부, A4 표준 인쇄(window.print) 지원 (Sprint 44, Story S44-1)

- **[FEAT-067] 월별 배당 인컴 캘린더 & 연금 인출 스케줄러**:
  1) 스케줄링 서비스 (`src/services/dividendCalendarService.ts`): 1월~12월 월배당/격주배당 ETF 분배금 입금일(15일/28일), 국민연금 입금일(25일), 생활비 인출일(1일) 매핑 및 월별 수지차(잉여/적자) 연산
  2) 모달 UI (`src/components/DividendCalendarModal.tsx`): 1월~12월 탭 및 일자별 캐시플로우 타임라인, 격주 분배 포트폴리오 토글, 현금 유동성 방어 가이드 탑재 (Sprint 44, Story S44-2)

- **[FEAT-068] 은퇴 시뮬레이션 부부·가족 공유 스냅샷 (Shareable URL)**:
  1) 인코딩/디코딩 서비스 (`src/services/shareSnapshotService.ts`): 나이, 목표생활비, 3층 연금 및 부동산 자산 파라미터를 URL-safe Base64로 압축 인코딩 및 카카오톡 요약문 생성
  2) 모달 UI & 라우트 (`src/components/ShareSnapshotModal.tsx`, `src/app/dashboard/page.tsx`): 단축 링크 원클릭 복사, URL `?snapshot=` 감지 시 브라우저 자동 스토어 복원(Hydration) 지원 (Sprint 44, Story S44-3)

- **[FEAT-069] 3중 복합 위기 스트레스 테스트 매트릭스 2.0**:
  1) 위기 시뮬레이션 엔진 (`src/services/stressTestEngine.ts`): 고물가 4.5% + 국민연금 68세 순연 + 시장 -30% 폭락 3대 위기별 자산 고갈 나이, 런웨이 단축 연수, 생애 총 부족액 및 내구성 A~D등급 판정
  2) 모달 UI (`src/components/StressTestModal.tsx`): 5대 시나리오 비교 매트릭스 테이블 및 3대 긴급 방어 처방전(생활비 긴급 축소, 주택연금 조기 결합, 3-Bucket 현금 버퍼) 탑재 (Sprint 44, Story S44-4)

- **[FEAT-070] AI 포트폴리오 종합 진단 리포트 2.0 고도화 & 4대 신규 도구 심층 연계**:
  1) 진단 엔진 & 프롬프트 (`src/services/reportNarrative.ts`, `src/app/api/ai/advisor/route.ts`): 4대 신규 도구(`TAX_HEALTH_STATEMENT`, `DIVIDEND_CALENDAR`, `STRESS_TEST`, `SHARE_SNAPSHOT`) 메타데이터, 우선순위 배지, 프롬프트 지침 추가
  2) 리포트 UI & 모달 렌더링 (`src/components/DiagnosisReport.tsx`, `src/app/dashboard/ai-advisor/page.tsx`): Section 10 툴킷 카드 배지 판정 로직 반영 및 4대 신규 모달 실시간 호출 연동 (Sprint 45, Story S45-1)

- **[FEAT-071] 국민연금 납부이력 기반 추납 vs 반납 실익 역산기**:
  1) 역산 엔진 (`src/services/npsRecoveryCalculator.ts`): 미납 1~119개월 추납 총비용, 월 수령 증가액, 원금 회수 나이(골든크로스), 1998년 이전 70% 소득대체율 반납 실익 비교 및 IRR 연산
  2) 모달 UI (`src/components/NpsRecoveryModal.tsx`): 인터랙티브 슬라이더, Recharts 골든크로스 곡선 차트, 비교표 및 공단 신청 가이드 탑재 (Sprint 45, Story S45-2)

- **[FEAT-072] 은퇴 자산 포트폴리오 리밸런싱 주문 가이드**:
  1) 리밸런싱 엔진 (`src/services/rebalancingOrderService.ts`): 현재 보유액 vs 목표 비중 괴리율 분석, 매수/매도 필요 금액 및 주문 주수 산출, IRP 30% 안전자산 규제 준수 체크
  2) 모달 UI (`src/components/RebalancingOrderModal.tsx`): 증권사 MTS 즉시 주문표(Order Slip) 테이블 및 원클릭 주문 텍스트 복사 (Sprint 45, Story S45-3)

- **[FEAT-074] 4단계 전문 에이전트 체계 (Agent Definition) 및 개발 원칙 동기화**:
  1) 4단계 에이전트 명세서 (`Agent Definition.md`): Agent 1(연금 데이터 수집·정제) -> Agent 2(다층 연금 수리·세제 엔진) -> Agent 3(은퇴 전략 및 리스크 진단) -> Agent 4(AI 종합 진단 및 처방) 역할 및 입출력 인터페이스 정립
  2) 개발 효율성 최적화 지침: 물리적 마이크로서비스 통신 오버헤드 방지(단일 런타임 내 계층 분리), 결정론적 수리 엔진과 LLM 서술의 명확한 역할 분리, Zustand 단일 진실 공급원 유지
  3) 개발 원칙 동기화 (`GEMINI.md`, `AGENTS.md`): Context Caching on Large-Scale Tasks 원칙 탑재, 한국어 문장 콜론(:) 종결 금지, 새 파일 1줄 한국어 주석, 시맨틱 커밋, 에러 추측 금지 규칙 적용

- **[FEAT-075] 사이드바 기능 분류 재배치 및 Agent 1~4 계층 파사드 아키텍처**:
  1) 사이드바 재배치 (`src/components/DashboardSidebar.tsx`): 16+개 설정과 도구를 5대 핵심 목적별 그룹(`🚀 빠른 실행`, `📋 기본 설정 & 생애 지출 곡선`, `🏛️ 공·사적 연금 최적화`, `🛡️ 절세 & 건강보험료 수비`, `📈 인출 전략 & 자산 런웨이 방어`, `🔮 시나리오 비교 & AI 종합 진단`)으로 구조화
  2) Agent 1~4 서비스 파사드 (`src/services/agents/`): Agent 1(데이터 수집 및 PII 정제), Agent 2(결정론적 수리/세무 엔진), Agent 3(인출 전략/리스크 진단), Agent 4(AI 종합 처방) 파사드 단일 인터페이스 구축 (Sprint 46)

- **[FEAT-076] 5대 UI/UX 기준 기반 대시보드 리팩토링 및 디자인 스킬 파이프라인**:
  1) 5대 디자인 스킬 시스템 구축: `frontend-design`, `ui-ux-pro-max`, `hallmark`, `emil-design-eng`, `web-design-guidelines` 스킬 정의 및 `AGENTS.md` / `GEMINI.md` 파이프라인 규격화
  2) Hallmark & Frontend Design 적용: 대시보드 보라색 네온 글로우 구체 제거, 마법 구슬 배너를 단정한 금융 전문 카드 서피스로 개편, 사이드바 도구 버튼을 핵심 우선 노출 + 심화 접이식 아코디언으로 계층화하여 인지 부하 대폭 절감
  3) Web Design Guidelines & Emil Design Engineering 적용: 버튼 최소 높이 38~40px 터치 타깃 확보, 전략 비교 카드 키보드 접근성(`role="button"`, `tabIndex={0}`, `onKeyDown`) 및 고대비 `:focus-visible` 링 완비, 버튼 및 카드 물리적 스프링 클릭 피드백(`active:scale(0.98)`) 및 `prefers-reduced-motion` 모션 접근성 탑재 (Sprint 48)

- **[FEAT-077] 모바일 바텀시트, AI 어드바이저 및 온보딩 5대 UI/UX 전면 리뉴얼 (후보 A/B/C 통합)**:
  1) 모바일 반응형 & 바텀시트 (후보 A): 모바일 뷰포트(390px~430px) 가로 오버플로우 방지 및 모달을 화면 하단 앵커링 바텀시트(`rounded-t-2xl`, 상단 드래그 인디케이터 핸들 바, 닫기 버튼 44px 터치 타깃)로 전환.
  2) AI 어드바이저 리뉴얼 (후보 B): `bgGlow` 제거, 페르소나 버튼 및 헤더 버튼 시맨틱 토큰화, `🔮` 클리셰 제거 및 44px 터치 높이 확보.
  3) 온보딩 위저드 전환율 극대화 (후보 C): `bgGlow` 제거, 이전/다음/최종 CTA 버튼 터치 타깃 44px 확보, '자산관리 바로가기'(보조) vs 'AI 종합 진단 받기 ⚡'(주요) 간 선명한 시각적 위계 확립 (Sprint 49)

- **[FEAT-078] 국민연금 추납 vs 반납 실익 역산기 본인/배우자 탭 분리 및 다각도 실익 분석 고도화**:
  1) 본인/배우자/부부 합산 3개 탭 분리 UI (`src/components/NpsRecoveryModal.tsx`): 본인 및 배우자 각각의 독립적인 추납 개월수, 기준소득, 반납 원금·경과연수·소득대체율 파라미터 조절 및 실시간 연산 지원.
  2) 추납 및 반납 개별 선택 토글(기본값: 둘 다 선택): 추납만 선택, 반납만 선택, 둘 다 선택, 미선택의 4가지 조합을 자유롭게 시뮬레이션하고 비활성화 시 슬라이더 자동 딤 처리 지원.
  3) 원금 회수 마일스톤 게이지: 50% 반액 회수, 100% 원금 전액 회수(골든크로스), 200% 더블 달성, 300% 트리플 달성 나이 및 개시 후 소요 기간 시각화.
  4) 기대수명 구간별(75세~95세) 납부금액 대비 수령 분포: 누적 수령액, 원금 차감 순이익, 회수율(%) 상세 테이블 및 60% 유족연금 종신 승계 안전 가이드 제공.
- **[FEAT-079] 온보딩 테마 동기화, Containing Block 팝업 왜곡 해결 및 다크 모드 4종 팁 팝업 시맨틱 토큰 개선**:
  1) 국민연금 가입내역조회 업로드 카드 테마 일원화 (`src/components/NpsHistoryUpload.tsx`): 점선 테두리 제거 후 금융감독원 안내 패널과 동일한 인디고 실선 테두리(`1px solid rgba(99, 102, 241, 0.2)`), 좌측 4px 포인트 바(`borderLeft: 4px solid #6366f1`), 알약형 NPS 포털 링크 뱃지 버튼 및 일관된 폰트 크기/굵기 적용.
  2) CSS Containing Block 좌표계 왜곡 해결 (`NpsBoostRoadmapModal.tsx`, `NpsRecoveryModal.tsx`): 온보딩 패널 수직 슬라이딩 트랜지션(`transform: translateY`) 하위에서 모달이 화면 우측 하단에 갇혀 찌그러지던 브라우저 W3C 스펙 버그를 React `createPortal(modalContent, document.body)`를 통해 브라우저 최상단으로 격리 및 정중앙 팝업 보장.
  3) 다크 모드 4종 팁 팝업 폰트 시맨틱 토큰화 (`TaxAndHealthStatementModal.tsx`, `DividendCalendarModal.tsx`, `StressTestModal.tsx`, `ShareSnapshotModal.tsx`): 라이트 모드 고정 폴백 색상(#0f172a, #334155 등)을 `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`로 전면 교체하여 다크 모드에서도 선명한 WCAG AA 대비율 확보 및 `createPortal`과 하단 [확인 및 닫기] 버튼 일괄 연동 완료 (Sprint 51)
- **[FEAT-080] 대시보드 사이드바 팁 버튼 4대 분류별 테마 및 옅은색→짙은색 순차 컬러 스케일 적용**:
  1) 4대 분류별 고유 테마 색상 정립: `공·사적 연금 최적화`(골드/오렌지), `절세 & 건강보험료 수비`(민트/에메랄드), `인출 전략 & 자산 런웨이 방어`(스카이/사이언 블루), `시나리오 비교 & 종합 진단`(라벤더/바이올렛 퍼플).
  2) 동일 분류 내 순차 컬러 스케일: 위에서 아래로 갈수록 박스 배경(0.05→0.24), 테두리(0.22→0.78), 텍스트 채도/농도 및 폰트 굵기(600→750)가 옅은 색에서 점점 짙은 색으로 체계적으로 점증하도록 설계.
  3) 다크 테마 WCAG AA 가독성 보장: 어두운 배경 위에서 폰트가 묻히지 않도록 정밀 조율된 HSL/RGB 틴트를 적용하여 시각적 인지 계층 구조와 조작 심미성을 동시 확보 (Sprint 52)









