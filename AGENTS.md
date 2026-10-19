<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PensionLab Core Agent Rules

## 1. 한국어 문장에 콜론(:) 종결 금지
- 한국어 문장 종결부는 콜론(`:`)이 아닌 마침표(`.`), 물음표(`?`), 느낌표(`!`) 중 하나여야 한다.
- 다음 줄이 목록이나 예시여도 문장을 `:`로 끝내지 않는다. (단, 코드 내부, 라벨, 키-값 쌍의 콜론은 허용)

## 2. 새 소스 파일 첫 줄에 한국어 헤더 주석
- 새 파일을 생성할 때 첫 줄(지시자 `'use client'`, `'use server'` 바로 아래)에 역할 한 줄 한국어 주석을 필수로 작성한다.
  - TypeScript/TSX: `// 3-Bucket 현금 버퍼 인출 플랜을 계산하고 모달 UI를 렌더링하는 컴포넌트`
  - SQL: `-- 다층 연금 시뮬레이션 이력 저장을 위한 마이그레이션 스키마`
- 설정 파일(`*.config.ts`, `package.json` 등)은 제외한다.

## 3. 플랜 + 체크리스트 + 컨텍스트 노트
- 중대 기능 구현이나 아키텍처 개편 시 작업 시작 전 목표 플랜, 구체적 체크리스트(`checklist.md`), 의사결정 기록(`context-notes.md`) 산출물을 정의하여 세션 간 연속성을 유지한다.

## 4. 완료 선언 전에 테스트 및 브라우저 화면 렌더링 검증 실행
- 코드를 수정했으면 "완료"라고 선언하기 전에 `npm run build` 또는 테스트를 선제적으로 실행한다.
- UI 변경 시 브라우저 서브에이전트나 렌더링 검증을 통해 라이트/다크모드 색상 대비 및 카드 레이아웃의 결함 여부를 사전에 확인한다.

## 5. 시맨틱 커밋
- 하나의 논리적 변경 단위가 완료되면 지체 없이 커밋한다. "이 커밋을 한 문장으로 명확히 설명할 수 있는가?"를 기준으로 삼는다.

## 6. 에러를 읽어라, 추측하지 마라
- 오류 발생 시 기억이나 어설픈 추측으로 수정을 시도하지 않고, 실제 터미널 출력/브라우저 콘솔의 전체 스택 트레이스를 정밀 확인한 후 근본 원인을 교정한다.
