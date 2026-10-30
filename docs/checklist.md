# UI/UX 5대 기준 대시보드 리팩토링 체크리스트

대시보드 화면 및 핵심 경로를 5대 UI/UX 기준(hallmark, frontend-design, web-design-guidelines, ui-ux-pro-max, emil-design-eng)에 맞춰 개선하는 실행 계획입니다.

## 1. Hallmark (AI 양산형 클리셰 제거)
- [x] `src/app/dashboard/page.tsx` 내 배경 보라색 네온 글로우 구체(`bgGlow1`, `bgGlow2`) 제거 완료.
- [x] `🔮` 이모지 및 사이버틱 그라디언트 배너를 차분하고 신뢰도 높은 금융 전문 헤더로 리뉴얼 완료.
- [x] 과도한 중첩 글래스모피즘(`backdropFilter`) 속성을 절제된 서피스 스타일로 정돈 완료.
- [x] [후보 B] `src/app/dashboard/ai-advisor/page.tsx` 내 `bgGlow1`, `bgGlow2` 및 마법 구슬 배너/보라색 그라디언트 버튼 제거 완료.
- [x] [후보 C] `src/app/onboarding/page.tsx` 내 `bgGlow1`, `bgGlow2` 및 하드코딩 핑크/보라 그라디언트 제거 완료.

## 2. Frontend Design (정보 계층 구조 & 사이드바 정돈)
- [x] 좌측 사이드바(`DashboardSidebar.tsx`)의 27개 모달 버튼을 [핵심 진단 4종] 및 [심화 최적화 툴] 아코디언/탭으로 구조화 완료.
- [x] 메인 대시보드 진입 시 1순위 핵심 지표(세후 총 수령액 & 생애 현금 흐름 차트)로 시선이 집중되도록 상단 보조 액션 정돈 완료.
- [x] [후보 B] AI 어드바이저 화면 헤더 액션(페르소나 체험, PDF 다운로드, 진단 실행)의 시각적 위계 명확화 완료.
- [x] [후보 C] 온보딩 위저드 마지막 단계의 복합 CTA('자산관리 바로가기', 'AI 종합 진단 받기') 시각적 대비 및 인지 흐름 개선 완료.

## 3. Web Design Guidelines (접근성 & 사용성)
- [x] 버튼 및 인터랙티브 컨트롤의 터치 타깃 최소 높이(최소 38~40px) 및 클릭 여백 확보 완료.
- [x] 모든 버튼, 탭, 카드 조작계에 고대비 `:focus-visible` 아웃라인 스타일 보장 완료.
- [x] 초소형 텍스트(`0.75rem` 이하)의 라이트 모드 대비비(WCAG AA 4.5:1 이상) 보강 완료.
- [x] [후보 A] 모바일 뷰포트(390px~430px) 가로 오버플로우 방지 및 모달의 바텀시트(Bottom Sheet) 모바일 뷰포트 최적화 완료.
- [x] [후보 A] 모달 닫기 버튼 및 주요 탭의 모바일 최소 터치 타깃(44px) 보장 완료.
- [x] [후보 B/C] AI 어드바이저 및 온보딩 내 인풋/버튼/탭 터치 타깃 44px 이상 확보 완료.

## 4. UI-UX Pro Max (디자인 시스템 & 시맨틱 토큰화)
- [x] 인라인 `rgba(...)` 하드코딩 색상을 `var(--surface-accent)`, `var(--badge-success-bg)` 등 시맨틱 CSS 변수로 전환 완료.
- [x] 임의의 폰트 크기를 표준 4단계 스케일(Display/Heading/Body/Caption)로 규격화 완료.
- [x] [후보 B] AI 어드바이저 헤더의 페르소나 버튼 인라인 그라디언트 하드코딩을 시맨틱 토큰화 완료.
- [x] [후보 C] 온보딩 상단 네비게이션 및 CTA 버튼의 인라인 색상을 전역 시맨틱 토큰으로 통일 완료.

## 5. Emil Design Engineering (스프링 모션 & 쫀득한 피드백)
- [x] 버튼 및 전략 선택 카드에 물리적 반응(`active:scale-[0.98]`, 베지어 커브 트랜지션) 적용 완료.
- [x] 사이드바 접힘/펼침 트랜지션에 부드러운 너비 전환 및 부드러운 상태 안착 모션 구현 완료.
- [x] `prefers-reduced-motion` 환경 대응 유지 완료.
- [x] [후보 A] 모바일 바텀시트 모달 등장 시 자연스러운 스프링 모션 및 상단 핸들 바 도입 완료.
- [x] [후보 B/C] AI 어드바이저 및 온보딩 주요 인터랙티브 버튼에 촉각적 스프링 스케일 피드백 적용 완료.

## Sprint 50: 국민연금 추납 vs 반납 실익 역산기 본인/배우자 탭 분리 및 다각도 실익 계산기 고도화
- [x] `src/services/npsRecoveryCalculator.ts` 계산 엔진 고도화.
  - [x] 반납 원금·경과연수·복원기간 가변 연산 및 결합(추납+반납 동시 진행) 시나리오 추가.
  - [x] 회수 마일스톤(50% 회수, 100% 원금 회수 골든크로스, 200% 더블 달성) 산출 로직 추가.
  - [x] 기대수명별(75세, 80세, 85세, 90세, 95세) 누적 수령액 및 원금 대비 회수율 분포 산출.
  - [x] 부부 합산 가구 시너지(가구 총 납부액, 가구 월 연금 증액, 합산 골든크로스) 연산 로직 구현.
- [x] `src/components/NpsRecoveryModal.tsx` 컴포넌트 5대 UI/UX 전면 리뉴얼.
  - [x] 본인(👤) / 배우자(👥) / 부부 합산(📊) 3개 탭 전환 UI 구현.
  - [x] Zustand store(`usePensionStore`)의 본인/배우자 국민연금 및 추납/반납 설정값 자동 로드 및 연동.
  - [x] 반납 상세 컨트롤(원금 슬라이더, 경과 년수 슬라이더, 소득대체율 선택) 추가.
  - [x] 4대 핵심 지표 카드 및 원금 회수 마일스톤 프로그레스 바 UI 렌더링.
  - [x] 기대수명별 납부금액 대비 수령 분포 테이블 및 다각도 실익 분석 섹션 탑재.
  - [x] Recharts 누적 곡선 차트에 본인/배우자 및 결합 시나리오 동적 반영.
- [x] 대시보드 및 모달 매니저 연동 점검.
  - [x] `DashboardModalManager.tsx`에서 배우자 정보 전달 및 스토어 데이터 동기화 확인.
  - [x] `npm run build` 빌드 검증 및 렌더링 에러 0건 확인.
  - [x] 브라우저 서브에이전트 또는 화면 렌더링 검증 수행.


## Sprint 50-2: 추납 및 반납 개별 선택 토글 및 부부 합산 4대 옵션 다각도 시뮬레이션
- [x] `src/services/npsRecoveryCalculator.ts` 추납 선택 플래그(`hasAdditionalPayment`) 추가 및 4개 조합(추납 단독, 반납 단독, 둘 다, 미선택) 엔진 지원.
- [x] `src/components/NpsRecoveryModal.tsx` 개별 탭(본인/배우자) 추납 ON/OFF 체크박스 및 디폴트 둘 다 선택 연동.
- [x] `src/components/NpsRecoveryModal.tsx` 부부 합산 시너지 탭 내 본인 추납/반납, 배우자 추납/반납 4대 옵션 선택기 패널 신설.
- [x] 옵션 변경 시 가구 총비용, 월 증액, 골든크로스, 순수익 및 Recharts 차트 실시간 갱신 검증.
- [x] `npm run build` 및 브라우저 서브에이전트 화면 렌더링 검증.

## Sprint 54: `redesign-skill` 기반 전사 디자인 정밀 진단 및 사용자 친화적 UI/UX 고도화
- [x] 1. 타이포그래피 고도화 (Typography)
  - [x] `src/app/layout.tsx` 내 기본 Inter 폰트를 `next/font/google`의 최신 프리미엄 폰트 `Geist` 및 `Geist_Mono`로 전환.
  - [x] 울트라 볼드(800) 제거 및 세미볼드(600)/볼드(700) 캡핑.
  - [x] 재무·수치 데이터 및 표에 `font-variant-numeric: tabular-nums` 전면 적용.
  - [x] 헤딩에 `text-wrap: balance`, 본문/설명에 `text-wrap: pretty` 및 `word-break: keep-all` 적용.
- [x] 2. 컬러 및 서피스 정돈 (Color & Surfaces)
  - [x] 랜딩 페이지 인트로 영상 컨테이너의 하드코딩 다크(`#0d0e1c`) 스타일을 라이트/다크 시맨틱 서피스로 통일.
  - [x] 중첩 반경 공식(`inner = outer - gap`, 20px - 8px = 12px) 정밀 적용.
- [x] 3. 인터랙티브 상태 및 키보드 접근성 (Interactive States & a11y)
  - [x] 클릭 가능한 버튼, 탭, 카드 전체에 `:active { transform: scale(0.98); }` 촉각 피드백 주입.
  - [x] 전체 폼 인풋 및 인터랙티브 요소에 WCAG AA 기준 `:focus-visible` 고대비 포커스 링 통일.
  - [x] 스킵 네비게이션(`Skip to Content`) 링크를 `layout.tsx`에 신설하여 키보드 탐색성 완비.
- [x] 4. Step 2 모달 내부 컬러·서피스 정돈 및 UI/UX 고도화
  - [x] 모달 헤더 인라인 AI 그라디언트 제거 및 시맨틱 플랫 서피스(`var(--modal-header-bg)`) 통일.
  - [x] 라이트 모드 오염 `rgba(0, 0, 0, 0.15)` 및 다크 모드 `rgba(255, 255, 255, 0.04)` 서피스를 솔리드 시맨틱 토큰(`--modal-surface-card`, `--modal-subbox-bg`)으로 전환.
  - [x] 모달 닫기 버튼 44px 터치 타깃 및 통일된 호버/포커스 링 클래스(`modal-close-button`) 적용.
  - [x] 중첩 카드 반경(`inner = outer - gap`) 수학적 비례(20px ➔ 12px ➔ 8px) 적용.
- [x] 5. 검증 및 배포
  - [x] `npm run build` 프로덕션 빌드 무결성 검증 (0 errors, 22/22 정적 페이지).
  - [x] 로컬 서버 구동 및 HTTP 200 / DOM 렌더링 검증 완료.



