# UI/UX 5대 기준 대시보드 리팩토링 체크리스트

대시보드 화면을 5대 UI/UX 기준(hallmark, frontend-design, web-design-guidelines, ui-ux-pro-max, emil-design-eng)에 맞춰 개선하는 실행 계획입니다.

## 1. Hallmark (AI 양산형 클리셰 제거)
- [x] `src/app/dashboard/page.tsx` 내 배경 보라색 네온 글로우 구체(`bgGlow1`, `bgGlow2`) 제거.
- [x] `🔮` 이모지 및 사이버틱 그라디언트 배너를 차분하고 신뢰도 높은 금융 전문 헤더로 리뉴얼.
- [x] 과도한 중첩 글래스모피즘(`backdropFilter`) 속성을 절제된 서피스 스타일로 정돈.

## 2. Frontend Design (정보 계층 구조 & 사이드바 정돈)
- [x] 좌측 사이드바(`DashboardSidebar.tsx`)의 27개 모달 버튼을 [핵심 진단 4종] 및 [심화 최적화 툴] 아코디언/탭으로 구조화.
- [x] 메인 대시보드 진입 시 1순위 핵심 지표(세후 총 수령액 & 생애 현금 흐름 차트)로 시선이 집중되도록 상단 보조 액션 정돈.

## 3. Web Design Guidelines (접근성 & 사용성)
- [x] 버튼 및 인터랙티브 컨트롤의 터치 타깃 최소 높이(최소 38~40px) 및 클릭 여백 확보.
- [x] 모든 버튼, 탭, 카드 조작계에 고대비 `:focus-visible` 아웃라인 스타일 보장.
- [x] 초소형 텍스트(`0.75rem` 이하)의 라이트 모드 대비비(WCAG AA 4.5:1 이상) 보강.

## 4. UI-UX Pro Max (디자인 시스템 & 시맨틱 토큰화)
- [x] 인라인 `rgba(...)` 하드코딩 색상을 `var(--surface-accent)`, `var(--badge-success-bg)` 등 시맨틱 CSS 변수로 전환.
- [x] 임의의 폰트 크기를 표준 4단계 스케일(Display/Heading/Body/Caption)로 규격화.

## 5. Emil Design Engineering (스프링 모션 & 쫀득한 피드백)
- [x] 버튼 및 전략 선택 카드에 물리적 반응(`active:scale-[0.98]`, 베지어 커브 트랜지션) 적용.
- [x] 사이드바 접힘/펼침 트랜지션에 부드러운 너비 전환 및 부드러운 상태 안착 모션 구현.
- [x] `prefers-reduced-motion` 환경 대응 유지.
