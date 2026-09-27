# 부부 통합 연금 진단·시뮬레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 진단하기(온보딩) 입력을 본인·배우자 기준으로 재구성하고(기본정보 2열, 국민·퇴직·개인연금 본인/배우자 단계 분리, 기초연금 2인 판정), 반환일시금 반납과 국민연금 가입내역조회 PDF 자동 입력을 추가한 뒤, 분석 후 대시보드에서 부부 합산 국민·기초·퇴직·개인연금을 연도별로 통합 시뮬레이션한다(먼저 사망 시 유족연금 중복급여 조정 포함).

**Architecture:** 스토어에 `spouse` 슬라이스(배우자 국민·추납·반납·퇴직·개인연금·연금보험)와 본인 `returnRepayment`를 추가하고, 기존 액션에 선택 인자 `who`("SELF"|"SPOUSE", 생략 시 본인)를 붙여 기존 호출부가 그대로 동작하게 한다. 계산은 순수 함수 모듈로 나눈다: 반납(`returnRepaymentCalculator`), 기초연금(`basicPensionCalculator`), 가입내역 PDF 해석(`npsHistoryParser`, 규칙 기반 — AI·API 키 불필요), 부부 엔진(`coupleSimulation` — 사람별로 기존 `runPensionSimulation`을 돌린 뒤 연도별로 합치고 기초연금·제56조 조정을 얹는다). 기존 S0~S4 인출·세금·건보 엔진은 본인 기준 그대로 두고 대시보드에 「부부 통합 연금 시뮬레이션」 섹션을 새로 붙인다.

**Tech Stack:** Next.js 16.2.7 App Router(`"use client"`), React 19, Zustand 5 persist, Recharts 3, pdfjs-dist, TypeScript 5. 검증은 `scratch/*.ts`를 `npx tsx`로 실행(`node:assert`).

**Spec:** 이 문서 §0. 근거: 사용자 제공 Gemini 대화 2건(기초연금 부부 기준 / 반납·추납·부부연금 대시보드), 사용자 제공 국민연금공단 가입내역조회 화면 출력 PDF 2건(텍스트 형식 확인용, 저장소에 넣지 않음), 국민연금공단 공식 안내(반환일시금 반납 getOHAF0046M0, 유족연금·중복급여 getOHAF0048M0, 추납 getOHAF0047M0), 기초연금 연계감액 안내(2026). 이 계획의 계산 코드·컴포넌트·테스트는 작성 전 별도 사본에서 실행·타입 검사를 마쳤고, 가입내역 파서는 실제 PDF 2건으로도 확인했다.

## Global Constraints

- 금액 단위 **만원**, 기간 **개월**, 년월 `"YYYY-MM"`. 연금액은 **월액**(만원/월), 생애 합계는 만원.
- 법 규정 수치는 `src/config/npsRules.ts`(국민연금)·`src/config/basicPensionRules.ts`(기초연금)에만. 계산기에 규정 숫자 하드코딩 금지.
- 기존 동작 보존: `who`를 생략한 기존 스토어 액션 호출, 기존 S0~S4 엔진, 기존 백업 JSON 불러오기, 기존 검증 스크립트(validateAdditionalPayment, validateWithdrawal)가 그대로 동작해야 한다.
- 결과 화면에는 "추정치 · 공단(1355) 확인" 성격의 고지를 둔다.
- **개인정보:** 실제 가입내역 PDF·추출 텍스트·이름을 저장소에 넣지 않는다(원격 저장소는 공개). 테스트 픽스처는 가상의 값만 쓴다.
- **`npm run build` 금지**(prisma migrate deploy 실행). 타입: `npx tsc --noEmit`(기준 0 오류). 린트: 파일별 `npx eslint <file>` — 기존 파일은 기준 오류 수 이하(onboarding 15, dashboard 14, ai-advisor 9, 나머지 0), 새 파일은 0.
- Prisma/DB·API 라우트는 바꾸거나 추가하지 않는다(배우자 데이터는 스토어·백업 JSON으로만 보존).
- 작업 브랜치 `feat/couple-simulation` (PR 전인 `feat/nps-additional-payment` 위에서 분기). `.serena/project.yml`, `.claude/`는 커밋 금지. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

---

## 0. 요구사항 및 도메인 규칙 (스펙)

### 0.1 사용자 요구사항

| # | 요구 | Task |
|---|---|---|
| R1 | 기본 정보: 본인·배우자 2열로 나이·은퇴예상시점·기대수명 입력, 아래에 자녀 정보 | 5 |
| R2 | 「국민연금 (1층, 본인)」으로 변경 | 5, 6 |
| R3 | 「국민연금 (1층, 배우자)」 추가, 미입력 시 진단 제외 | 5, 6 |
| R4 | 「기초연금 (1층, 본인/배우자)」 2인 기준 입력·판정 (참고자료 1) | 3, 8 |
| R5 | 「퇴직연금 (2층, 본인)」, 「퇴직연금 (2층, 배우자)」, 미입력 시 제외 | 5, 6 |
| R6 | 「개인연금 (3층, 본인)」, 「개인연금 (3층, 배우자)」, 미입력 시 제외 | 5, 6 |
| R7 | 분석하기 후 부부 합산 국민·기초·퇴직·개인연금 통합 시뮬레이션 | 4, 9 |
| R8 | 반환일시금 반납 + 추납 + 부부 시뮬레이션(참고자료 2): 대안 A/B/C/D, 원금 회수 시점, 먼저 사망 시 중복급여 조정 | 2, 4, 6, 9 |
| R9 | 반납금: 공단 고지액 입력 우선, 없으면 연도별 이자율로 추정 (사용자 결정) | 2, 6 |
| R10 | 범위: 부부 통합 뷰 신설, 기존 S0~S4 세금·건보 엔진은 본인 기준 유지 (사용자 결정) | 9 |
| R11 | 국민연금공단 「전자민원 > 조회 > 가입내역조회」 결과 화면을 인쇄한 PDF 업로드 → 반환일시금·추납 대상과 국민연금 예상액 자동 반영. 증명서 발급 PDF는 암호화되어 안내 메시지만 표시 | 7 |

"미입력 시 진단에서 제외": 배우자 국민연금 예상액 0·퇴직/개인연금 항목 없음이면 0으로 합산된다(별도 플래그 없음). 배우자 없음이면 배우자 단계는 숨기고 부부 섹션도 표시하지 않는다.

### 0.2 확인된 제도 규칙 (2026-09)

| 규칙 | 값 | 출처 |
|---|---|---|
| 반납금 | 반환일시금 + 지급월부터 반납 신청월 **전월**까지 이자 | NPS 반환일시금 반납 안내 |
| 반납 이자율 | 연도별 1년 만기 정기예금 이자율(공단 고시 표 1988 10% … 2026 2.2%), 해마다 원금에 가산 | 同 |
| 반납 분할 | 종전 가입기간 1년 미만 3회, 1~5년 12회, 5년 이상 24회 (분할이자 가산) | 同 |
| 가입 시기별 비례상수 | 1988~1998 2.4(70%, A+0.75B), 1999~2007 1.8, 2008 1.5, 2009~2025 매년 −0.015, 2026~ 1.29(43%) | 기본연금액 산식 |
| 유족연금 지급률 | 사망자 가입기간 10년 미만 40%, 10~20년 50%, 20년 이상 60% | NPS 유족연금 안내 |
| 중복급여 조정(제56조) | 유족연금 또는 「본인 노령연금 + 유족연금 30%」 중 선택 | 同 (2016.11.30~) |
| 기초연금 기준연금액 | 월 34.97만원(단독), 부부 모두 수급 시 각 20% 감액 | 참고자료 1 |
| 선정기준액 | 단독 247만원, 부부 395.2만원 (부부 중 1명만 신청해도 부부 기준) | 同 |
| 소득인정액 | 근로소득(1인당 116만원 공제 후 70%) + 기타소득 100%(국민연금 포함) + 재산환산 [(일반재산−지역공제)+(금융재산−2,000만)−부채]×4%/12 + 고급차·회원권 가액 전액 | 同 |
| 지역 기본재산 공제 | 대도시 1억3,500만, 중소도시 8,500만, 농어촌 7,250만 | 同 |
| 국민연금 연계감액 | 국민연금 > 기준연금액 150%이면 max((기준 − ⅔×A급여) + 부가연금액, 기준×250% − 국민연금), 하한 기준의 50% | 연계감액 안내 |
| 소득역전방지 | 소득인정액+기초연금 > 선정기준액이면 초과분 감액, 최저 기준의 10% | 참고자료 1 |
| 직역연금 | 공무원·사학·군인·별정우체국연금 수급권자와 그 배우자 제외 | 同 |
| 적용제외 추납 | 무소득배우자 등 적용제외 기간은 1999-04 이후만 추납 대상 (납부예외는 제한 없음) | NPS 추납 안내 |

### 0.3 가입내역조회 PDF 형식 (실제 출력물 2건으로 확인)

pdfjs 텍스트로 추출하면 다음이 순서대로 나온다(아래 값은 모두 가상의 예시).
- 조회일: `2026년 09월 27일 (10:00) 조회일`
- 총 가입기간: `총 가입기간 월수 308개월 금액 90,000,000원`
- 반환일시금: `반환일시금 총 지급기간 24개월 반환일시금 총 지급액 800,000원` — **지급년월은 없다**
- 반납금·추납: `반납금 납부액 0원 추납보험료 납부액 (개월) 0원 (0)`
- 상세내역 행: `기간 기준소득월액 납부월수 납부금액 미납월수 미납금액 가입자의종류 비고` — 예 `2001-01 ~ 2001-06 1,000,000원 0개월 0원 0개월 0원 사업장 납부예외`, `2016-01 ~ 2020-04 1,000,000원 52개월 4,680,000원 0개월 0원 임의 임의`
  - 반환일시금으로 소멸된 기간도 일반 행으로 나오며 표시가 없다 → 가장 이른 납부 행부터 반환 개월수만큼을 반환 기간으로 본다
  - 행 경계가 겹칠 수 있다(`2001-01 ~ 2001-06`, `2001-06 ~ 2001-12`) → 월 단위로 합집합
  - 조회월 행은 미납 1개월로 나온다(납부기한 전) → 체납으로 보지 않는다
- 페이지 머리·꼬리: `26. 9. 27. 오전 10:00 전자민원 > … 2/4` → 제거. 금액이 `88,800,000 원`처럼 갈라질 수 있다 → 붙인다
- 예상연금: `2033년 01월부터 매월 1,500,000원`, `총 예상가입기간(납부월수) 2000년 01월 ~ 2030년 12월(총360개월 )`, `총 예상납부보험료 120,000,000원`, `A값 3,193,511원 B값 4,500,000원`
- 증명서 발급 PDF는 암호화되어 pdfjs가 `PasswordException`을 던진다

### 0.4 모델 가정 (UI에 "추정" 표기)

1. 반납 복원 기간의 소득은 본인 평균소득(B)과 같다고 본다. 복원 기간 비례상수는 해당 연도 값(1998년 이전 A+0.75B).
2. 반납 분할이자는 신청 연도의 정기예금 이자율 하나로 계산(1년 단위 복리, 추납과 같은 방식).
3. 대안 비교·원금 회수는 현재가치 기준, 부부 엔진은 기존 엔진과 같은 명목 기준(국민연금 개시 후 물가연동).
4. 국민연금 A급여 비율 ≈ A / (A + B).
5. 유족연금은 사망자의 (반납·추납 반영) 예상 연금월액 × 지급률. 배우자 유족연금 50세 미만 지급정지·재혼, 부양가족연금, 사망자 퇴직·개인연금 잔액 상속은 반영하지 않는다.
6. 각자 기대수명까지 생존, 기대수명 다음 해가 사망 해.
7. 기초연금 입력(소득·재산)은 현재가치, 해마다 물가상승률로 올린다.
8. 가입내역 PDF: 가입 기록이 없는 기간은 적용제외(무소득배우자 등)로 보고 1999-04 이후만 공백으로 센다. 반환일시금 수령년월은 반환 기간 다음 달로 추정한다(PDF에 없음). 자동 입력 후 사용자가 확인한다.

### 0.5 참고자료 2 수치와의 차이 (의도적)

참고자료 2의 반납금 "약 350만원"과 대안별 월액(39.1/44.1/59.6만원)은 대화 중 추정치다. 이 계획은 공단 고시 이자율 표로 계산해 같은 입력(1996-03 수령 104.4만원, 1993-10부터 30개월, 2026-10 신청)에서 반납금 **311.04만원**, B 33.5 / C 46.1 / A 56.0만원이 나온다. 공단 고지액(예: 350만원)을 입력하면 그 값이 우선한다.

### 0.6 화면 흐름

```
[사이드바 단계] 0 기본 정보 & 재무 목표 (본인 | 배우자 2열 + 자녀)
               1 국민연금 (1층, 본인)          ─ 탭: NPS 상세 | 금융감독원 PDF | ➕ 추가납부 대상 등록
                                                  (가입내역조회 PDF 업로드 → ①~④ 추납 → ⑤ 반납·대안 A/B/C/D)
               1 국민연금 (1층, 배우자)   *     ─ 같은 화면, 배우자 데이터
               1 기초연금 (1층, 본인/배우자)    ─ 가구 재산 + 본인/배우자 소득 2열 + 판정
               2 퇴직연금 (2층, 본인) / (2층, 배우자) *
               3 개인연금 (3층, 본인) / (3층, 배우자) *
               4 기타 시뮬레이션 설정           ─ 배우자 국민연금 개시 나이 추가
               (* 배우자 있음일 때만)
[대시보드]     기존 KPI → 배지 → 👫 부부 통합 연금 시뮬레이션(배우자 있을 때) → 기존 매개변수·S0~S4 …
```

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `src/store/usePensionStore.ts` | 전체 교체 | 배우자·반납·기초연금 필드, `who` 라우팅, `pensionsOf`, `mergeWithDefaults` |
| `src/config/npsRules.ts` | 끝에 추가 | 정기예금 이자율 표, 시기별 비례상수, 유족연금 지급률, 반납 분할 횟수 |
| `src/config/basicPensionRules.ts` | 생성 | 기초연금 2026 규정 |
| `src/services/returnRepaymentCalculator.ts` | 생성 | 반납금·복원 가중치·결합 연금·대안 A/B/C/D·`applyNpsOptions` |
| `src/services/basicPensionCalculator.ts` | 생성 | 소득인정액·선정·연계감액·부부감액·소득역전 |
| `src/services/coupleSimulation.ts` | 생성 | 부부 연도별 통합 엔진, `personParams` |
| `src/services/npsHistoryParser.ts` | 생성 | 가입내역 PDF 텍스트 → 구조 → 추납·반납·국민연금 입력값 |
| `src/utils/pdfText.ts` | 생성 | PDF 텍스트 추출 (온보딩 기존 코드와 공용) |
| `src/components/ReturnRepaymentSection.tsx` | 생성 | 반납 입력 + 대안 비교표 |
| `src/components/NpsHistoryUpload.tsx` | 생성 | 가입내역 PDF 업로드·자동 입력 |
| `src/components/BasicPensionForm.tsx` | 생성 | 기초연금 단계 화면 |
| `src/components/CoupleSimulationSection.tsx` | 생성 | 대시보드 부부 섹션 |
| `src/components/AdditionalPaymentPanel.tsx` | 수정 | `who` prop, 가입내역 업로드·반납 섹션 포함 |
| `src/app/onboarding/page.tsx` | 수정 | 단계 구조·기본정보 2열·사람별 바인딩·기초연금 폼·백업·PDF 추출 공용화 |
| `src/app/dashboard/page.tsx` | 수정 | `applyNpsOptions`, 부부 엔진·섹션, 배지, 백업 |
| `src/app/dashboard/ai-advisor/page.tsx` | 수정 | `applyNpsOptions`, 배지 |
| `scratch/validate{CoupleStore,ReturnRepayment,BasicPension,CoupleSimulation,NpsHistory}.ts` | 생성 | 검증 스크립트 |
| `docs/features.md` | 수정 | FEAT-016 |

---

### Task 1: 스토어 — 배우자·반납·기초연금 필드와 `who` 라우팅

**Files:**
- Replace: `src/store/usePensionStore.ts`
- Modify: `src/app/onboarding/page.tsx` (`handleSaveData`의 `const data`), `src/app/dashboard/page.tsx` (`handleExportData`의 `const data`)
- Test: `scratch/validateCoupleStore.ts`

**Interfaces:**
- Consumes: 없음
- Produces (다른 Task가 그대로 씀):
  - 타입 `Who = "SELF" | "SPOUSE"`, `ReturnRepaymentState`, `SpouseState`, `PersonData`
  - `BasicPensionState` 추가 필드: `region, generalProperty, financialAssets, debts, luxuryAssets, selfEarnedIncome, selfOtherIncome, selfOccupational, spouseEarnedIncome, spouseOtherIncome, spouseOccupational`
  - `SimulationParamsState` 추가 필드: `spouseRetirementAge, spouseLifeExpectancy, spouseNationalPensionStartAge`
  - 스토어 필드 `returnRepayment`, `spouse`; 액션 `setReturnRepayment(data, who?)`; 사람별 기존 액션에 `who?` (생략 시 SELF)
  - `pensionsOf(state, who): PersonData`, `mergeWithDefaults(saved, defaults)`

- [ ] **Step 1: 실패하는 검증 스크립트 작성** — `scratch/validateCoupleStore.ts`

```ts
import assert from "node:assert/strict";

// zustand persist는 window.localStorage를 쓰므로 Node에서는 메모리 저장소를 window에 둔다
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => void memory.set(k, v),
      removeItem: (k: string) => void memory.delete(k),
    },
  },
});

async function main() {
  const { usePensionStore, mergeWithDefaults, pensionsOf } = await import("../src/store/usePensionStore");
  const s = usePensionStore.getState();

  // who를 생략하면 본인, SPOUSE면 배우자에 쓴다
  s.setNationalPension({ expectedMonthlyPension: 80 });
  s.setNationalPension({ expectedMonthlyPension: 56 }, "SPOUSE");
  s.addRetirementPension({ pensionType: "IRP", totalAccumulated: 1000 }, "SPOUSE");
  s.setReturnRepayment({ refundAmount: 104.4 }, "SPOUSE");
  s.setAdditionalPayment({ requestedMonths: 119 }, "SPOUSE");
  let st = usePensionStore.getState();
  assert.equal(st.nationalPension.expectedMonthlyPension, 80);
  assert.equal(st.spouse.nationalPension.expectedMonthlyPension, 56);
  assert.equal(st.retirementPensions.length, 0);
  assert.equal(st.spouse.retirementPensions.length, 1);
  assert.equal(pensionsOf(st, "SPOUSE").returnRepayment.refundAmount, 104.4);
  assert.equal(st.additionalPayment.requestedMonths, 0);
  assert.equal(st.spouse.additionalPayment.requestedMonths, 119);

  const id = st.spouse.retirementPensions[0].id;
  st.updateRetirementPension(id, { totalAccumulated: 2000 }, "SPOUSE");
  assert.equal(usePensionStore.getState().spouse.retirementPensions[0].totalAccumulated, 2000);
  st.deleteRetirementPension(id, "SPOUSE");
  assert.equal(usePensionStore.getState().spouse.retirementPensions.length, 0);

  // 이전 버전 백업: 새 필드가 없어도 초기값으로 채우고 액션은 유지한다
  usePensionStore.getState().importStoreData({
    basicPension: { householdType: "SINGLE", recognizedIncome: 10, expectedEligibility: true, expectedMonthlyAmount: 33 },
  } as never);
  st = usePensionStore.getState();
  assert.equal(st.basicPension.expectedMonthlyAmount, 33);
  assert.equal(st.basicPension.region, "METRO");
  assert.equal(st.spouse.nationalPension.expectedMonthlyPension, 0);
  assert.equal(st.simulationParams.spouseLifeExpectancy, 85);
  assert.equal(st.returnRepayment.installments, 1);
  assert.equal(typeof st.setNationalPension, "function");

  // 객체는 재귀 병합, 배열·값은 덮어쓰기
  assert.deepEqual(mergeWithDefaults({ a: { x: 1 }, arr: [9] }, { a: { x: 0, y: 2 }, arr: [1, 2], z: 3 }), {
    a: { x: 1, y: 2 },
    arr: [9],
    z: 3,
  });

  usePensionStore.getState().resetStore();
  assert.equal(usePensionStore.getState().spouse.retirementPensions.length, 0);
  console.log("Couple store validation success!");
}

main();
```

- [ ] **Step 2: 실패 확인** — `npx tsx scratch/validateCoupleStore.ts` → FAIL (`mergeWithDefaults`/`pensionsOf` export 없음)

- [ ] **Step 3: 스토어 전체 교체** — `src/store/usePensionStore.ts`를 아래 내용으로 바꾼다 (기존 타입·초기값 유지 + 필드 추가, 액션은 `patchPerson`/`pensionsOf`로 사람별 라우팅, persist `version: 2` 유지 + `merge`로 새 필드 채움).

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NationalPensionState {
  contributionMonths: number;
  totalPaidAmount: number;
  currentStandardMonthlyIncome: number;
  expectedTotalContributionMonths: number;
  expectedMonthlyPension: number;
  totalExpectedPremium: number;
  basicPensionAmount: number;
  aValue: number;
  bValue: number;
}

export interface BasicPensionState {
  householdType: "SINGLE" | "COUPLE";
  recognizedIncome: number;
  expectedEligibility: boolean;
  expectedMonthlyAmount: number;
  region: "METRO" | "CITY" | "RURAL"; // 거주지역 (기본재산 공제 구분)
  generalProperty: number; // 일반재산: 주택 공시가격 등 (만원)
  financialAssets: number; // 금융재산 (만원)
  debts: number; // 부채: 주택담보대출·임대보증금 (만원)
  luxuryAssets: number; // 고급 차량(4,000만원 이상)·회원권 가액 (만원)
  selfEarnedIncome: number; // 본인 65세 이후 상시근로소득 (만원/월)
  selfOtherIncome: number; // 본인 사업·임대·이자·배당·사적연금 소득 (만원/월)
  selfOccupational: boolean; // 본인 직역연금 수급권자
  spouseEarnedIncome: number;
  spouseOtherIncome: number;
  spouseOccupational: boolean;
}

export interface RetirementPensionState {
  id: string;
  pensionType: "DB" | "DC" | "IRP";
  avgSalary?: number; // DB
  yearsOfService?: number; // DB
  salaryGrowthRate?: number; // DB (%)
  totalAccumulated?: number; // DC/IRP
  monthlyContribution?: number; // DC/IRP
  companyMatchRate?: number; // DC/IRP
  expectedReturnRate?: number; // DC/IRP (%)
}

export interface PersonalPensionSavingsState {
  id: string;
  savingsType: "FUND" | "INSURANCE";
  totalAccumulated: number;
  monthlyAnnualContribution: number;
  desiredStartAge: number;
  receivingPeriod: number;
}

export interface PensionInsuranceState {
  id: string;
  insuranceType: string;
  totalAccumulated: number;
  monthlyPayment: number;
  paymentPeriod: number;
  expectedDeclaredRate: number; // (%)
}

export interface SimulationParamsState {
  currentAge: number;
  retirementAge: number;
  expectedLifeExpectancy: number;
  inflationRate: number; // (%)
  nationalPensionStartAge: number;
  hasSpouse: boolean;
  spouseAge?: number;
  childrenCount: number;
  childrenAges: string;
  targetMonthlySpending: number;
  minMonthlySpending: number;
  childSupportExpense: number;
  annualMedicalExpense: number;
  nonPensionAssets: number;
  propertyTaxBase: number;  // 재산세 과세표준 (만원)
  financialIncome: number;  // 금융소득 이자+배당 (만원/년)
  decumulationStrategy: "DECREASING" | "FLAT";
  // S4 하이브리드(배당+연금) 전략 매개변수
  coveredCallAsset: number;        // 커버드콜/월배당 투자금 (만원, 기본 5000)
  coveredCallDividendRate: number;  // 예상 연 분배율 (%, 기본 9.0)
  isCoupleDivided: boolean;         // 부부 명의 분산 여부 (기본 false)
  spouseRetirementAge: number;      // 배우자 은퇴 예상 나이
  spouseLifeExpectancy: number;     // 배우자 기대수명
  spouseNationalPensionStartAge: number; // 배우자 국민연금 개시 나이
}

export type GapReason = "EXEMPT" | "EXCLUDED" | "MILITARY" | "ARREARS";
export type EnrollStatus = "WORKPLACE" | "REGIONAL" | "VOLUNTARY" | "VOLUNTARY_CONT" | "NONE";

export interface AdditionalPaymentState {
  firstEnrollYm: string;          // 최초 가입년월 "YYYY-MM"
  resumeYm: string;               // 지속 가입개시 년월 "YYYY-MM"
  gapMonths: number;              // 중단 기간 (개월)
  gapReason: GapReason;           // 중단 사유
  enrollStatus: EnrollStatus;     // 현재 가입 상태
  receivedLumpSumRefund: boolean; // 반환일시금 수령 여부
  requestedMonths: number;        // 추납 희망 개월수
  baseIncome: number;             // 추납 기준소득월액 (만원)
  paymentMode: "LUMP" | "INSTALLMENT";
  installments: number;           // 분납 횟수 (최대 60)
  installmentInterestRate: number; // 분납이자율 (%/년, 1년 정기예금)
  applyYm: string;                // 신청 년월 "YYYY-MM" (첫 납부기한은 다음 달)
  marginalTaxRate: number;        // 한계세율 (%, 지방세 포함)
  applyToSimulation: boolean;     // 대시보드 시뮬레이션에 추납 반영
}

export interface ReturnRepaymentState {
  refundAmount: number;       // 반환일시금 원금 (만원)
  refundYm: string;           // 반환일시금 수령년월 "YYYY-MM"
  restoredMonths: number;     // 반납 시 복원되는 가입기간 (개월)
  periodStartYm: string;      // 복원 기간의 가입 시작년월 (소득대체율 판정)
  noticeAmount: number;       // 공단 반납 고지액 (만원, 0이면 추정)
  applyYm: string;            // 반납 신청년월 "YYYY-MM"
  installments: number;       // 분할 횟수 (1 = 일시납)
  applyToSimulation: boolean; // 대시보드 시뮬레이션에 반납 반영
}

// 본인·배우자 구분. 기존 액션은 who를 생략하면 본인(SELF)에 쓴다
export type Who = "SELF" | "SPOUSE";

export interface SpouseState {
  nationalPension: NationalPensionState;
  additionalPayment: AdditionalPaymentState;
  returnRepayment: ReturnRepaymentState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
}

export type PersonData = SpouseState;

interface StoreData {
  nationalPension: NationalPensionState;
  basicPension: BasicPensionState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
  simulationParams: SimulationParamsState;
  additionalPayment: AdditionalPaymentState;
  returnRepayment: ReturnRepaymentState;
  spouse: SpouseState;
}

interface PensionStore extends StoreData {
  // Actions — who를 생략하면 본인(SELF)
  setNationalPension: (data: Partial<NationalPensionState>, who?: Who) => void;
  setBasicPension: (data: Partial<BasicPensionState>) => void;
  addRetirementPension: (pension: Omit<RetirementPensionState, "id">, who?: Who) => void;
  updateRetirementPension: (id: string, data: Partial<RetirementPensionState>, who?: Who) => void;
  deleteRetirementPension: (id: string, who?: Who) => void;
  addPersonalPension: (pension: Omit<PersonalPensionSavingsState, "id">, who?: Who) => void;
  updatePersonalPension: (id: string, data: Partial<PersonalPensionSavingsState>, who?: Who) => void;
  deletePersonalPension: (id: string, who?: Who) => void;
  addPensionInsurance: (insurance: Omit<PensionInsuranceState, "id">, who?: Who) => void;
  updatePensionInsurance: (id: string, data: Partial<PensionInsuranceState>, who?: Who) => void;
  deletePensionInsurance: (id: string, who?: Who) => void;
  setRetirementPensions: (pensions: RetirementPensionState[], who?: Who) => void;
  setPersonalPensions: (pensions: PersonalPensionSavingsState[], who?: Who) => void;
  setPensionInsurances: (insurances: PensionInsuranceState[], who?: Who) => void;
  setSimulationParams: (data: Partial<SimulationParamsState>) => void;
  setAdditionalPayment: (data: Partial<AdditionalPaymentState>, who?: Who) => void;
  setReturnRepayment: (data: Partial<ReturnRepaymentState>, who?: Who) => void;
  importStoreData: (data: Partial<StoreData>) => void;
  resetStore: () => void;
}

const initialNationalPension: NationalPensionState = {
  contributionMonths: 0,
  totalPaidAmount: 0,
  currentStandardMonthlyIncome: 0,
  expectedTotalContributionMonths: 0,
  expectedMonthlyPension: 0,
  totalExpectedPremium: 0,
  basicPensionAmount: 0,
  aValue: 0,
  bValue: 0,
};

const initialBasicPension: BasicPensionState = {
  householdType: "SINGLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
};

const initialSimulationParams: SimulationParamsState = {
  currentAge: 35,
  retirementAge: 60,
  expectedLifeExpectancy: 85,
  inflationRate: 2.0,
  nationalPensionStartAge: 65,
  hasSpouse: false,
  spouseAge: 35,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 300,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "DECREASING",
  coveredCallAsset: 5000,
  coveredCallDividendRate: 9.0,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 85,
  spouseNationalPensionStartAge: 65,
};

const initialAdditionalPayment: AdditionalPaymentState = {
  firstEnrollYm: "",
  resumeYm: "",
  gapMonths: 0,
  gapReason: "EXEMPT",
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  requestedMonths: 0,
  baseIncome: 100,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "",
  marginalTaxRate: 0,
  applyToSimulation: false,
};

const initialReturnRepayment: ReturnRepaymentState = {
  refundAmount: 0,
  refundYm: "",
  restoredMonths: 0,
  periodStartYm: "",
  noticeAmount: 0,
  applyYm: "",
  installments: 1,
  applyToSimulation: false,
};

const initialSpouse: SpouseState = {
  nationalPension: initialNationalPension,
  additionalPayment: initialAdditionalPayment,
  returnRepayment: initialReturnRepayment,
  retirementPensions: [],
  personalPensions: [],
  pensionInsurances: [],
};

const initialData: StoreData = {
  nationalPension: initialNationalPension,
  basicPension: initialBasicPension,
  retirementPensions: [],
  personalPensions: [],
  pensionInsurances: [],
  simulationParams: initialSimulationParams,
  additionalPayment: initialAdditionalPayment,
  returnRepayment: initialReturnRepayment,
  spouse: initialSpouse,
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// 저장본·백업을 불러올 때 새로 생긴 필드가 초기값으로 채워지도록 객체는 재귀 병합, 배열·값은 덮어쓴다
export function mergeWithDefaults<T>(saved: unknown, defaults: T): T {
  if (!isPlainObject(saved) || !isPlainObject(defaults)) return defaults;
  const out: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) continue;
    const base = (defaults as Record<string, unknown>)[key];
    out[key] = isPlainObject(value) && isPlainObject(base) ? mergeWithDefaults(value, base) : value;
  }
  return out as T;
}

// 본인/배우자 연금 데이터를 같은 모양으로 꺼낸다
export function pensionsOf(state: StoreData, who: Who): PersonData {
  if (who === "SPOUSE") return state.spouse;
  return {
    nationalPension: state.nationalPension,
    additionalPayment: state.additionalPayment,
    returnRepayment: state.returnRepayment,
    retirementPensions: state.retirementPensions,
    personalPensions: state.personalPensions,
    pensionInsurances: state.pensionInsurances,
  };
}

// who에 해당하는 사람의 필드만 바꾼 부분 상태를 만든다
function patchPerson(state: StoreData, who: Who, patch: Partial<PersonData>): Partial<StoreData> {
  if (who === "SPOUSE") return { spouse: { ...state.spouse, ...patch } };
  return patch;
}

export const usePensionStore = create<PensionStore>()(
  persist(
    (set) => ({
      ...initialData,

      setNationalPension: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { nationalPension: { ...pensionsOf(state, who).nationalPension, ...data } })),

      setBasicPension: (data) =>
        set((state) => ({ basicPension: { ...state.basicPension, ...data } })),

      addRetirementPension: (pension, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: [...pensionsOf(state, who).retirementPensions, { ...pension, id: crypto.randomUUID() }],
          })
        ),

      updateRetirementPension: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: pensionsOf(state, who).retirementPensions.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deleteRetirementPension: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: pensionsOf(state, who).retirementPensions.filter((p) => p.id !== id),
          })
        ),

      addPersonalPension: (pension, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: [...pensionsOf(state, who).personalPensions, { ...pension, id: crypto.randomUUID() }],
          })
        ),

      updatePersonalPension: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: pensionsOf(state, who).personalPensions.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deletePersonalPension: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: pensionsOf(state, who).personalPensions.filter((p) => p.id !== id),
          })
        ),

      addPensionInsurance: (insurance, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: [...pensionsOf(state, who).pensionInsurances, { ...insurance, id: crypto.randomUUID() }],
          })
        ),

      updatePensionInsurance: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: pensionsOf(state, who).pensionInsurances.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deletePensionInsurance: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: pensionsOf(state, who).pensionInsurances.filter((p) => p.id !== id),
          })
        ),

      setRetirementPensions: (pensions, who = "SELF") =>
        set((state) => patchPerson(state, who, { retirementPensions: pensions })),

      setPersonalPensions: (pensions, who = "SELF") =>
        set((state) => patchPerson(state, who, { personalPensions: pensions })),

      setPensionInsurances: (insurances, who = "SELF") =>
        set((state) => patchPerson(state, who, { pensionInsurances: insurances })),

      setSimulationParams: (data) =>
        set((state) => ({ simulationParams: { ...state.simulationParams, ...data } })),

      setAdditionalPayment: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { additionalPayment: { ...pensionsOf(state, who).additionalPayment, ...data } })),

      setReturnRepayment: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { returnRepayment: { ...pensionsOf(state, who).returnRepayment, ...data } })),

      // 백업 파일은 이전 버전일 수 있으므로 빠진 필드를 초기값으로 채운다
      importStoreData: (data) => set(mergeWithDefaults(data, initialData)),

      resetStore: () => set(initialData),
    }),
    {
      name: "pensionlab-store",
      version: 2,
      // 이전 저장본에 없는 필드(배우자·반납·기초연금 입력 등)를 초기값으로 채운다
      merge: (persisted, current) => mergeWithDefaults(persisted, current),
    }
  )
);
```

- [ ] **Step 4: 백업에 포함** — 두 곳의 `const data = {...}`에서 `additionalPayment: store.additionalPayment,` 다음 줄에 추가:

```ts
      returnRepayment: store.returnRepayment,
      spouse: store.spouse,
```

- [ ] **Step 5: 통과 확인**
  - `npx tsx scratch/validateCoupleStore.ts` → `Couple store validation success!` (zustand 경고 출력 없음)
  - `npx tsx scratch/validateAdditionalPayment.ts`, `npx tsx scratch/validateWithdrawal.ts` → 기존 성공 메시지
  - `npx tsc --noEmit` 0 오류, `npx eslint src/store/usePensionStore.ts` 0

- [ ] **Step 6: Commit** — `feat: 배우자·반납·기초연금 입력 스토어 및 사람별 액션 라우팅`

---

### Task 2: 국민연금 룰셋 확장 + 반환일시금 반납 계산기

**Files:**
- Modify: `src/config/npsRules.ts` (끝에 추가)
- Create: `src/services/returnRepaymentCalculator.ts`
- Test: `scratch/validateReturnRepayment.ts`

**Interfaces:**
- Consumes: Task 1 타입, 기존 `additionalPaymentCalculator`의 `monthsBetween, firstDueYmOf, installmentInterestFactor, runAdditionalPaymentPlan, isVoluntary, effectiveBaseIncome, estimatePensionIncrease, applyAdditionalPayment`
- Produces:
  - npsRules: `DEPOSIT_RATE_BY_YEAR`, `depositRateForYear`, `replacementConstantForYear`, `bWeightForYear`, `survivorRateForMonths`, `SURVIVOR_OVERLAP_RATE`, `maxRefundInstallments`
  - calculator: `refundInterestFactor`, `calcRepaymentCost(rr): RepaymentCost`, `restoredWeights(rr)`, `estimateCombinedPension(national, restored, added)`, `isRepaymentReady(rr)`, `compareRefundScenarios(national, rr, ap, params): RefundScenario[]` (D, B, C, A 순서), `applyNpsOptions(national, ap, rr, params): AppliedNps` (`{ national, restoredMonths, addedMonths }`, 토글이 모두 꺼지면 입력 객체 그대로)

- [ ] **Step 1: 실패하는 검증 스크립트** — `scratch/validateReturnRepayment.ts`

```ts
import assert from "node:assert/strict";
import {
  depositRateForYear,
  replacementConstantForYear,
  bWeightForYear,
  survivorRateForMonths,
  maxRefundInstallments,
} from "../src/config/npsRules";
import {
  refundInterestFactor,
  calcRepaymentCost,
  restoredWeights,
  estimateCombinedPension,
  compareRefundScenarios,
  applyNpsOptions,
} from "../src/services/returnRepaymentCalculator";
import { estimatePensionIncrease, applyAdditionalPayment } from "../src/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  ReturnRepaymentState,
  SimulationParamsState,
} from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

// 룰셋
assert.equal(depositRateForYear(1996), 9.4);
assert.equal(depositRateForYear(1980), 10); // 표 이전 → 1988년 값
assert.equal(depositRateForYear(2030), 2.2); // 표 이후 → 2026년 값
assert.equal(replacementConstantForYear(1995), 2.4);
assert.equal(replacementConstantForYear(2003), 1.8);
near(replacementConstantForYear(2025), 1.245, 1e-9);
assert.equal(replacementConstantForYear(2026), 1.29);
assert.equal(bWeightForYear(1998), 0.75);
assert.equal(bWeightForYear(1999), 1);
assert.equal(survivorRateForMonths(119), 0.4);
assert.equal(survivorRateForMonths(125), 0.5);
assert.equal(survivorRateForMonths(240), 0.6);
assert.equal(maxRefundInstallments(11), 3);
assert.equal(maxRefundInstallments(30), 12);
assert.equal(maxRefundInstallments(60), 24);

// 참고 사례: 1996-03 반환일시금 104.4만원, 1993-10부터 30개월 복원, 2026-10 반납 신청
const rr: ReturnRepaymentState = {
  refundAmount: 104.4,
  refundYm: "1996-03",
  restoredMonths: 30,
  periodStartYm: "1993-10",
  noticeAmount: 0,
  applyYm: "2026-10",
  installments: 1,
  applyToSimulation: true,
};
near(refundInterestFactor("1996-03", "2026-10"), 2.9793, 1e-3);
const lump = calcRepaymentCost(rr);
near(lump.lumpSum, 311.04);
assert.equal(lump.source, "ESTIMATE");
assert.equal(lump.installments, 1);
const inst = calcRepaymentCost({ ...rr, installments: 12 });
near(inst.installmentInterest, 3.71);
near(inst.total, 314.74);
assert.equal(calcRepaymentCost({ ...rr, installments: 24 }).installments, 12); // 30개월 복원 → 최대 12회
const notice = calcRepaymentCost({ ...rr, noticeAmount: 350 });
assert.equal(notice.lumpSum, 350);
assert.equal(notice.source, "NOTICE");
// 1993-10~1996-03 (30개월) 모두 비례상수 2.4, B 가중 0.75
near(restoredWeights(rr).wA, 72, 1e-6);
near(restoredWeights(rr).wB, 54, 1e-6);

const national: NationalPensionState = {
  contributionMonths: 71,
  totalPaidAmount: 643.6,
  currentStandardMonthlyIncome: 101.3,
  expectedTotalContributionMonths: 125,
  expectedMonthlyPension: 23.648,
  totalExpectedPremium: 1229.129,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 101.3,
};
const ap: AdditionalPaymentState = {
  firstEnrollYm: "1993-10",
  resumeYm: "2020-10",
  gapMonths: 180,
  gapReason: "EXCLUDED",
  enrollStatus: "VOLUNTARY",
  receivedLumpSumRefund: false,
  requestedMonths: 119,
  baseIncome: 101.3,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "2026-10",
  marginalTaxRate: 0,
  applyToSimulation: true,
};
const params = { nationalPensionStartAge: 65, expectedLifeExpectancy: 88 } as SimulationParamsState;

// 복원 없는 결합 계산 = 기존 추납 계산
near(
  estimateCombinedPension(national, { months: 0, wA: 0, wB: 0 }, { months: 119, income: 101.3 }).afterMonthly,
  estimatePensionIncrease(national, 119, 101.3).afterMonthly,
  1e-9
);

const [D, B, C, A] = compareRefundScenarios(national, rr, ap, params);
assert.deepEqual([D.id, B.id, C.id, A.id], ["D", "B", "C", "A"]);
near(D.monthly, 23.648);
assert.equal(D.recoverAgeTotal, 69.3);
near(D.gainAtLifeExpectancy, 5581.5);
near(B.monthly, 33.53);
near(B.extraCost, 311.04);
assert.equal(B.totalMonths, 155);
assert.equal(B.recoverAgeTotal, 68.8);
assert.equal(B.recoverAgeExtra, 67.6);
near(C.monthly, 46.07);
near(C.extraCost, 1145.20);
assert.equal(C.totalMonths, 244);
near(A.monthly, 55.95);
assert.equal(A.totalMonths, 274);
near(A.extraCost, 1456.23);
assert.equal(A.recoverAgeTotal, 69);
near(A.gainAtLifeExpectancy, 13429.02);

// 대시보드 반영
const both = applyNpsOptions(national, ap, rr, params);
near(both.national.expectedMonthlyPension, 56.0, 1e-9);
assert.equal(both.national.expectedTotalContributionMonths, 274);
assert.equal(both.restoredMonths, 30);
assert.equal(both.addedMonths, 119);
assert.equal(both.national.totalExpectedPremium, 2685);
const off = applyNpsOptions(national, { ...ap, applyToSimulation: false }, { ...rr, applyToSimulation: false }, params);
assert.equal(off.national, national);
// 반납 끄면 기존 추납 반영과 같다
const addOnly = applyNpsOptions(national, ap, { ...rr, applyToSimulation: false }, params);
const legacy = applyAdditionalPayment(national, ap, params);
assert.equal(addOnly.national.expectedMonthlyPension, legacy.expectedMonthlyPension);
assert.equal(addOnly.national.expectedTotalContributionMonths, legacy.expectedTotalContributionMonths);
// 가입월수 누락 + 예상연금 있음 → 반영 안 함
assert.equal(applyNpsOptions({ ...national, expectedTotalContributionMonths: 0 }, ap, rr, params).national.expectedMonthlyPension, 23.648);

console.log("Return repayment validation success!");
```

- [ ] **Step 2: 실패 확인** — FAIL (export 없음)

- [ ] **Step 3: 룰셋 추가** — `src/config/npsRules.ts` 끝에:

```ts
// 반환일시금 반납금·반납 분할이자에 쓰는 공단 고시 연도별 1년 만기 정기예금 이자율 (%)
// 출처: 국민연금공단 반환일시금 반납 안내(nps.or.kr/pnsinfo/ntpsklg/getOHAF0046M0.do), 2026-09 확인
export const DEPOSIT_RATE_BY_YEAR: Record<number, number> = {
  1988: 10, 1989: 10, 1990: 10, 1991: 10, 1992: 10, 1993: 10, 1994: 8.5, 1995: 9.1, 1996: 9.4, 1997: 9.4,
  1998: 9.3, 1999: 8.2, 2000: 7.0, 2001: 6.8, 2002: 4.3, 2003: 4.3, 2004: 3.6, 2005: 3.0, 2006: 3.2, 2007: 3.6,
  2008: 3.8, 2009: 3.7, 2010: 2.8, 2011: 2.7, 2012: 2.8, 2013: 2.6, 2014: 2.2, 2015: 1.8, 2016: 1.3, 2017: 1.0,
  2018: 1.4, 2019: 1.6, 2020: 1.1, 2021: 0.7, 2022: 1.2, 2023: 3.5, 2024: 3.0, 2025: 2.6, 2026: 2.2,
};

// 표에 없는 해는 가장 가까운 해의 이자율을 쓴다 (1988년 이전 → 1988년, 2026년 이후 → 2026년)
export function depositRateForYear(year: number): number {
  const clamped = Math.min(2026, Math.max(1988, year));
  return DEPOSIT_RATE_BY_YEAR[clamped];
}

// 가입 시기별 비례상수: 1988~1998 소득대체율 70%(2.4), 1999~2007 60%(1.8), 2008 50%(1.5),
// 2009~2025 매년 0.5%p 인하(1.5 − 0.015/년), 2026~ 43%(1.29)
export function replacementConstantForYear(year: number): number {
  if (year <= 1998) return 2.4;
  if (year <= 2007) return 1.8;
  if (year <= 2025) return 1.5 - 0.015 * (year - 2008);
  return NPS_RULES.replacementConstant;
}

// 1998년 이전 가입기간은 기본연금액을 (A + 0.75B)로 산정한다
export function bWeightForYear(year: number): number {
  return year <= 1998 ? 0.75 : 1;
}

// 유족연금 지급률: 사망자 가입기간 10년 미만 40%, 10~20년 50%, 20년 이상 60%
export function survivorRateForMonths(months: number): number {
  if (months < 120) return 0.4;
  if (months < 240) return 0.5;
  return 0.6;
}

// 중복급여 조정: 본인 노령연금을 고르면 유족연금의 30%를 더 받는다 (2016.11.30 이후)
export const SURVIVOR_OVERLAP_RATE = 0.3;

// 반환일시금 반납 분할 횟수: 종전 가입기간 1년 미만 3회, 1년 이상 5년 미만 12회, 5년 이상 24회
export function maxRefundInstallments(restoredMonths: number): number {
  if (restoredMonths < 12) return 3;
  if (restoredMonths < 60) return 12;
  return 24;
}
```

- [ ] **Step 4: 계산기** — `src/services/returnRepaymentCalculator.ts`

```ts
import {
  NPS_RULES,
  depositRateForYear,
  replacementConstantForYear,
  bWeightForYear,
  maxRefundInstallments,
} from "@/config/npsRules";
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  runAdditionalPaymentPlan,
  isVoluntary,
  effectiveBaseIncome,
} from "@/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  ReturnRepaymentState,
  SimulationParamsState,
} from "@/store/usePensionStore";

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const yearOf = (ym: string) => Number(ym.slice(0, 4));

// 반납 이자: 반환일시금 지급월부터 반납 신청월 전월까지, 해마다 그 해 이자율로 원금에 가산(연 단위 복리)
export function refundInterestFactor(refundYm: string, applyYm: string): number {
  const months = Math.max(0, monthsBetween(refundYm, applyYm));
  const monthsByYear = new Map<number, number>();
  for (let k = 0; k < months; k++) {
    const y = yearOf(addMonths(refundYm, k));
    monthsByYear.set(y, (monthsByYear.get(y) || 0) + 1);
  }
  let factor = 1;
  monthsByYear.forEach((m, y) => {
    factor *= 1 + (depositRateForYear(y) / 100) * (m / 12);
  });
  return factor;
}

export interface RepaymentCost {
  principal: number; // 반환일시금 원금
  lumpSum: number; // 일시 반납금 (원금 + 반납 이자)
  installmentInterest: number; // 분할 시 추가 이자
  total: number; // 실제 낼 총액
  installments: number; // 적용된 분할 횟수
  source: "NOTICE" | "ESTIMATE"; // 공단 고지액 사용 여부
}

export function calcRepaymentCost(rr: ReturnRepaymentState): RepaymentCost {
  const source = rr.noticeAmount > 0 ? "NOTICE" : "ESTIMATE";
  const lumpSum =
    source === "NOTICE" ? rr.noticeAmount : rr.refundAmount * refundInterestFactor(rr.refundYm, rr.applyYm);
  const installments = Math.min(maxRefundInstallments(rr.restoredMonths), Math.max(1, Math.floor(rr.installments)));
  let installmentInterest = 0;
  if (installments > 1) {
    // 분할납부이자: 1년 만기 정기예금 이자율(신청 연도), 신청월~각 회차 납부월 전월, 1년 단위 복리
    const rate = depositRateForYear(yearOf(rr.applyYm));
    const firstDue = firstDueYmOf(rr.applyYm);
    for (let k = 0; k < installments; k++) {
      const due = addMonths(firstDue, k);
      installmentInterest += (lumpSum / installments) * (installmentInterestFactor(rate, monthsBetween(rr.applyYm, due)) - 1);
    }
  }
  return {
    principal: rr.refundAmount,
    lumpSum,
    installmentInterest,
    total: lumpSum + installmentInterest,
    installments,
    source,
  };
}

// 복원 기간의 가중 비례상수 합: wA = Σ 비례상수, wB = Σ 비례상수 × B가중(1998년 이전 0.75)
export function restoredWeights(rr: ReturnRepaymentState): { wA: number; wB: number } {
  let wA = 0;
  let wB = 0;
  for (let k = 0; k < Math.max(0, rr.restoredMonths); k++) {
    const y = yearOf(addMonths(rr.periodStartYm, k));
    const c = replacementConstantForYear(y);
    wA += c;
    wB += c * bWeightForYear(y);
  }
  return { wA, wB };
}

export interface CombinedPension {
  beforeMonthly: number;
  afterMonthly: number;
  totalMonthsBefore: number;
  totalMonthsAfter: number;
}

// 기본연금액(연) ≈ Σ 비례상수 × (A + 가중B) × 월수 / 240.
// 기존 기간 비례상수는 NPS 예상연금액으로 역산, 복원 기간은 당시 비례상수, 추납 기간은 현행 1.29.
// 복원 기간의 소득은 본인 평균소득(B)과 같다고 가정한다.
export function estimateCombinedPension(
  national: NationalPensionState,
  restored: { months: number; wA: number; wB: number },
  added: { months: number; income: number }
): CombinedPension {
  const A = national.aValue || NPS_RULES.aValue;
  const P = national.expectedTotalContributionMonths;
  const bOld = national.bValue || national.currentStandardMonthlyIncome;
  const c = NPS_RULES.replacementConstant;
  const calibrated = national.expectedMonthlyPension > 0 && P >= NPS_RULES.minPensionMonths;
  const alphaOld = calibrated ? (national.expectedMonthlyPension * 12 * 240) / ((A + bOld) * P) : c;
  const beforeMonthly =
    P >= NPS_RULES.minPensionMonths
      ? calibrated ? national.expectedMonthlyPension : ((A + bOld) * alphaOld * P) / 240 / 12
      : 0;
  const totalAfter = P + restored.months + added.months;
  const bNew = totalAfter > 0 ? (bOld * (P + restored.months) + added.income * added.months) / totalAfter : bOld;
  const annual = (A + bNew) * alphaOld * P + A * restored.wA + bNew * restored.wB + (A + bNew) * c * added.months;
  const afterMonthly = totalAfter >= NPS_RULES.minPensionMonths ? annual / 240 / 12 : 0;
  return { beforeMonthly, afterMonthly, totalMonthsBefore: P, totalMonthsAfter: totalAfter };
}

// 반납 계산에 필요한 입력이 다 있는지 (원금·복원 개월수·수령년월·복원 시작년월·신청년월)
export function isRepaymentReady(rr: ReturnRepaymentState): boolean {
  return rr.refundAmount > 0 && rr.restoredMonths > 0 && !!rr.refundYm && !!rr.periodStartYm && !!rr.applyYm;
}

export type ScenarioId = "D" | "B" | "C" | "A";

export interface RefundScenario {
  id: ScenarioId;
  label: string;
  addedMonths: number; // 복원 + 추납 개월수
  totalMonths: number;
  extraCost: number; // 새로 낼 금액 (반납금 + 추납보험료)
  lifetimePremium: number; // 생애 총 납부보험료 = 기존 총 예상 납부보험료 + extraCost
  monthly: number; // 예상 연금 월액
  delta: number; // 현행 대비 증가 월액
  recoverAgeTotal: number | null; // 생애 총 납부보험료를 다 돌려받는 나이
  recoverAgeExtra: number | null; // 새로 낸 금액만 돌려받는 나이
  gainAtLifeExpectancy: number; // 기대수명까지 총 수령액 − 생애 총 납부보험료
}

// 현재가치 기준 원금 회수 나이 = 개시 나이 + 원금 ÷ 월액 ÷ 12 (소수 첫째 자리)
function recoverAge(startAge: number, cost: number, monthly: number): number | null {
  if (monthly <= 0) return null;
  return Math.round((startAge + cost / monthly / 12) * 10) / 10;
}

// 대안 D 현행 유지 / B 반환일시금 반납 / C 추납 / A 반납 + 추납
export function compareRefundScenarios(
  national: NationalPensionState,
  rr: ReturnRepaymentState,
  ap: AdditionalPaymentState,
  params: SimulationParamsState
): RefundScenario[] {
  const hasRefund = isRepaymentReady(rr);
  const refundCost = hasRefund ? calcRepaymentCost(rr).total : 0;
  const weights = hasRefund ? restoredWeights(rr) : { wA: 0, wB: 0 };
  const restored = { months: hasRefund ? rr.restoredMonths : 0, ...weights };
  const plan = ap.applyYm ? runAdditionalPaymentPlan(ap, national, params) : null;
  const addMonthsCount = plan ? plan.months : 0;
  const addCost = plan ? plan.cost.total : 0;
  // 추납 기준소득월액: 임의(계속)가입자는 선택 금액, 그 외는 현재 기준소득월액 (runAdditionalPaymentPlan과 동일)
  const addIncome = effectiveBaseIncome(
    isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome }
  );
  const none = { months: 0, wA: 0, wB: 0 };
  const noAdd = { months: 0, income: 0 };
  const add = { months: addMonthsCount, income: addIncome };
  const variants: { id: ScenarioId; label: string; r: typeof restored; a: typeof add; cost: number }[] = [
    { id: "D", label: "현행 유지", r: none, a: noAdd, cost: 0 },
    { id: "B", label: "반환일시금 반납", r: restored, a: noAdd, cost: refundCost },
    { id: "C", label: "추납", r: none, a: add, cost: addCost },
    { id: "A", label: "반납 + 추납", r: restored, a: add, cost: refundCost + addCost },
  ];
  const start = params.nationalPensionStartAge;
  const years = Math.max(0, params.expectedLifeExpectancy - start + 1);
  const base = estimateCombinedPension(national, none, noAdd);
  return variants.map((v) => {
    const p = estimateCombinedPension(national, v.r, v.a);
    const lifetimePremium = national.totalExpectedPremium + v.cost;
    return {
      id: v.id,
      label: v.label,
      addedMonths: v.r.months + v.a.months,
      totalMonths: p.totalMonthsAfter,
      extraCost: v.cost,
      lifetimePremium,
      monthly: p.afterMonthly,
      delta: p.afterMonthly - base.afterMonthly,
      recoverAgeTotal: recoverAge(start, lifetimePremium, p.afterMonthly),
      recoverAgeExtra: v.cost > 0 ? recoverAge(start, v.cost, p.afterMonthly - base.afterMonthly) : null,
      gainAtLifeExpectancy: p.afterMonthly * 12 * years - lifetimePremium,
    };
  });
}

export interface AppliedNps {
  national: NationalPensionState; // 반영 토글이 모두 꺼져 있으면 입력 객체 그대로
  restoredMonths: number; // 반영된 반납 복원 개월수
  addedMonths: number; // 반영된 추납 개월수
}

// 대시보드·부부 시뮬레이션 반영용: 반영 토글이 켜진 반납·추납만 적용한 국민연금 상태
export function applyNpsOptions(
  national: NationalPensionState,
  ap: AdditionalPaymentState,
  rr: ReturnRepaymentState,
  params: SimulationParamsState
): AppliedNps {
  const unchanged = { national, restoredMonths: 0, addedMonths: 0 };
  // 예상 연금액은 있는데 총 예상 가입월수가 비어 있거나 120개월 미만이면 증가액을 계산할 근거가 없다
  if (national.expectedTotalContributionMonths < NPS_RULES.minPensionMonths && national.expectedMonthlyPension > 0) {
    return unchanged;
  }
  const useRefund = rr.applyToSimulation && isRepaymentReady(rr);
  const plan = ap.applyToSimulation && ap.applyYm ? runAdditionalPaymentPlan(ap, national, params) : null;
  const useAdd = !!plan && plan.months > 0;
  if (!useRefund && !useAdd) return unchanged;

  const restored = useRefund ? { months: rr.restoredMonths, ...restoredWeights(rr) } : { months: 0, wA: 0, wB: 0 };
  const addIncome = effectiveBaseIncome(
    isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome }
  );
  const added = useAdd ? { months: plan!.months, income: addIncome } : { months: 0, income: 0 };
  const cost = (useRefund ? calcRepaymentCost(rr).total : 0) + (useAdd ? plan!.cost.total : 0);
  const combined = estimateCombinedPension(national, restored, added);
  return {
    national: {
      ...national,
      expectedMonthlyPension: Math.round(combined.afterMonthly * 10) / 10,
      expectedTotalContributionMonths: combined.totalMonthsAfter,
      contributionMonths: national.contributionMonths + restored.months + added.months,
      totalPaidAmount: Math.round(national.totalPaidAmount + cost),
      totalExpectedPremium: Math.round(national.totalExpectedPremium + cost),
    },
    restoredMonths: restored.months,
    addedMonths: added.months,
  };
}
```

- [ ] **Step 5: 통과 확인** — `Return repayment validation success!`, tsc 0, 두 파일 eslint 0

- [ ] **Step 6: Commit** — `feat: 반환일시금 반납 계산 및 반납·추납 대안 비교`

---

### Task 3: 기초연금 룰셋 + 2인 판정 계산기

**Files:** Create `src/config/basicPensionRules.ts`, `src/services/basicPensionCalculator.ts`; Test `scratch/validateBasicPension.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `BASIC_PENSION_RULES`, `Region`; `calcBasicPension(self, spouse | null, household, index = 1): BasicPensionResult` (`{ recognizedIncome, threshold, eligible, self, spouse, notes }`), `BasicPensionPerson`, `BasicPensionHousehold`

- [ ] **Step 1: 실패하는 검증 스크립트** — `scratch/validateBasicPension.ts`

```ts
import assert from "node:assert/strict";
import { calcBasicPension, type BasicPensionPerson, type BasicPensionHousehold } from "../src/services/basicPensionCalculator";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const person = (o: Partial<BasicPensionPerson> = {}): BasicPensionPerson => ({
  alive: true,
  age: 66,
  earnedIncome: 0,
  otherIncome: 0,
  nationalPension: 0,
  aShare: 0.5,
  occupational: false,
  ...o,
});
const hh = (o: Partial<BasicPensionHousehold> = {}): BasicPensionHousehold => ({
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  ...o,
});

// 참고 사례 A: 서울 공시가 6억 단독 → 소득환산 월 155만원, 전액 수급
const a = calcBasicPension(person(), null, hh({ generalProperty: 60000 }));
near(a.recognizedIncome, 155);
assert.equal(a.threshold, 247);
near(a.self, 34.97);

// 참고 사례 B: 중소도시 공시가 8억 부부, 주담대 2억 → 월 171.67만원, 부부 각 20% 감액
const b = calcBasicPension(person(), person({ age: 67 }), hh({ region: "CITY", generalProperty: 80000, debts: 20000 }));
near(b.recognizedIncome, 171.67);
assert.equal(b.threshold, 395.2);
near(b.self, 27.976);
near(b.spouse, 27.976);

// 부부 중 한 명만 65세 이상 → 부부 기준 심사, 감액 없음
const c = calcBasicPension(person(), person({ age: 60 }), hh());
assert.equal(c.threshold, 395.2);
near(c.self, 34.97);
assert.equal(c.spouse, 0);

// 근로소득: 116만원 공제 후 70% 반영
near(calcBasicPension(person({ earnedIncome: 216 }), null, hh()).recognizedIncome, 70);

// 국민연금 연계감액: 국민연금 80만원(A급여 40만원) → 34.97 − ⅔×40 + 17.485
near(calcBasicPension(person({ nationalPension: 80 }), null, hh()).self, 25.79);
// 연계감액 하한: 기준연금액의 50%
near(calcBasicPension(person({ nationalPension: 200 }), null, hh()).self, 17.485);

// 소득역전방지: 소득인정액 230 + 34.97 > 247 → 17만원
near(calcBasicPension(person({ otherIncome: 230 }), null, hh()).self, 17);

// 선정기준 초과 / 직역연금
assert.equal(calcBasicPension(person({ nationalPension: 250 }), null, hh({ generalProperty: 60000 })).eligible, false);
assert.equal(calcBasicPension(person(), person({ occupational: true }), hh()).self, 0);

// 금액 기준 물가 지수 (index 1.1 → 기준연금액 38.467)
near(calcBasicPension(person(), null, hh(), 1.1).self, 38.467);

console.log("Basic pension validation success!");
```

- [ ] **Step 2: 실패 확인** — FAIL (모듈 없음)

- [ ] **Step 3: 룰셋** — `src/config/basicPensionRules.ts`

```ts
// 기초연금 2026년 기준 룰셋 — 출처: 복지로·보건복지부 기초연금 안내, 국민연금공단 연계감액 안내 (2026-09 확인)
// 기준연금액·선정기준액은 매년 1월 고시되므로 갱신한다. 금액 단위: 만원
export type Region = "METRO" | "CITY" | "RURAL";

export const BASIC_PENSION_RULES = {
  eligibleAge: 65, // 수급 연령
  baseAmount: 34.97, // 기준연금액 (월, 단독 기준)
  thresholdSingle: 247, // 선정기준액 단독가구 (월)
  thresholdCouple: 395.2, // 선정기준액 부부가구 (월)
  coupleReduction: 0.2, // 부부 모두 수급 시 각각 20% 감액
  earnedIncomeDeduction: 116, // 상시근로소득 1인당 기본공제 (월)
  earnedIncomeRatio: 0.7, // 공제 후 반영 비율
  propertyDeduction: { METRO: 13500, CITY: 8500, RURAL: 7250 } as Record<Region, number>, // 지역별 기본재산 공제
  financialDeduction: 2000, // 금융재산 공제 (가구당)
  propertyConversionRate: 0.04, // 재산 소득환산율 (연)
  linkageTriggerRatio: 1.5, // 국민연금이 기준연금액의 150% 초과 시 연계감액
  linkageAltRatio: 2.5, // 연계감액 대안 산식: 기준연금액 × 250% − 국민연금
  additionalRatio: 0.5, // 부가연금액 = 기준연금액 × 50% (연계감액 하한)
  minPaymentRatio: 0.1, // 소득역전방지 감액 후 최저 지급액 = 기준연금액 × 10%
};
```

- [ ] **Step 4: 계산기** — `src/services/basicPensionCalculator.ts`

```ts
import { BASIC_PENSION_RULES as R, type Region } from "@/config/basicPensionRules";

export interface BasicPensionPerson {
  alive: boolean;
  age: number;
  earnedIncome: number; // 상시근로소득 (만원/월)
  otherIncome: number; // 사업·임대·이자·배당·사적연금 등 (만원/월, 100% 반영)
  nationalPension: number; // 그 해 받는 국민연금(유족연금 포함, 만원/월)
  aShare: number; // 국민연금 중 A급여(소득재분배) 비율 ≈ A / (A + B)
  occupational: boolean; // 공무원·사학·군인·별정우체국연금 수급권자
}

export interface BasicPensionHousehold {
  region: Region;
  generalProperty: number; // 일반재산(주택 공시가격 등, 만원)
  financialAssets: number; // 금융재산 (만원)
  debts: number; // 부채 (만원)
  luxuryAssets: number; // 고급 차량·회원권 가액 (만원, 전액 월 소득 반영)
}

export interface BasicPensionResult {
  recognizedIncome: number; // 소득인정액 (월)
  threshold: number; // 선정기준액 (월)
  eligible: boolean;
  self: number; // 본인 기초연금 (월)
  spouse: number; // 배우자 기초연금 (월)
  notes: string[];
}

// 모든 금액 기준은 2026년 값 × index (물가 지수, 2026년 = 1)
export function calcBasicPension(
  self: BasicPensionPerson,
  spouse: BasicPensionPerson | null,
  hh: BasicPensionHousehold,
  index = 1
): BasicPensionResult {
  const notes: string[] = [];
  const people = [self, spouse].filter((p): p is BasicPensionPerson => !!p && p.alive);
  const couple = people.length === 2;
  const threshold = (couple ? R.thresholdCouple : R.thresholdSingle) * index;
  const base = R.baseAmount * index;

  const incomeEval = people.reduce(
    (sum, p) =>
      sum +
      Math.max(0, p.earnedIncome - R.earnedIncomeDeduction * index) * R.earnedIncomeRatio +
      p.otherIncome +
      p.nationalPension,
    0
  );
  const netProperty =
    Math.max(0, hh.generalProperty - R.propertyDeduction[hh.region] * index) +
    Math.max(0, hh.financialAssets - R.financialDeduction * index) -
    hh.debts;
  const propertyIncome = (Math.max(0, netProperty) * R.propertyConversionRate) / 12 + hh.luxuryAssets;
  const recognizedIncome = incomeEval + propertyIncome;

  const empty = { recognizedIncome, threshold, eligible: false, self: 0, spouse: 0, notes };
  if (people.some((p) => p.occupational)) {
    notes.push("직역연금(공무원·사학·군인·별정우체국) 수급권자와 그 배우자는 기초연금 대상에서 제외됩니다.");
    return empty;
  }
  if (recognizedIncome > threshold) {
    notes.push(`소득인정액(월 ${recognizedIncome.toFixed(1)}만원)이 선정기준액(월 ${threshold.toFixed(1)}만원)을 넘습니다.`);
    return empty;
  }

  // 1) 국민연금 연계감액: 국민연금 > 기준연금액 150%이면
  //    max((기준연금액 − ⅔ × A급여) + 부가연금액, 기준연금액 × 250% − 국민연금), [부가연금액, 기준연금액] 범위
  const amountFor = (p: BasicPensionPerson | null): number => {
    if (!p || !p.alive || p.age < R.eligibleAge) return 0;
    if (p.nationalPension <= base * R.linkageTriggerRatio) return base;
    const aBenefit = p.nationalPension * p.aShare;
    const byA = base - (2 / 3) * aBenefit + base * R.additionalRatio;
    const byTotal = base * R.linkageAltRatio - p.nationalPension;
    return Math.min(base, Math.max(base * R.additionalRatio, Math.max(byA, byTotal)));
  };
  let s = amountFor(self);
  let sp = amountFor(spouse);

  // 2) 부부 모두 수급하면 각각 20% 감액
  if (s > 0 && sp > 0) {
    s *= 1 - R.coupleReduction;
    sp *= 1 - R.coupleReduction;
    notes.push("부부가 모두 받으므로 각각 20% 감액했습니다.");
  }

  // 3) 소득역전방지: 소득인정액 + 기초연금이 선정기준액을 넘으면 넘는 만큼 감액 (최저 기준연금액의 10%)
  const total = s + sp;
  if (total > 0 && recognizedIncome + total > threshold) {
    const allowed = Math.max(0, threshold - recognizedIncome);
    const ratio = allowed / total;
    s = s > 0 ? Math.max(base * R.minPaymentRatio, s * ratio) : 0;
    sp = sp > 0 ? Math.max(base * R.minPaymentRatio, sp * ratio) : 0;
    notes.push("소득인정액과 기초연금 합계가 선정기준액을 넘어 소득역전방지 감액을 적용했습니다.");
  }
  return { recognizedIncome, threshold, eligible: s + sp > 0, self: s, spouse: sp, notes };
}
```

- [ ] **Step 5: 통과 확인** — `Basic pension validation success!`, tsc 0, eslint 0

- [ ] **Step 6: Commit** — `feat: 기초연금 부부 소득인정액·연계감액 판정 계산기`

---

### Task 4: 부부 통합 시뮬레이션 엔진

**Files:** Create `src/services/coupleSimulation.ts`; Test `scratch/validateCoupleSimulation.ts`

**Interfaces:**
- Consumes: 기존 `runPensionSimulation`, Task 2 `survivorRateForMonths, SURVIVOR_OVERLAP_RATE, NPS_RULES`, Task 3 `calcBasicPension`
- Produces: `personParams(params, who)`, `runCoupleSimulation(self, spouse | null, params, basic, baseYear?)` → `CoupleSimulationResult` (`rows`, `firstDeath`, `lifetime`), 타입 `PersonPensions`, `PersonYear`, `CoupleYear`, `SurvivorChoice`

- [ ] **Step 1: 실패하는 검증 스크립트** — `scratch/validateCoupleSimulation.ts`

```ts
import assert from "node:assert/strict";
import { runCoupleSimulation, personParams, type PersonPensions } from "../src/services/coupleSimulation";
import type { BasicPensionState, NationalPensionState, SimulationParamsState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const nat = (o: Partial<NationalPensionState>): NationalPensionState => ({
  contributionMonths: 0,
  totalPaidAmount: 0,
  currentStandardMonthlyIncome: 0,
  expectedTotalContributionMonths: 0,
  expectedMonthlyPension: 0,
  totalExpectedPremium: 0,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 0,
  ...o,
});
const params = {
  currentAge: 60,
  retirementAge: 60,
  expectedLifeExpectancy: 80,
  inflationRate: 0,
  nationalPensionStartAge: 65,
  hasSpouse: true,
  spouseAge: 55,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 300,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "FLAT",
  coveredCallAsset: 0,
  coveredCallDividendRate: 0,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 88,
  spouseNationalPensionStartAge: 65,
} as SimulationParamsState;
const basic = {
  householdType: "COUPLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 60000,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
} as BasicPensionState;
const empty = { retirementPensions: [], personalPensions: [], pensionInsurances: [] };
const husband: PersonPensions = {
  national: nat({ expectedMonthlyPension: 200, expectedTotalContributionMonths: 360, bValue: 500, currentStandardMonthlyIncome: 500 }),
  ...empty,
};
const wife: PersonPensions = {
  national: nat({ expectedMonthlyPension: 56, expectedTotalContributionMonths: 274, bValue: 101.3, currentStandardMonthlyIncome: 101.3 }),
  ...empty,
};

// 배우자 매개변수
const sp = personParams(params, "SPOUSE");
assert.equal(sp.currentAge, 55);
assert.equal(sp.expectedLifeExpectancy, 88);
assert.equal(personParams(params, "SELF"), params);

const r = runCoupleSimulation(husband, wife, params, basic, 2026);
assert.equal(r.rows.length, 34); // 배우자 55세 → 88세
assert.deepEqual(r.firstDeath, { who: "SELF", year: 2047, age: 81 });
const at = (y: number) => r.rows.find((row) => row.year === y)!;

// 2031: 남편 65세, 아내 60세 → 부부가구 심사, 남편만 수급(연계감액 하한 17.485)
near(at(2031).self.national, 200);
near(at(2031).self.basic, 17.485);
assert.equal(at(2031).spouse!.national, 0);
// 2036: 둘 다 수급, 소득인정액(200 + 56 + 155) > 395.2 → 기초연금 없음
near(at(2036).household, 256);
assert.equal(at(2036).self.basic, 0);
// 2047: 남편 사망 → 아내는 유족연금(200 × 60%) 120 vs 본인 56 + 30% 36 → 유족연금 선택
assert.equal(at(2047).self.alive, false);
near(at(2047).spouse!.national, 120);
assert.equal(at(2047).spouse!.survivorChoice, "SURVIVOR");
near(at(2059).household, 120);
near(r.lifetime.household, 65561.1);

// 아내 연금이 더 크면 본인 연금 + 유족연금 30%를 고른다
const r2 = runCoupleSimulation(
  { ...husband, national: nat({ expectedMonthlyPension: 60, expectedTotalContributionMonths: 130, bValue: 200 }) },
  { ...wife, national: nat({ expectedMonthlyPension: 150, expectedTotalContributionMonths: 300, bValue: 300 }) },
  params,
  { ...basic, generalProperty: 200000 },
  2026
);
const y2 = r2.rows.find((row) => row.year === 2047)!;
near(y2.spouse!.national, 150 + 0.3 * 0.5 * 60); // 가입 130개월 → 유족 50%
assert.equal(y2.spouse!.survivorChoice, "OWN_PLUS_30");

// 배우자 없음: 본인 기대수명까지만
const solo = runCoupleSimulation(husband, null, { ...params, hasSpouse: false }, basic, 2026);
assert.equal(solo.rows.length, 21);
assert.equal(solo.firstDeath, null);
assert.equal(solo.rows[0].spouse, null);

console.log("Couple simulation validation success!");
```

- [ ] **Step 2: 실패 확인** — FAIL (모듈 없음)

- [ ] **Step 3: 엔진** — `src/services/coupleSimulation.ts`

```ts
import { runPensionSimulation, type CashFlowItem } from "@/services/pensionCalculator";
import { calcBasicPension, type BasicPensionPerson } from "@/services/basicPensionCalculator";
import { NPS_RULES, SURVIVOR_OVERLAP_RATE, survivorRateForMonths } from "@/config/npsRules";
import type {
  BasicPensionState,
  NationalPensionState,
  PensionInsuranceState,
  PersonalPensionSavingsState,
  RetirementPensionState,
  SimulationParamsState,
} from "@/store/usePensionStore";

export interface PersonPensions {
  national: NationalPensionState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
}

export type SurvivorChoice = "SURVIVOR" | "OWN_PLUS_30";

export interface PersonYear {
  alive: boolean;
  age: number;
  national: number; // 받는 국민연금 (유족연금 선택 시 유족연금) — 만원/월
  basic: number;
  retirement: number;
  personal: number;
  insurance: number;
  total: number;
  survivorChoice: SurvivorChoice | null; // 배우자 사망 후 중복급여 조정 선택
}

export interface CoupleYear {
  year: number;
  self: PersonYear;
  spouse: PersonYear | null;
  household: number; // 가구 합산 (만원/월)
}

export interface CoupleSimulationResult {
  rows: CoupleYear[];
  firstDeath: { who: "SELF" | "SPOUSE"; year: number; age: number } | null;
  lifetime: { self: number; spouse: number; household: number }; // 생애 누적 수령액 (만원, 명목)
}

const ZERO_BASIC: BasicPensionState = {
  householdType: "SINGLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
};

interface Track {
  startAge: number;
  lifeExpectancy: number;
  flows: Map<number, CashFlowItem>;
  national: NationalPensionState;
}

function track(p: PersonPensions, params: SimulationParamsState): Track {
  // 기초연금은 가구 단위로 따로 계산하므로 개인 시뮬레이션에서는 0으로 둔다
  const sim = runPensionSimulation(p.national, ZERO_BASIC, p.retirementPensions, p.personalPensions, p.pensionInsurances, params);
  return {
    startAge: params.nationalPensionStartAge,
    lifeExpectancy: params.expectedLifeExpectancy,
    flows: new Map(sim.cashFlows.map((cf) => [cf.age, cf])),
    national: p.national,
  };
}

// 사망한 배우자가 살아 있었다면 그 해 받았을 국민연금 (개시 후 물가연동)
function wouldBeNational(t: Track, age: number, inflationRate: number): number {
  const base = t.national.expectedMonthlyPension;
  if (base <= 0) return 0;
  return base * Math.pow(1 + inflationRate / 100, Math.max(0, age - t.startAge));
}

const aShareOf = (n: NationalPensionState) => {
  const A = n.aValue || NPS_RULES.aValue;
  const B = n.bValue || n.currentStandardMonthlyIncome || A;
  return A / (A + B);
};

// 배우자 시뮬레이션용 매개변수: 나이·은퇴·기대수명·국민연금 개시만 배우자 값으로 바꾼다
export function personParams(params: SimulationParamsState, who: "SELF" | "SPOUSE"): SimulationParamsState {
  if (who === "SELF") return params;
  return {
    ...params,
    currentAge: params.spouseAge ?? params.currentAge,
    retirementAge: params.spouseRetirementAge,
    expectedLifeExpectancy: params.spouseLifeExpectancy,
    nationalPensionStartAge: params.spouseNationalPensionStartAge,
  };
}

// 부부 통합 시뮬레이션: 사람별 국민·퇴직·개인연금 흐름 + 가구 기초연금 + 먼저 사망 시 중복급여 조정(국민연금법 제56조)
export function runCoupleSimulation(
  self: PersonPensions,
  spouse: PersonPensions | null,
  params: SimulationParamsState,
  basic: BasicPensionState,
  baseYear: number = new Date().getFullYear()
): CoupleSimulationResult {
  const selfParams = personParams(params, "SELF");
  const spouseParams = personParams(params, "SPOUSE");
  const st = track(self, selfParams);
  const sp = spouse ? track(spouse, spouseParams) : null;
  const selfAge0 = selfParams.currentAge;
  const spouseAge0 = spouseParams.currentAge;
  const horizon = Math.max(
    st.lifeExpectancy - selfAge0,
    sp ? sp.lifeExpectancy - spouseAge0 : 0
  );
  const infl = params.inflationRate;

  const rows: CoupleYear[] = [];
  let firstDeath: CoupleSimulationResult["firstDeath"] = null;
  const lifetime = { self: 0, spouse: 0, household: 0 };

  for (let t = 0; t <= horizon; t++) {
    const year = baseYear + t;
    const index = Math.pow(1 + infl / 100, t);
    const sAge = selfAge0 + t;
    const pAge = spouseAge0 + t;
    const sAlive = sAge <= st.lifeExpectancy;
    const pAlive = !!sp && pAge <= sp.lifeExpectancy;
    if (!firstDeath && sp) {
      if (!sAlive) firstDeath = { who: "SELF", year, age: sAge };
      else if (!pAlive) firstDeath = { who: "SPOUSE", year, age: pAge };
    }

    const own = (tr: Track, age: number, alive: boolean) => {
      const cf = alive ? tr.flows.get(age) : undefined;
      return {
        national: cf?.national ?? 0,
        retirement: cf?.retirement ?? 0,
        personal: cf?.personal ?? 0,
        insurance: cf?.insurance ?? 0,
      };
    };
    const so = own(st, sAge, sAlive);
    const po = sp ? own(sp, pAge, pAlive) : null;

    // 중복급여 조정: 유족연금(사망자 연금 × 가입기간별 40~60%) vs 본인 연금 + 유족연금 30% 중 큰 쪽
    const survivor = (ownNational: number, deceased: Track, deceasedAge: number) => {
      const benefit =
        survivorRateForMonths(deceased.national.expectedTotalContributionMonths) *
        wouldBeNational(deceased, deceasedAge, infl);
      if (benefit <= 0) return { national: ownNational, choice: null as SurvivorChoice | null };
      const withOwn = ownNational + SURVIVOR_OVERLAP_RATE * benefit;
      return benefit > withOwn
        ? { national: benefit, choice: "SURVIVOR" as SurvivorChoice }
        : { national: withOwn, choice: "OWN_PLUS_30" as SurvivorChoice };
    };
    let sNational = so.national;
    let sChoice: SurvivorChoice | null = null;
    let pNational = po?.national ?? 0;
    let pChoice: SurvivorChoice | null = null;
    if (sp && sAlive && !pAlive) ({ national: sNational, choice: sChoice } = survivor(so.national, sp, pAge));
    if (sp && pAlive && !sAlive) ({ national: pNational, choice: pChoice } = survivor(po!.national, st, sAge));

    const person = (alive: boolean, age: number, national: number, earned: number, other: number, occ: boolean, n: NationalPensionState): BasicPensionPerson => ({
      alive,
      age,
      earnedIncome: earned * index,
      otherIncome: other * index,
      nationalPension: national,
      aShare: aShareOf(n),
      occupational: occ,
    });
    const b = calcBasicPension(
      person(sAlive, sAge, sNational, basic.selfEarnedIncome, basic.selfOtherIncome, basic.selfOccupational, self.national),
      sp ? person(pAlive, pAge, pNational, basic.spouseEarnedIncome, basic.spouseOtherIncome, basic.spouseOccupational, spouse!.national) : null,
      {
        region: basic.region,
        generalProperty: basic.generalProperty * index,
        financialAssets: basic.financialAssets * index,
        debts: basic.debts * index,
        luxuryAssets: basic.luxuryAssets * index,
      },
      index
    );

    const mk = (alive: boolean, age: number, national: number, o: ReturnType<typeof own>, basicAmt: number, choice: SurvivorChoice | null): PersonYear => {
      const total = alive ? national + basicAmt + o.retirement + o.personal + o.insurance : 0;
      return { alive, age, national: alive ? national : 0, basic: alive ? basicAmt : 0, retirement: o.retirement, personal: o.personal, insurance: o.insurance, total, survivorChoice: choice };
    };
    const selfYear = mk(sAlive, sAge, sNational, so, b.self, sChoice);
    const spouseYear = sp ? mk(pAlive, pAge, pNational, po!, b.spouse, pChoice) : null;
    const household = selfYear.total + (spouseYear?.total ?? 0);
    lifetime.self += selfYear.total * 12;
    lifetime.spouse += (spouseYear?.total ?? 0) * 12;
    lifetime.household += household * 12;
    rows.push({ year, self: selfYear, spouse: spouseYear, household });
  }
  return { rows, firstDeath, lifetime };
}
```

- [ ] **Step 4: 통과 확인** — `Couple simulation validation success!`, tsc 0, eslint 0

- [ ] **Step 5: Commit** — `feat: 부부 통합 연금 시뮬레이션 엔진 (유족연금 중복급여 조정)`

---

### Task 5: 온보딩 단계 구조 개편 + 기본정보 2열 + 배우자 개시 나이

**Files:** Modify `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: Task 1 `Who`, `pensionsOf`, `simulationParams.spouseRetirementAge/spouseLifeExpectancy/spouseNationalPensionStartAge`
- Produces: 컴포넌트 안의 `visibleSteps`, `stepIndex`, `step`, `who`, `person` (Task 6~8이 사용)

- [ ] **Step 1: STEPS 교체** — 상단 `const STEPS = [...]`를 아래로 교체하고 store import를 `import { usePensionStore, pensionsOf, type Who } from "@/store/usePensionStore";`로 바꾼다.

```tsx
type StepKind = "INFO" | "NATIONAL" | "BASIC" | "RETIREMENT" | "PERSONAL" | "SETTINGS";

interface StepDef {
  key: string;
  kind: StepKind;
  who: Who;
  badge: string; // 사이드바·헤더에 보이는 층 번호
  title: string;
  desc: string;
  spouseOnly?: boolean; // 배우자 있음일 때만 표시
}

const STEPS: StepDef[] = [
  { key: "info", kind: "INFO", who: "SELF", badge: "0", title: "기본 정보 & 재무 목표", desc: "본인·배우자 정보 및 은퇴 생활비 목표 등" },
  { key: "national-self", kind: "NATIONAL", who: "SELF", badge: "1", title: "국민연금 (1층, 본인)", desc: "국민연금 납부 내역·예상액·반납·추납" },
  { key: "national-spouse", kind: "NATIONAL", who: "SPOUSE", badge: "1", title: "국민연금 (1층, 배우자)", desc: "미입력 시 진단에서 제외", spouseOnly: true },
  { key: "basic", kind: "BASIC", who: "SELF", badge: "1", title: "기초연금 (1층, 본인/배우자)", desc: "가구 재산·소득으로 수급 판정" },
  { key: "retirement-self", kind: "RETIREMENT", who: "SELF", badge: "2", title: "퇴직연금 (2층, 본인)", desc: "회사 퇴직연금 (DB/DC/IRP), 미입력 시 제외" },
  { key: "retirement-spouse", kind: "RETIREMENT", who: "SPOUSE", badge: "2", title: "퇴직연금 (2층, 배우자)", desc: "미입력 시 진단에서 제외", spouseOnly: true },
  { key: "personal-self", kind: "PERSONAL", who: "SELF", badge: "3", title: "개인연금 (3층, 본인)", desc: "연금저축 및 연금보험, 미입력 시 제외" },
  { key: "personal-spouse", kind: "PERSONAL", who: "SPOUSE", badge: "3", title: "개인연금 (3층, 배우자)", desc: "미입력 시 진단에서 제외", spouseOnly: true },
  { key: "settings", kind: "SETTINGS", who: "SELF", badge: "4", title: "기타 시뮬레이션 설정", desc: "물가상승률 및 국민연금 개시 연령 설정" },
];
```

- [ ] **Step 2: 현재 단계 계산을 컴포넌트 상단으로** — `const [currentStep, setCurrentStep] = useState(0);` 바로 아래(핸들러 정의보다 먼저)에 추가. `const store = usePensionStore();`가 이보다 위에 있어야 한다.

```tsx
  // 배우자 없음이면 배우자 단계는 숨긴다. currentStep은 visibleSteps의 인덱스
  const visibleSteps = STEPS.filter((s) => !s.spouseOnly || store.simulationParams.hasSpouse);
  const lastStepIndex = visibleSteps.length - 1;
  const stepIndex = Math.min(currentStep, lastStepIndex);
  const step = visibleSteps[stepIndex];
  const who = step.who;
  const person = pensionsOf(store, who);
```

- [ ] **Step 3: 단계 인덱스 사용처 교체** (내용으로 찾아 바꾼다)
  - `nextStep`: `if (currentStep < 5) setCurrentStep(currentStep + 1);` → `if (stepIndex < lastStepIndex) setCurrentStep(stepIndex + 1);`
  - `prevStep`: `if (currentStep > 0) setCurrentStep(currentStep - 1);` → `if (stepIndex > 0) setCurrentStep(stepIndex - 1);`
  - 진행률 두 곳 `currentStep / 5` → `stepIndex / lastStepIndex`
  - 사이드바 `STEPS.map((step) => {` → `visibleSteps.map((s, i) => {`, 블록 안: `isActive = i === stepIndex`, `isCompleted = i < stepIndex`, `key={s.key}`, `onClick={() => setCurrentStep(i)}`, 원 안 `{isCompleted ? "✓" : s.badge}`, 제목·설명 `s.title`/`s.desc`
  - 헤더: `STEP {currentStep}` → `STEP {step.badge}`, `STEPS[currentStep].title` → `step.title`, `.desc` → `step.desc`
  - 본문 조건: `currentStep === 0` → `step.kind === "INFO"`, `=== 1` → `"NATIONAL"`, `=== 2` → `"BASIC"`, `=== 3` → `"RETIREMENT"`, `=== 4` → `"PERSONAL"`, `=== 5` → `"SETTINGS"`
  - 하단 버튼: 이전 버튼 `disabled`/`opacity`/`cursor`의 `currentStep === 1` → `stepIndex === 0` (기존에는 1단계에서 이전이 막혀 기본정보로 돌아갈 수 없었다), `currentStep < 5 ?` → `stepIndex < lastStepIndex ?`
  - 확인: `grep -n "currentStep" src/app/onboarding/page.tsx` 결과가 useState 선언·`stepIndex` 계산·`setCurrentStep` 호출뿐

- [ ] **Step 4: 기본 정보 2열** — `step.kind === "INFO"` 블록의 「1. 본인 및 가족 정보」를 다음 순서로 재배치(기존 입력 JSX·핸들러를 옮기고 새 입력 2개만 추가):
  1. 배우자 유무 라디오 (기존 그대로, 단독 행)
  2. `<div style={store.simulationParams.hasSpouse ? styles.fieldGrid : undefined}>` 안에
     - 왼쪽 열 `<div style={styles.formGroupList}>` + `<h4 style={styles.label}>본인</h4>`: 기존 「현재나이」, 「희망 은퇴 나이」(라벨을 「은퇴 예상 나이」로), 「예상 기대 수명」
     - 오른쪽 열(배우자 있음일 때만) + `<h4 style={styles.label}>배우자</h4>`: 기존 「배우자 현재나이」 + 새 입력 2개
```tsx
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>
                          배우자 은퇴 예상 나이 <span style={styles.labelHint}>(세)</span>
                        </label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.simulationParams.spouseRetirementAge || ""}
                          onChange={(e) => store.setSimulationParams({ spouseRetirementAge: Number(e.target.value) })}
                        />
                      </div>
                      <div style={styles.fieldRow}>
                        <label style={styles.label}>
                          배우자 기대 수명 <span style={styles.labelHint}>(세)</span>
                        </label>
                        <input
                          type="number"
                          className="premium-input"
                          value={store.simulationParams.spouseLifeExpectancy || ""}
                          onChange={(e) => store.setSimulationParams({ spouseLifeExpectancy: Number(e.target.value) })}
                        />
                      </div>
```
  3. 그 아래 기존 「자녀 수」·「자녀나이」 그리드 (그대로)

- [ ] **Step 5: 배우자 국민연금 개시 나이** — `step.kind === "SETTINGS"` 블록의 「국민연금 수령 개시 연령 (세)」 입력 필드 바로 뒤(같은 부모 안)에:
```tsx
                {store.simulationParams.hasSpouse && (
                  <div style={styles.fieldRow}>
                    <label style={styles.label}>배우자 국민연금 수령 개시 연령 (세)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={store.simulationParams.spouseNationalPensionStartAge}
                      onChange={(e) => store.setSimulationParams({ spouseNationalPensionStartAge: Number(e.target.value) })}
                    />
                  </div>
                )}
```

- [ ] **Step 6: 확인** — tsc 0, `npx eslint src/app/onboarding/page.tsx` ≤ 15 (이 단계에서는 배우자 단계가 아직 본인 데이터를 보여 줄 수 있다 — Task 6에서 바인딩)

- [ ] **Step 7: Commit** — `feat: 진단 단계를 본인/배우자 층별로 재구성하고 기본정보 2열 입력`

---

### Task 6: 사람별 입력 바인딩 + 반납 섹션

**Files:** Create `src/components/ReturnRepaymentSection.tsx`; Modify `src/components/AdditionalPaymentPanel.tsx`, `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: Task 1 (`who` 액션, `pensionsOf`), Task 2 (`calcRepaymentCost, compareRefundScenarios, isRepaymentReady`, `maxRefundInstallments`), Task 4 (`personParams`), Task 5 (`who`, `person`)
- Produces: `ReturnRepaymentSection({ who })`, `AdditionalPaymentPanel({ who? })`

- [ ] **Step 1: 반납 섹션 컴포넌트** — `src/components/ReturnRepaymentSection.tsx`

```tsx
"use client";

import React from "react";
import { usePensionStore, pensionsOf, type ReturnRepaymentState, type Who } from "@/store/usePensionStore";
import {
  calcRepaymentCost,
  compareRefundScenarios,
  isRepaymentReady,
} from "@/services/returnRepaymentCalculator";
import { personParams } from "@/services/coupleSimulation";
import { maxRefundInstallments } from "@/config/npsRules";

const fmt = (v: number) => Math.round(v).toLocaleString();

// 반환일시금 반납 입력 + 대안 D(현행)·B(반납)·C(추납)·A(반납+추납) 비교
export default function ReturnRepaymentSection({ who }: { who: Who }) {
  const store = usePensionStore();
  const person = pensionsOf(store, who);
  const rr = person.returnRepayment;
  const params = personParams(store.simulationParams, who);
  const set = (data: Partial<ReturnRepaymentState>) => store.setReturnRepayment(data, who);
  const ready = isRepaymentReady(rr);
  const cost = ready ? calcRepaymentCost(rr) : null;
  const scenarios = compareRefundScenarios(person.nationalPension, rr, person.additionalPayment, params);
  const maxInstallments = maxRefundInstallments(rr.restoredMonths);
  const best = Math.max(...scenarios.map((s) => s.gainAtLifeExpectancy));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={styles.sectionTitle}>⑤ 반환일시금 반납</h4>
      <div style={styles.infoAlert}>
        💡 예전에 받은 반환일시금을 이자와 함께 돌려주면 그 가입기간이 <strong>당시 소득대체율 그대로</strong> 되살아납니다
        (1988~1998년 가입분은 70%). 공단 반납 고지액을 입력하면 그 금액을, 비워 두면 공단 고시 연도별 정기예금 이자율로 추정합니다.
      </div>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 원금 (만원)</label>
          <input type="number" min={0} className="premium-input" value={rr.refundAmount || ""}
            onChange={(e) => set({ refundAmount: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 수령년월</label>
          <input type="month" className="premium-input" value={rr.refundYm}
            onChange={(e) => set({ refundYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>복원 가입기간 (개월)</label>
          <input type="number" min={0} className="premium-input" value={rr.restoredMonths || ""}
            onChange={(e) => set({ restoredMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>복원 기간 시작년월 <span style={styles.labelHint}>(당시 가입 시작, 소득대체율 판정)</span></label>
          <input type="month" className="premium-input" value={rr.periodStartYm}
            onChange={(e) => set({ periodStartYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>공단 반납 고지액 (만원) <span style={styles.labelHint}>(모르면 비워 두세요 · ☎1355 조회)</span></label>
          <input type="number" min={0} className="premium-input" value={rr.noticeAmount || ""}
            onChange={(e) => set({ noticeAmount: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반납 신청년월</label>
          <input type="month" className="premium-input" value={rr.applyYm}
            onChange={(e) => set({ applyYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>분할 횟수 <span style={styles.labelHint}>(1 = 일시납, 최대 {maxInstallments}회)</span></label>
          <input type="number" min={1} step={1} className="premium-input" value={rr.installments || ""}
            onChange={(e) => set({ installments: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>대시보드 시뮬레이션에 반영</label>
          <select className="premium-input" value={rr.applyToSimulation ? "Y" : "N"}
            onChange={(e) => set({ applyToSimulation: e.target.value === "Y" })}>
            <option value="N">반영 안 함</option>
            <option value="Y">반납 후 연금액으로 반영</option>
          </select>
        </div>
      </div>

      {cost && (
        <div style={styles.previewBox}>
          <div style={styles.previewGrid}>
            <div>반납금: <strong>{fmt(cost.lumpSum)} 만원</strong> ({cost.source === "NOTICE" ? "공단 고지액" : `원금 ${fmt(cost.principal)}만원 + 이자 추정`})</div>
            <div>분할 {cost.installments}회 추가 이자: <strong>{fmt(cost.installmentInterest)} 만원</strong> → 총 <strong>{fmt(cost.total)} 만원</strong></div>
          </div>
        </div>
      )}

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>대안별 비교 (D 현행 · B 반납 · C 추납 · A 반납+추납)</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>대안</th>
                <th style={styles.th}>가입기간</th>
                <th style={styles.th}>추가 납부액</th>
                <th style={styles.th}>생애 총 납부보험료</th>
                <th style={styles.th}>예상 월 연금</th>
                <th style={styles.th}>총원금 회수 나이</th>
                <th style={styles.th}>추가분 회수 나이</th>
                <th style={styles.th}>기대수명({params.expectedLifeExpectancy}세)까지 순이익</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} style={s.gainAtLifeExpectancy === best ? styles.bestRow : undefined}>
                  <td style={styles.td}>{s.id} · {s.label}</td>
                  <td style={styles.td}>{s.totalMonths}개월 {s.addedMonths > 0 && `(+${s.addedMonths})`}</td>
                  <td style={styles.td}>{fmt(s.extraCost)} 만원</td>
                  <td style={styles.td}>{fmt(s.lifetimePremium)} 만원</td>
                  <td style={styles.td}>{s.monthly.toFixed(1)} 만원 {s.delta > 0 && `(+${s.delta.toFixed(1)})`}</td>
                  <td style={styles.td}>{s.recoverAgeTotal === null ? "-" : `${s.recoverAgeTotal}세`}</td>
                  <td style={styles.td}>{s.recoverAgeExtra === null ? "-" : `${s.recoverAgeExtra}세`}</td>
                  <td style={styles.td}>{fmt(s.gainAtLifeExpectancy)} 만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          생애 총 납부보험료 = 「NPS 공단고서 상세 입력」의 총 예상 납부보험료 + 추가 납부액. 추납(C·A)은 위 ①~④ 추납 입력을 그대로 씁니다.
          반납 복원 기간의 소득은 본인 평균소득(B값)과 같다고 가정한 현재가치 추정치이며, 정확한 금액은 국민연금공단(☎1355)에서 확인하세요.
        </p>
        {!ready && <p style={styles.note}>반납 원금·수령년월·복원 개월수·복원 시작년월·신청년월을 모두 입력하면 B·A 대안이 계산됩니다.</p>}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" },
  fieldRow: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" },
  labelHint: { fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" },
  previewBox: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
  },
  previewTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px" },
  previewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  bestRow: { backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: 600 },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
};
```

- [ ] **Step 2: AdditionalPaymentPanel에 `who`**
  - import: `import { usePensionStore, pensionsOf, AdditionalPaymentState, type Who } from "@/store/usePensionStore";`, `import { personParams } from "@/services/coupleSimulation";`, `import ReturnRepaymentSection from "@/components/ReturnRepaymentSection";`
  - 시그니처·상단:
```tsx
export default function AdditionalPaymentPanel({ who = "SELF" }: { who?: Who }) {
  const store = usePensionStore();
  const person = pensionsOf(store, who);
  const national = person.nationalPension;
  const params = personParams(store.simulationParams, who);
  const ap = person.additionalPayment;
  const set = (data: Partial<AdditionalPaymentState>) => store.setAdditionalPayment(data, who);
  const plan = runAdditionalPaymentPlan(ap, national, params);
```
  - 나머지 `store.nationalPension` → `national`, `store.simulationParams` → `params` (기대수명 표시 포함)
  - 최상위 컨테이너의 닫는 `</div>` 바로 앞(Insights 렌더 줄 다음)에 `<ReturnRepaymentSection who={who} />`
  - 확인: `grep -n "store\.nationalPension\|store\.additionalPayment\|store\.simulationParams" src/components/AdditionalPaymentPanel.tsx` → 결과 없음

- [ ] **Step 3: 온보딩 사람별 바인딩** — `step.kind`가 `NATIONAL`·`RETIREMENT`·`PERSONAL`인 블록 안과 PDF·NPS 동기화 결과를 스토어에 쓰는 핸들러(`handlePdfUpload`, 동기화 콜백)에서:
  - 읽기: `store.nationalPension` → `person.nationalPension`, `store.retirementPensions` → `person.retirementPensions`, `store.personalPensions` → `person.personalPensions`, `store.pensionInsurances` → `person.pensionInsurances`
  - 쓰기: `store.setNationalPension(x)` → `store.setNationalPension(x, who)`, `store.add/update/delete/setRetirementPension(s)(…)`·`…PersonalPension(s)(…)`·`…PensionInsurance(s)(…)` 호출에 마지막 인자 `who` 추가
  - `<AdditionalPaymentPanel />` → `<AdditionalPaymentPanel who={who} />`
  - 이 범위 밖(기본정보, 기타 설정, `handleSaveData`, `handleFinish`의 API 전송)은 본인 데이터 그대로
  - 확인: `grep -n "store\.nationalPension\|store\.retirementPensions\|store\.personalPensions\|store\.pensionInsurances" src/app/onboarding/page.tsx` 결과가 모두 위 범위 밖임을 줄 번호로 보고서에 적는다

- [ ] **Step 4: 확인** — tsc 0, eslint 새 컴포넌트 0·Panel 0·onboarding ≤ 15, `npx tsx scratch/validateAdditionalPayment.ts` 성공

- [ ] **Step 5: Commit** — `feat: 배우자 국민·퇴직·개인연금 입력 및 반환일시금 반납 대안 비교`

---

### Task 7: 국민연금 가입내역조회 PDF 업로드 → 반납·추납·예상연금 자동 입력

**Files:**
- Create: `src/services/npsHistoryParser.ts`, `src/utils/pdfText.ts`, `src/components/NpsHistoryUpload.tsx`
- Modify: `src/components/AdditionalPaymentPanel.tsx`, `src/app/onboarding/page.tsx` (`handlePdfUpload`의 텍스트 추출)
- Test: `scratch/validateNpsHistory.ts` (가상 데이터 픽스처 — 실제 PDF·텍스트는 저장소에 넣지 않는다)

**Interfaces:**
- Consumes: Task 1 (`setAdditionalPayment/setReturnRepayment/setNationalPension(…, who)`), 기존 `monthsBetween`
- Produces: `parseNpsHistoryText(text): NpsHistoryParsed`, `deriveFromNpsHistory(parsed): NpsHistoryDerived`, 타입 `NpsHistoryRow`/`NpsHistoryKind`; `extractPdfText(file)`; `NpsHistoryUpload({ who })`

- [ ] **Step 1: 실패하는 검증 스크립트** — `scratch/validateNpsHistory.ts`

```ts
import assert from "node:assert/strict";
import { parseNpsHistoryText, deriveFromNpsHistory } from "../src/services/npsHistoryParser";

// 가상의 가입내역조회 화면 출력 PDF 텍스트 (pdfjs 추출 형식을 본뜸, 실제 개인정보 아님)
const FOOTER =
  "26. 9. 27. 오전 10:00 전자민원 > 개인 > 조회 > 가입내역 · 예상연금 > 가입내역조회 - 국민을 튼튼하게 연금을 튼튼하게 https://www.nps.or.kr/elctcvlcpt/inquiry/getOHAC0001M0.do?menuId=MN24001035 2/4";
const HEADER =
  "정렬 역순 조회년월 연금보험료 상세내역 1988-01 ~ 2026-09 기간 기준소득월액 납부한 보험료 납부하지 않은 보험료 가입자의 종류 비고 월수 금액 월수 금액";

// A: 사업장 → 납부예외(경계 겹침) → 지역가입 중, 반환일시금 없음, 예상연금 있음
const sampleA = [
  "가입내역조회 홍길동 고객님의 예상연금액, 보험료 총 납부내역 및 기간별 상세내역입니다. 2026년 09월 27일 (10:00) 조회일",
  "총 가입기간 월수 308개월 금액 90,000,000원 총 가입기간은 연금보험료, 추납보험료, 반납금 … 합산기간입니다.",
  "총 납부내역 납부한 연금보험료 (반환일시금 지급내역 포함) 90,000,000원 (308개월) 납부하지 않은 연금보험료 475,000원 (1개월)",
  "반납금 납부액 0원 추납보험료 납부액 (개월) 0원 (0) 반환일시금 지급내역 반환일시금 총 지급기간 0개월 반환일시금 총 지급액 0원",
  FOOTER,
  HEADER,
  "2000-01 ~ 2000-12 1,000,000원 12개월 1,080,000원 0개월 0원 사업장 (주)가나다",
  "2001-01 ~ 2001-06 1,000,000원 0개월 0원 0개월 0원 사업장 납부예외",
  "2001-06 ~ 2001-12 1,000,000원 0개월 0원 0개월 0원 사업장 납부예외",
  FOOTER,
  "2002-01 ~ 2026-08 5,000,000원 296개월 88,800,000 원 0개월 0원 지역 지역",
  "2026-09 ~ 2026-09 5,000,000원 0개월 0원 1개월 475,000원 지역 지역",
  "예상연금월액(노령연금) 수급자는 ［ 월별지급내역 ］ 을 조회하시기 바랍니다. ※ 예상연금액(현재가치 기준) 2033년 01월부터 매월 1,500,000원 (연 18,000,000원) 수령예상",
  "총 예상가입기간(납부월수) 2000년 01월 ~ 2030년 12월(총360개월 ) 총 예상납부보험료 120,000,000원 (현재가치로 산정된 연금액 계산내역입니다.)",
  "연금계산내역(노령연금) 총 가입개월 360개월 총 납부보험료 120,000,000원 지급률 100% 기본연금액 18,000,000원 A값 3,193,511원 B값 4,500,000원 ? ?",
  FOOTER,
].join("\n");

const a = parseNpsHistoryText(sampleA);
assert.equal(a.inquiryYm, "2026-09");
assert.equal(a.rows.length, 5);
assert.equal(a.rows[3].paidAmount, 8880); // 줄바꿈으로 갈라진 "88,800,000 원"
assert.equal(a.rows[3].kind, "REGIONAL");
assert.equal(a.rows[1].note, "납부예외");
assert.equal(a.totalMonths, 308);
assert.equal(a.totalAmount, 9000);
assert.equal(a.refundMonths, 0);
assert.deepEqual(a.expected, { startYm: "2033-01", monthlyPension: 150, totalMonths: 360, totalPremium: 12000, aValue: 319.3511, bValue: 450 });

const da = deriveFromNpsHistory(a);
assert.deepEqual(da.additionalPayment, {
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  firstEnrollYm: "2000-01",
  resumeYm: "2002-01",
  baseIncome: 500,
  gapMonths: 12, // 2001-01~2001-12 (경계 2001-06 중복 제거)
  gapReason: "EXEMPT",
  requestedMonths: 12,
});
assert.deepEqual(da.returnRepayment, {});
assert.deepEqual(da.national, {
  contributionMonths: 308,
  totalPaidAmount: 9000,
  currentStandardMonthlyIncome: 500,
  expectedMonthlyPension: 150,
  expectedTotalContributionMonths: 360,
  totalExpectedPremium: 12000,
  aValue: 319.3511,
  bValue: 450,
});
assert.ok(!da.notes.some((n) => n.includes("체납"))); // 조회월 미납은 체납 아님

// B: 반환일시금(앞 24개월) → 긴 미가입 → 임의가입 중, 중간 체납 1개월, 추납 10개월 이미 납부, 예상연금 없음
const sampleB = [
  "가입내역조회 김영희 고객님의 … 2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 127개월 금액 12,000,000원",
  "납부한 연금보험료 (반환일시금 지급내역 포함) 12,800,000원 (151개월) 반납금 납부액 0원 추납보험료 납부액 (개월) 1,000,000원 (10)",
  "반환일시금 지급내역 반환일시금 총 지급기간 24개월 반환일시금 총 지급액 800,000원",
  HEADER,
  "1990-01 ~ 1991-12 400,000원 24개월 800,000원 0개월 0원 사업장 (주)라마바",
  "1992-01 ~ 1992-06 400,000원 6개월 200,000원 0개월 0원 사업장 (주)라마바",
  "2016-01 ~ 2020-04 1,000,000원 52개월 4,680,000원 0개월 0원 임의 임의",
  "2020-05 ~ 2020-05 1,000,000원 0개월 0원 1개월 90,000원 임의 임의",
  "2020-06 ~ 2026-08 1,000,000원 75개월 6,750,000원 0개월 0원 임의 임의",
  "2026-09 ~ 2026-09 1,000,000원 0개월 0원 1개월 95,000원 임의 임의",
].join("\n");

const b = parseNpsHistoryText(sampleB);
assert.equal(b.rows.length, 6);
assert.equal(b.refundMonths, 24);
assert.equal(b.refundAmount, 80);
assert.equal(b.additionalPaidMonths, 10);
assert.equal(b.expected, null);

const db = deriveFromNpsHistory(b);
assert.equal(db.additionalPayment.enrollStatus, "VOLUNTARY");
assert.equal(db.additionalPayment.firstEnrollYm, "1990-01");
assert.equal(db.additionalPayment.resumeYm, "2016-01");
assert.equal(db.additionalPayment.gapMonths, 191); // 1999-04~2015-12 = 201개월 − 이미 추납 10개월
assert.equal(db.additionalPayment.gapReason, "EXCLUDED");
assert.equal(db.additionalPayment.requestedMonths, 119);
assert.equal(db.additionalPayment.receivedLumpSumRefund, true);
assert.deepEqual(db.returnRepayment, { refundAmount: 80, restoredMonths: 24, periodStartYm: "1990-01", refundYm: "1992-01" });
assert.equal(db.national.expectedMonthlyPension, undefined);
assert.ok(db.notes.some((n) => n.includes("미납(체납) 1개월")));
assert.ok(db.notes.some((n) => n.includes("이미 추납한 10개월")));

// 가입이 끝난(상실) 경우: 가입 중이 아님 → NONE
const dc = deriveFromNpsHistory(
  parseNpsHistoryText(`2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 12개월 금액 1,000,000원 ${HEADER} 2010-01 ~ 2010-12 1,000,000원 12개월 1,000,000원 0개월 0원 지역 지역`)
);
assert.equal(dc.additionalPayment.enrollStatus, "NONE");
assert.equal(dc.additionalPayment.resumeYm, undefined);
assert.ok(dc.notes.some((n) => n.includes("현재 가입 중인 기록이 없습니다")));

// 가입내역조회가 아닌 PDF
const none = parseNpsHistoryText("금융감독원 통합연금포털 연금 조회 결과");
assert.equal(none.rows.length, 0);
assert.equal(none.totalMonths, null);

console.log("NPS history validation success!");
```

- [ ] **Step 2: 실패 확인** — FAIL (모듈 없음)

- [ ] **Step 3: 파서** — `src/services/npsHistoryParser.ts` (§0.3 형식 규칙 그대로)

```ts
import { monthsBetween } from "@/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  EnrollStatus,
  NationalPensionState,
  ReturnRepaymentState,
} from "@/store/usePensionStore";

// 국민연금공단 「전자민원 > 조회 > 가입내역조회」 화면을 인쇄 → PDF로 저장한 파일의 텍스트를 읽는다.
// (증명서 발급 PDF는 암호화되어 텍스트를 읽을 수 없다)

export type NpsHistoryKind = "WORKPLACE" | "REGIONAL" | "VOLUNTARY" | "VOLUNTARY_CONT" | "OTHER";

export interface NpsHistoryRow {
  startYm: string; // "YYYY-MM"
  endYm: string;
  standardIncome: number; // 기준소득월액 (만원)
  paidMonths: number; // 납부한 보험료 월수
  paidAmount: number; // 납부한 보험료 (만원)
  unpaidMonths: number; // 납부하지 않은 보험료 월수
  kind: NpsHistoryKind; // 가입자의 종류
  note: string; // 비고 (사업장명, "납부예외" 등)
}

export interface NpsHistoryParsed {
  inquiryYm: string | null; // 조회일 년월
  rows: NpsHistoryRow[];
  totalMonths: number | null; // 총 가입기간 월수
  totalAmount: number | null; // 총 가입기간 금액 (만원)
  refundMonths: number; // 반환일시금 총 지급기간
  refundAmount: number; // 반환일시금 총 지급액 (만원)
  repaidAmount: number; // 반납금 납부액 (만원)
  additionalPaidMonths: number; // 이미 낸 추납 월수
  expected: {
    startYm: string; // 예상연금 수령 개시 년월
    monthlyPension: number; // 예상연금월액 (만원, 현재가치)
    totalMonths: number; // 총 예상가입기간
    totalPremium: number; // 총 예상납부보험료 (만원)
    aValue: number;
    bValue: number;
  } | null;
}

const won = (s: string) => Number(s.replace(/,/g, "")) / 10000; // 원 → 만원
const KIND: Record<string, NpsHistoryKind> = { 사업장: "WORKPLACE", 지역: "REGIONAL", 임의: "VOLUNTARY", 임의계속: "VOLUNTARY_CONT" };

export function parseNpsHistoryText(raw: string): NpsHistoryParsed {
  const text = raw
    .replace(/\s+/g, " ")
    // 페이지 머리·꼬리 (예: "26. 9. 27. 오후 7:55 전자민원 > … 3/5")
    .replace(/\d{2}\. ?\d{1,2}\. ?\d{1,2}\. 오[전후] \d{1,2}:\d{2} 전자민원 .*?\d+\/\d+/g, " ")
    // 줄바꿈으로 갈라진 금액 (예: "34,020,000 원")
    .replace(/(\d) 원/g, "$1원")
    .replace(/\s+/g, " ");

  const inquiry = text.match(/(\d{4})년 (\d{2})월 \d{2}일/);
  const total = text.match(/총 가입기간 월수 ([\d,]+)개월 금액 ([\d,]+)원/);
  const refund = text.match(/반환일시금 총 지급기간 (\d+)개월 반환일시금 총 지급액 ([\d,]+)원/);
  const repaid = text.match(/반납금 납부액 ([\d,]+)원/);
  const added = text.match(/추납보험료 납부액 \(개월\) [\d,]+원 \((\d+)\)/);
  const start = text.match(/(\d{4})년 (\d{2})월부터 매월 ([\d,]+)원/);
  const expTotal = text.match(/총 예상가입기간\(납부월수\) .*?\(총 ?(\d+)개월/);
  const expPremium = text.match(/총 예상납부보험료 ([\d,]+)원/);
  const ab = text.match(/A값 ([\d,]+)원 B값 ([\d,]+)원/);

  const rows: NpsHistoryRow[] = [];
  const rowRe =
    /(\d{4}-\d{2}) ~ (\d{4}-\d{2}) ([\d,]+)원 (\d+)개월 ([\d,]+)원 (\d+)개월 [\d,]+원 (\S+) (.*?)(?= \d{4}-\d{2} ~ \d{4}-\d{2} [\d,]+원| 예상연금월액|$)/g;
  for (const m of text.matchAll(rowRe)) {
    rows.push({
      startYm: m[1],
      endYm: m[2],
      standardIncome: won(m[3]),
      paidMonths: Number(m[4]),
      paidAmount: won(m[5]),
      unpaidMonths: Number(m[6]),
      kind: KIND[m[7]] ?? "OTHER",
      note: m[8].trim(),
    });
  }

  return {
    inquiryYm: inquiry ? `${inquiry[1]}-${inquiry[2]}` : null,
    rows,
    totalMonths: total ? Number(total[1].replace(/,/g, "")) : null,
    totalAmount: total ? won(total[2]) : null,
    refundMonths: refund ? Number(refund[1]) : 0,
    refundAmount: refund ? won(refund[2]) : 0,
    repaidAmount: repaid ? won(repaid[1]) : 0,
    additionalPaidMonths: added ? Number(added[1]) : 0,
    expected:
      start && expTotal && expPremium && ab
        ? {
            startYm: `${start[1]}-${start[2]}`,
            monthlyPension: won(start[3]),
            totalMonths: Number(expTotal[1]),
            totalPremium: won(expPremium[1]),
            aValue: won(ab[1]),
            bValue: won(ab[2]),
          }
        : null,
  };
}

export interface NpsHistoryDerived {
  additionalPayment: Partial<AdditionalPaymentState>;
  returnRepayment: Partial<ReturnRepaymentState>;
  national: Partial<NationalPensionState>;
  notes: string[];
}

// 무소득배우자 등 적용제외 기간은 1999-04 이후만 추납 대상
const EXCLUDED_ALLOWED_FROM = "1999-04";

function addMonth(ym: string, n = 1): string {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

// 기간 행들이 덮는 년월 집합 (행 경계가 겹쳐도 한 번만 센다)
function monthSet(rows: NpsHistoryRow[]): Set<string> {
  const set = new Set<string>();
  rows.forEach((r) => {
    for (let ym = r.startYm; ym <= r.endYm; ym = addMonth(ym)) set.add(ym);
  });
  return set;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const round4 = (v: number) => Math.round(v * 10000) / 10000;

// 가입내역에서 추납·반납·국민연금 입력값을 만든다
export function deriveFromNpsHistory(p: NpsHistoryParsed): NpsHistoryDerived {
  const notes: string[] = [];
  const rows = [...p.rows].sort((a, b) => (a.startYm < b.startYm ? -1 : 1));
  const isExempt = (r: NpsHistoryRow) => r.paidMonths === 0 && r.note.includes("납부예외");
  const paying = rows.filter((r) => !isExempt(r));

  // 현재 가입 상태: 마지막 행이 조회월(또는 전월)까지 이어지면 가입 중
  const last = rows[rows.length - 1];
  const ongoing = !!last && !!p.inquiryYm && last.endYm >= addMonth(p.inquiryYm, -1);
  const enrollStatus: EnrollStatus = ongoing && !isExempt(last) ? (last.kind === "OTHER" ? "REGIONAL" : last.kind) : "NONE";

  // 지속 가입개시: 마지막 행에서 거꾸로, 끊김 없이 이어진 납부 구간의 시작
  let resumeYm: string | undefined;
  if (ongoing && paying.length > 0) {
    let i = rows.length - 1;
    while (i > 0 && !isExempt(rows[i - 1]) && addMonth(rows[i - 1].endYm) >= rows[i].startYm) i--;
    resumeYm = rows[i].startYm;
  }

  // 추납 공백: 납부예외 행 + 행 사이 빈 기간(적용제외로 보고 1999-04 이후만)
  const exemptMonths = monthSet(rows.filter(isExempt)).size;
  let excludedMonths = 0;
  if (rows.length > 0) {
    const covered = monthSet(rows);
    for (let ym = rows[0].startYm; ym <= last.endYm; ym = addMonth(ym)) {
      if (!covered.has(ym) && ym >= EXCLUDED_ALLOWED_FROM) excludedMonths++;
    }
  }
  const gapMonths = Math.max(0, exemptMonths + excludedMonths - p.additionalPaidMonths);

  const additionalPayment: Partial<AdditionalPaymentState> = {
    enrollStatus,
    receivedLumpSumRefund: p.refundMonths > 0 && p.repaidAmount === 0,
  };
  if (rows.length > 0) additionalPayment.firstEnrollYm = rows[0].startYm;
  if (resumeYm) additionalPayment.resumeYm = resumeYm;
  if (last) additionalPayment.baseIncome = last.standardIncome;
  if (gapMonths > 0) {
    additionalPayment.gapMonths = gapMonths;
    additionalPayment.gapReason = exemptMonths >= excludedMonths ? "EXEMPT" : "EXCLUDED";
    additionalPayment.requestedMonths = Math.min(gapMonths, 119);
    notes.push(`추납 가능 공백 ${gapMonths}개월 (납부예외 ${exemptMonths}개월, 가입 기록 없는 기간 ${excludedMonths}개월 — 1999년 4월 이후만)`);
    if (excludedMonths > 0) notes.push("가입 기록이 없는 기간은 무소득배우자 등 적용제외로 가정했습니다. 실제 사유를 확인하세요.");
    if (p.additionalPaidMonths > 0) notes.push(`이미 추납한 ${p.additionalPaidMonths}개월을 뺐습니다.`);
  } else {
    notes.push("추납할 수 있는 공백 기간이 없습니다.");
  }
  if (!ongoing) notes.push("현재 가입 중인 기록이 없습니다. 추납은 가입 중(소득신고·임의가입)에만 신청할 수 있습니다.");
  const overdue = rows.filter((r) => r.unpaidMonths > 0 && r.endYm !== p.inquiryYm).reduce((s, r) => s + r.unpaidMonths, 0);
  if (overdue > 0) notes.push(`미납(체납) ${overdue}개월은 추납 대상이 아니며 연체 납부로 처리해야 합니다.`);

  // 반환일시금: 금액·개월수만 표시되므로 가장 이른 납부 기간부터 그 개월수만큼을 반환 기간으로 본다
  const returnRepayment: Partial<ReturnRepaymentState> = {};
  if (p.refundMonths > 0 && p.repaidAmount === 0) {
    let acc = 0;
    let endYm = "";
    for (const r of paying) {
      acc += r.paidMonths;
      endYm = r.endYm;
      if (acc >= p.refundMonths) break;
    }
    returnRepayment.refundAmount = round1(p.refundAmount);
    returnRepayment.restoredMonths = p.refundMonths;
    if (paying.length > 0) {
      returnRepayment.periodStartYm = paying[0].startYm;
      returnRepayment.refundYm = addMonth(endYm);
    }
    notes.push(
      `반환일시금 ${round1(p.refundAmount).toLocaleString()}만원 (${p.refundMonths}개월, ${paying[0]?.startYm ?? "?"} ~ ${endYm || "?"} 추정) — 반납하면 이 기간이 복원됩니다.`
    );
    notes.push("반환일시금 수령년월은 PDF에 없어 반환 기간 다음 달로 넣었습니다. 실제 수령년월(또는 공단 반납 고지액)을 확인하세요.");
  } else if (p.refundMonths > 0) {
    notes.push("반납금 납부 기록이 있어 반환일시금은 이미 반납한 것으로 보고 반납 입력을 채우지 않았습니다.");
  }

  const national: Partial<NationalPensionState> = {};
  if (p.totalMonths !== null) national.contributionMonths = p.totalMonths;
  if (p.totalAmount !== null) national.totalPaidAmount = round1(p.totalAmount);
  if (last) national.currentStandardMonthlyIncome = last.standardIncome;
  if (p.expected) {
    national.expectedMonthlyPension = round1(p.expected.monthlyPension);
    national.expectedTotalContributionMonths = p.expected.totalMonths;
    national.totalExpectedPremium = round1(p.expected.totalPremium);
    national.aValue = round4(p.expected.aValue);
    national.bValue = round4(p.expected.bValue);
    notes.push(`예상연금 ${p.expected.startYm}부터 월 ${round1(p.expected.monthlyPension)}만원 (총 ${p.expected.totalMonths}개월)을 국민연금 상세 입력에 반영했습니다.`);
  }
  return { additionalPayment, returnRepayment, national, notes };
}

export { monthsBetween };
```

- [ ] **Step 4: 통과 확인** — `NPS history validation success!`

- [ ] **Step 5: PDF 텍스트 추출 공용화** — `src/utils/pdfText.ts`

```ts
// PDF 파일의 모든 페이지 텍스트를 이어 붙여 돌려준다 (브라우저 전용, pdfjs-dist 동적 로드)
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return fullText.trim();
}
```
  그리고 `src/app/onboarding/page.tsx`의 `handlePdfUpload`에서 `// 1. pdfjs-dist 동적 로드`부터 `const cleanText = fullText.trim();`까지를 `const cleanText = await extractPdfText(file);` 한 줄로 바꾸고 `import { extractPdfText } from "@/utils/pdfText";`를 추가한다(동작 동일, 이후 빈 텍스트 오류 처리는 그대로).

- [ ] **Step 6: 업로드 컴포넌트** — `src/components/NpsHistoryUpload.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { usePensionStore, type Who } from "@/store/usePensionStore";
import { extractPdfText } from "@/utils/pdfText";
import { parseNpsHistoryText, deriveFromNpsHistory } from "@/services/npsHistoryParser";

// 국민연금공단 가입내역조회 화면 출력 PDF → 추납·반납 입력 자동 채움
export default function NpsHistoryUpload({ who }: { who: Who }) {
  const store = usePensionStore();
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    setStatus("parsing");
    setMessage("");
    setNotes([]);
    try {
      const pdfText = await extractPdfText(file);
      const parsed = parseNpsHistoryText(pdfText);
      if (parsed.rows.length === 0 && parsed.totalMonths === null) {
        throw new Error("가입내역조회 화면을 출력한 PDF가 아닌 것 같습니다. 「조회 > 가입내역조회」 결과 화면을 인쇄 → PDF로 저장해 올려 주세요.");
      }
      const derived = deriveFromNpsHistory(parsed);
      store.setAdditionalPayment(derived.additionalPayment, who);
      if (Object.keys(derived.returnRepayment).length > 0) store.setReturnRepayment(derived.returnRepayment, who);
      if (Object.keys(derived.national).length > 0) store.setNationalPension(derived.national, who);
      setNotes(derived.notes);
      setStatus("done");
    } catch (e) {
      // 증명서 발급 PDF는 비밀번호로 암호화되어 pdfjs가 PasswordException을 던진다
      const encrypted = e instanceof Error && e.name === "PasswordException";
      setMessage(
        encrypted
          ? "암호화된 PDF(증명서 발급 파일)는 읽을 수 없습니다. 가입내역조회 화면을 인쇄 → PDF로 저장한 파일을 올려 주세요."
          : e instanceof Error ? e.message : "가입내역 분석에 실패했습니다."
      );
      setStatus("error");
    }
  };

  return (
    <div style={styles.box}>
      <div style={styles.title}>📄 국민연금 가입내역조회 PDF로 자동 입력</div>
      <p style={styles.desc}>
        국민연금공단 홈페이지 「조회 &gt; 가입내역조회」 결과 화면을 <strong>인쇄 → PDF로 저장</strong>해 올리면 국민연금 예상액·가입기간과 최초 가입년월·공백 기간·가입 상태·반환일시금
        내역을 채웁니다. 증명서 발급 PDF는 암호화되어 있어 읽을 수 없습니다. 채운 뒤 값을 꼭 확인하세요.
      </p>
      <input
        type="file"
        accept="application/pdf"
        disabled={status === "parsing"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {status === "parsing" && <p style={styles.desc}>⏳ 가입내역을 분석하는 중입니다…</p>}
      {status === "error" && <p style={styles.error}>⚠ {message}</p>}
      {status === "done" && (
        <div>
          <p style={styles.ok}>✅ 가입내역을 반영했습니다.</p>
          {notes.map((n) => (
            <p key={n} style={styles.desc}>• {n}</p>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    border: "1px dashed rgba(99, 102, 241, 0.4)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    backgroundColor: "rgba(99, 102, 241, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  title: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" },
  desc: { fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 },
  error: { fontSize: "0.8rem", color: "var(--danger, #ef4444)", margin: 0 },
  ok: { fontSize: "0.85rem", color: "var(--success-light, #10b981)", fontWeight: 600, margin: 0 },
};
```

- [ ] **Step 7: 패널에 배치** — `AdditionalPaymentPanel`에 `import NpsHistoryUpload from "@/components/NpsHistoryUpload";`를 추가하고 첫 안내 박스(💡 소득이 없어…) 바로 뒤에 `<NpsHistoryUpload who={who} />`

- [ ] **Step 8: 확인** — tsc 0, eslint 새 파일 3개 0·Panel 0·onboarding ≤ 15, 검증 스크립트 성공

- [ ] **Step 9: Commit** — `feat: 국민연금 가입내역조회 PDF 업로드로 반납·추납·예상연금 자동 입력`

---

### Task 8: 기초연금 (1층, 본인/배우자) 화면

**Files:** Create `src/components/BasicPensionForm.tsx`; Modify `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: Task 1 (`basicPension` 새 필드, `setBasicPension`, `spouse.nationalPension`), Task 3 (`calcBasicPension`, `BASIC_PENSION_RULES`, `Region`)
- Produces: `BasicPensionForm()` — 기존 엔진용 `householdType/recognizedIncome/expectedMonthlyAmount/expectedEligibility`도 자동 동기화

- [ ] **Step 1: 컴포넌트** — `src/components/BasicPensionForm.tsx`

```tsx
"use client";

import React, { useEffect } from "react";
import { usePensionStore, type BasicPensionState, type NationalPensionState } from "@/store/usePensionStore";
import { calcBasicPension, type BasicPensionPerson } from "@/services/basicPensionCalculator";
import { BASIC_PENSION_RULES, type Region } from "@/config/basicPensionRules";
import { NPS_RULES } from "@/config/npsRules";

const REGION_LABEL: Record<Region, string> = {
  METRO: "대도시 (특별·광역시 구, 특례시)",
  CITY: "중소도시 (도의 시, 세종시)",
  RURAL: "농어촌 (도의 군)",
};

const aShareOf = (n: NationalPensionState) => {
  const A = n.aValue || NPS_RULES.aValue;
  const B = n.bValue || n.currentStandardMonthlyIncome || A;
  return A / (A + B);
};

// 기초연금 (1층, 본인/배우자): 가구 재산 + 두 사람 소득으로 소득인정액·수급액을 계산한다 (2026년 기준, 현재가치)
export default function BasicPensionForm() {
  const store = usePensionStore();
  const b = store.basicPension;
  const hasSpouse = store.simulationParams.hasSpouse;
  const set = (data: Partial<BasicPensionState>) => store.setBasicPension(data);

  const person = (earned: number, other: number, occupational: boolean, n: NationalPensionState): BasicPensionPerson => ({
    alive: true,
    age: BASIC_PENSION_RULES.eligibleAge,
    earnedIncome: earned,
    otherIncome: other,
    nationalPension: n.expectedMonthlyPension,
    aShare: aShareOf(n),
    occupational,
  });
  const household = {
    region: b.region,
    generalProperty: b.generalProperty,
    financialAssets: b.financialAssets,
    debts: b.debts,
    luxuryAssets: b.luxuryAssets,
  };
  // 두 사람 모두 65세 이상이고 생존한 시점 기준 (국민연금은 각자 예상 연금액)
  const result = calcBasicPension(
    person(b.selfEarnedIncome, b.selfOtherIncome, b.selfOccupational, store.nationalPension),
    hasSpouse ? person(b.spouseEarnedIncome, b.spouseOtherIncome, b.spouseOccupational, store.spouse.nationalPension) : null,
    household
  );

  // 기존 본인 기준 엔진(대시보드 S0~S4)이 쓰는 값도 함께 맞춘다
  const householdType = hasSpouse ? "COUPLE" : "SINGLE";
  const recognizedIncome = Math.round(result.recognizedIncome * 10) / 10;
  const expectedMonthlyAmount = Math.round(result.self * 10) / 10;
  const expectedEligibility = result.self > 0;
  useEffect(() => {
    if (
      b.householdType !== householdType ||
      b.recognizedIncome !== recognizedIncome ||
      b.expectedMonthlyAmount !== expectedMonthlyAmount ||
      b.expectedEligibility !== expectedEligibility
    ) {
      store.setBasicPension({ householdType, recognizedIncome, expectedMonthlyAmount, expectedEligibility });
    }
  }, [householdType, recognizedIncome, expectedMonthlyAmount, expectedEligibility, b, store]);

  const numberField = (label: string, value: number, key: keyof BasicPensionState, hint?: string) => (
    <div style={styles.fieldRow}>
      <label style={styles.label}>
        {label} {hint && <span style={styles.labelHint}>{hint}</span>}
      </label>
      <input type="number" min={0} className="premium-input" value={value || ""}
        onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<BasicPensionState>)} />
    </div>
  );

  const personColumn = (title: string, earnedKey: keyof BasicPensionState, otherKey: keyof BasicPensionState, occKey: keyof BasicPensionState) => (
    <div style={styles.column}>
      <h4 style={styles.columnTitle}>{title}</h4>
      {numberField("65세 이후 상시근로소득 (만원/월)", b[earnedKey] as number, earnedKey, "(116만원 공제 후 70% 반영)")}
      {numberField("사업·임대·이자·배당·사적연금 소득 (만원/월)", b[otherKey] as number, otherKey, "(100% 반영)")}
      <div style={styles.fieldRow}>
        <label style={styles.label}>직역연금 수급권</label>
        <select className="premium-input" value={b[occKey] ? "Y" : "N"}
          onChange={(e) => set({ [occKey]: e.target.value === "Y" } as Partial<BasicPensionState>)}>
          <option value="N">해당 없음</option>
          <option value="Y">공무원·사학·군인·별정우체국연금 수급권자</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-in">
      <div style={styles.infoAlert}>
        ℹ️ 기초연금은 만 65세 이상 가구의 소득인정액이 선정기준액(2026년 단독 월 {BASIC_PENSION_RULES.thresholdSingle}만원,
        부부 월 {BASIC_PENSION_RULES.thresholdCouple}만원) 이하일 때 받습니다. 부부가 모두 받으면 각각 20% 감액되고,
        국민연금이 많으면 연계감액이 적용됩니다. 국민연금은 국민연금 단계에서 입력한 예상 연금액을 자동으로 씁니다.
      </div>

      <h4 style={styles.sectionTitle}>① 가구 재산</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>거주지역</label>
          <select className="premium-input" value={b.region} onChange={(e) => set({ region: e.target.value as Region })}>
            {(Object.keys(REGION_LABEL) as Region[]).map((r) => (
              <option key={r} value={r}>{REGION_LABEL[r]}</option>
            ))}
          </select>
        </div>
        {numberField("일반재산: 주택 공시가격 등 (만원)", b.generalProperty, "generalProperty", `(기본공제 ${BASIC_PENSION_RULES.propertyDeduction[b.region].toLocaleString()}만원)`)}
        {numberField("금융재산 (만원)", b.financialAssets, "financialAssets", `(가구당 ${BASIC_PENSION_RULES.financialDeduction.toLocaleString()}만원 공제)`)}
        {numberField("부채: 주택담보대출·임대보증금 (만원)", b.debts, "debts")}
        {numberField("고급 차량·회원권 가액 (만원)", b.luxuryAssets, "luxuryAssets", "(가액 전액이 월 소득으로 반영)")}
      </div>

      <h4 style={styles.sectionTitle}>② 소득 (본인{hasSpouse ? " / 배우자" : ""})</h4>
      <div style={hasSpouse ? styles.twoColumns : undefined}>
        {personColumn("본인", "selfEarnedIncome", "selfOtherIncome", "selfOccupational")}
        {hasSpouse && personColumn("배우자", "spouseEarnedIncome", "spouseOtherIncome", "spouseOccupational")}
      </div>

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>기초연금 예상 수급 결과 ({hasSpouse ? "부부 모두 65세 이상일 때" : "65세 이상일 때"}, 현재가치)</h4>
        <div style={styles.previewGrid}>
          <div>소득인정액: <strong>{result.recognizedIncome.toFixed(1)} 만원/월</strong></div>
          <div>선정기준액: <strong>{result.threshold.toFixed(1)} 만원/월</strong></div>
          <div>본인 기초연금: <strong style={{ color: "var(--text-accent)" }}>{result.self.toFixed(1)} 만원/월</strong></div>
          {hasSpouse && <div>배우자 기초연금: <strong style={{ color: "var(--text-accent)" }}>{result.spouse.toFixed(1)} 만원/월</strong></div>}
        </div>
        {result.notes.map((n) => (
          <p key={n} style={styles.note}>• {n}</p>
        ))}
        <p style={styles.note}>
          ※ 연도별 실제 수급액(한 사람만 65세 이상인 기간, 배우자 사망 후 단독가구 전환 등)은 대시보드의 부부 통합 시뮬레이션에서 계산합니다.
          기초연금은 신청한 달부터 지급되며 소급되지 않습니다.
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" },
  twoColumns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  column: { display: "flex", flexDirection: "column", gap: "12px" },
  columnTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", margin: 0 },
  fieldRow: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" },
  labelHint: { fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" },
  previewBox: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
  },
  previewTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px" },
  previewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
};
```

- [ ] **Step 2: 온보딩 연결** — `step.kind === "BASIC"` 블록 내용 전체(가구 유형 select, 소득 인정액 입력과 onChange 안의 옛 추정식 `threshold = ... 210 : 336`, 결과 박스)를 `<BasicPensionForm />` 한 줄로 교체하고 import 추가

- [ ] **Step 3: 확인** — tsc 0, eslint 새 파일 0·onboarding ≤ 15, `grep -n "210 : 336" src/app/onboarding/page.tsx` 결과 없음

- [ ] **Step 4: Commit** — `feat: 기초연금 본인/배우자 2인 기준 입력 및 판정 화면`

---

### Task 9: 대시보드 부부 통합 섹션 + 반납 반영

**Files:** Create `src/components/CoupleSimulationSection.tsx`; Modify `src/app/dashboard/page.tsx`, `src/app/dashboard/ai-advisor/page.tsx`

**Interfaces:**
- Consumes: Task 2 `applyNpsOptions`, Task 4 `runCoupleSimulation`, `personParams`
- Produces: `CoupleSimulationSection({ result, selfStartAge, spouseStartAge })`

- [ ] **Step 1: 컴포넌트** — `src/components/CoupleSimulationSection.tsx`

```tsx
"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { CoupleSimulationResult, CoupleYear } from "@/services/coupleSimulation";

const fmt = (v: number) => Math.round(v).toLocaleString();
const WHO_LABEL = { SELF: "본인", SPOUSE: "배우자" } as const;

interface Props {
  result: CoupleSimulationResult;
  selfStartAge: number; // 본인 국민연금 개시 나이
  spouseStartAge: number; // 배우자 국민연금 개시 나이
}

// 부부 통합 연금 시뮬레이션: 본인·배우자 × 국민·기초·퇴직·개인연금 가구 합산 (명목, 만원/월)
export default function CoupleSimulationSection({ result, selfStartAge, spouseStartAge }: Props) {
  const { rows, firstDeath, lifetime } = result;
  const bothReceiving = rows.find(
    (r) => r.spouse && r.self.alive && r.spouse.alive && r.self.age >= selfStartAge && r.spouse.age >= spouseStartAge
  );
  const deathIndex = firstDeath ? rows.findIndex((r) => r.year === firstDeath.year) : -1;
  const beforeDeath = deathIndex > 0 ? rows[deathIndex - 1] : null;
  const afterDeath = deathIndex >= 0 ? rows[deathIndex] : null;
  const survivor = afterDeath ? (afterDeath.self.alive ? afterDeath.self : afterDeath.spouse) : null;

  const chartData = rows.map((r) => ({
    year: r.year,
    본인국민연금: Math.round(r.self.national),
    배우자국민연금: Math.round(r.spouse?.national ?? 0),
    기초연금: Math.round(r.self.basic + (r.spouse?.basic ?? 0)),
    퇴직연금: Math.round(r.self.retirement + (r.spouse?.retirement ?? 0)),
    개인연금보험: Math.round(r.self.personal + r.self.insurance + (r.spouse?.personal ?? 0) + (r.spouse?.insurance ?? 0)),
  }));

  // 표: 5년 간격 + 사망 전후 해
  const keyRows = rows.filter(
    (r, i) => i % 5 === 0 || i === deathIndex || i === deathIndex - 1 || i === rows.length - 1
  );
  const remark = (r: CoupleYear) => {
    const notes: string[] = [];
    if (!r.self.alive) notes.push("본인 사망");
    if (r.spouse && !r.spouse.alive) notes.push("배우자 사망");
    const choice = r.self.survivorChoice ?? r.spouse?.survivorChoice;
    if (choice === "SURVIVOR") notes.push("유족연금 선택");
    if (choice === "OWN_PLUS_30") notes.push("본인연금+유족 30%");
    return notes.join(", ");
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>👫 부부 통합 연금 시뮬레이션</h3>
      <p style={styles.subtitle}>
        본인·배우자의 국민연금·기초연금·퇴직연금·개인연금을 연도별로 합산합니다. 먼저 사망한 쪽이 생기면 남은 배우자는
        국민연금법 제56조에 따라 유족연금(사망자 연금의 가입기간별 40~60%)과 「본인 연금 + 유족연금 30%」 중 큰 쪽을 받습니다. (명목 금액, 만원/월)
      </p>

      <div style={styles.kpiGrid}>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>부부 모두 국민연금 수령 시 가구 월 연금</div>
          <div style={styles.kpiValue}>{bothReceiving ? `${fmt(bothReceiving.household)} 만원` : "-"}</div>
          <div style={styles.kpiHint}>{bothReceiving ? `${bothReceiving.year}년 (본인 ${bothReceiving.self.age}세 / 배우자 ${bothReceiving.spouse!.age}세)` : "수령 기간이 겹치지 않음"}</div>
        </div>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>첫 사망 전 → 후 가구 월 연금</div>
          <div style={styles.kpiValue}>
            {beforeDeath && afterDeath ? `${fmt(beforeDeath.household)} → ${fmt(afterDeath.household)} 만원` : "-"}
          </div>
          <div style={styles.kpiHint}>
            {firstDeath ? `${WHO_LABEL[firstDeath.who]} 기대수명 이후 (${firstDeath.year}년)` : "배우자 정보 없음"}
          </div>
        </div>
        <div style={styles.kpi}>
          <div style={styles.kpiLabel}>생애 누적 가구 수령액</div>
          <div style={styles.kpiValue}>{fmt(lifetime.household)} 만원</div>
          <div style={styles.kpiHint}>본인 {fmt(lifetime.self)} · 배우자 {fmt(lifetime.spouse)}</div>
        </div>
      </div>

      {survivor && survivor.survivorChoice && (
        <div style={styles.infoAlert}>
          🕊 {firstDeath && WHO_LABEL[firstDeath.who]} 사망 후 남은 배우자는{" "}
          <strong>{survivor.survivorChoice === "SURVIVOR" ? "유족연금" : "본인 노령연금 + 유족연금 30%"}</strong>을 선택해
          국민연금 월 <strong>{fmt(survivor.national)}만원</strong>을 받는 것이 유리합니다. 사망자의 퇴직·개인연금 잔액 상속은 반영하지 않았습니다.
        </div>
      )}

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
            <YAxis tickFormatter={(v) => fmt(Number(v))} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip formatter={(v) => `${fmt(Number(v))} 만원`} />
            <Legend />
            <Area type="monotone" dataKey="본인국민연금" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
            <Area type="monotone" dataKey="배우자국민연금" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
            <Area type="monotone" dataKey="기초연금" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
            <Area type="monotone" dataKey="퇴직연금" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
            <Area type="monotone" dataKey="개인연금보험" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
            {firstDeath && (
              <ReferenceLine
                x={firstDeath.year}
                stroke="var(--text-muted)"
                strokeDasharray="6 4"
                label={{ value: `${WHO_LABEL[firstDeath.who]} 사망`, fill: "var(--text-muted)", fontSize: 12 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>연도</th>
              <th style={styles.th}>본인 나이</th>
              <th style={styles.th}>배우자 나이</th>
              <th style={styles.th}>본인 합계</th>
              <th style={styles.th}>배우자 합계</th>
              <th style={styles.th}>가구 합계</th>
              <th style={styles.th}>비고</th>
            </tr>
          </thead>
          <tbody>
            {keyRows.map((r) => (
              <tr key={r.year}>
                <td style={styles.td}>{r.year}</td>
                <td style={styles.td}>{r.self.age}세</td>
                <td style={styles.td}>{r.spouse ? `${r.spouse.age}세` : "-"}</td>
                <td style={styles.td}>{fmt(r.self.total)}</td>
                <td style={styles.td}>{r.spouse ? fmt(r.spouse.total) : "-"}</td>
                <td style={styles.td}><strong>{fmt(r.household)}</strong></td>
                <td style={styles.td}>{remark(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={styles.note}>
        ※ 각자의 기대수명까지 생존한다고 가정합니다. 기초연금은 해마다 가구 소득인정액으로 다시 판정합니다
        (한 사람만 65세 이상이면 감액 없음, 둘 다 받으면 각 20% 감액, 사망 후 단독가구 기준).
        배우자 유족연금의 50세 미만 지급정지·재혼 등 예외는 반영하지 않았습니다.
      </p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: { fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  subtitle: { fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  kpi: { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", backgroundColor: "var(--background)" },
  kpiLabel: { fontSize: "0.78rem", color: "var(--text-muted)" },
  kpiValue: { fontSize: "1.15rem", fontWeight: 700, color: "var(--text-accent)", marginTop: "4px" },
  kpiHint: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 },
};
```

- [ ] **Step 2: 대시보드 계산 교체** — `src/app/dashboard/page.tsx`
  - import: `applyAdditionalPayment` 제거, 추가 `import { applyNpsOptions } from "@/services/returnRepaymentCalculator";`, `import { runCoupleSimulation, personParams } from "@/services/coupleSimulation";`, `import CoupleSimulationSection from "@/components/CoupleSimulationSection";`
  - `const nationalForSim = applyAdditionalPayment(...)` 줄을 교체:
```tsx
  // 반납·추납 「대시보드 반영」이 켜진 것만 적용한 국민연금 (본인·배우자)
  const selfApplied = applyNpsOptions(store.nationalPension, store.additionalPayment, store.returnRepayment, store.simulationParams);
  const nationalForSim = selfApplied.national;
  const hasSpouse = store.simulationParams.hasSpouse;
  const spouseApplied = applyNpsOptions(
    store.spouse.nationalPension,
    store.spouse.additionalPayment,
    store.spouse.returnRepayment,
    personParams(store.simulationParams, "SPOUSE")
  );
  const coupleResult = runCoupleSimulation(
    {
      national: nationalForSim,
      retirementPensions: store.retirementPensions,
      personalPensions: store.personalPensions,
      pensionInsurances: store.pensionInsurances,
    },
    hasSpouse
      ? {
          national: spouseApplied.national,
          retirementPensions: store.spouse.retirementPensions,
          personalPensions: store.spouse.personalPensions,
          pensionInsurances: store.spouse.pensionInsurances,
        }
      : null,
    store.simulationParams,
    store.basicPension
  );
```
  - 배지 문구(조건 `nationalForSim !== store.nationalPension` 유지) → `🔁 {[selfApplied.addedMonths > 0 && `추납 ${selfApplied.addedMonths}개월`, selfApplied.restoredMonths > 0 && `반납 ${selfApplied.restoredMonths}개월`].filter(Boolean).join(" · ")} 반영 (추정치 · 정확한 금액은 국민연금공단 1355 확인)`
  - 섹션 배치: 배지 바로 아래, 「실시간 시뮬레이션 매개변수 조정」 카드 앞, 다른 카드와 같은 부모 안에
```tsx
        {hasSpouse && (
          <CoupleSimulationSection
            result={coupleResult}
            selfStartAge={store.simulationParams.nationalPensionStartAge}
            spouseStartAge={store.simulationParams.spouseNationalPensionStartAge}
          />
        )}
```

- [ ] **Step 3: AI 어드바이저** — `src/app/dashboard/ai-advisor/page.tsx`의 `applyAdditionalPayment(...)` → `const selfApplied = applyNpsOptions(store.nationalPension, store.additionalPayment, store.returnRepayment, store.simulationParams); const nationalForSim = selfApplied.national;`, 배지 문구를 Step 2와 같게, import 정리

- [ ] **Step 4: 확인** — 검증 스크립트 7개(validateAdditionalPayment, validateWithdrawal, validateCoupleStore, validateReturnRepayment, validateBasicPension, validateCoupleSimulation, validateNpsHistory) 성공, tsc 0, eslint 새 컴포넌트 0·dashboard ≤ 14·ai-advisor ≤ 9

- [ ] **Step 5: Commit** — `feat: 대시보드 부부 통합 연금 시뮬레이션 섹션 및 반납 반영`

---

### Task 10: 문서

- [ ] **Step 1:** `docs/features.md` 끝에 추가
```markdown
- **[FEAT-016] 부부 통합 연금 진단·시뮬레이션**: 진단 단계를 본인/배우자 층별(국민·퇴직·개인연금 본인/배우자, 기초연금 2인)로 재구성하고 기본정보를 본인·배우자 2열(나이·은퇴·기대수명)로 입력. 국민연금 가입내역조회 화면 출력 PDF 업로드(규칙 기반 파싱)로 예상연금·반환일시금·추납 공백 자동 입력. 반환일시금 반납(공단 고지액 우선, 공단 고시 연도별 정기예금 이자율 복리 추정, 당시 소득대체율 복원)과 대안 D/B/C/A(현행·반납·추납·반납+추납) 원금 회수 비교. 기초연금 소득인정액·부부감액·국민연금 연계감액·소득역전 판정. 대시보드 부부 통합 섹션에서 연도별 부부 합산 국민·기초·퇴직·개인연금과 먼저 사망 시 유족연금 중복급여 조정(제56조)을 시뮬레이션 (Sprint 26)
```
- [ ] **Step 2: Commit** — `docs: 부부 통합 연금 시뮬레이션 기능 등록`

---

## 범위 밖

- 기존 S0~S4 인출·세금·건보 엔진의 부부화(사용자 결정), AI 프롬프트에 배우자 정보 전달, Prisma/API 저장
- 배우자 NPS 간편인증(SYNC)
- 유족연금 지급정지(50세 미만)·재혼·부양가족연금·사망자 사적연금 상속, 기초연금 신청 지연(소급 불가) 시나리오
- 반환일시금 수령자의 추납 선행 조건(반납 필요 여부) — 기존 경고 문구 유지, 1355 확인 대상
- 가입내역 PDF의 국민연금 수령 개시년월(예: 2033-01)로 개시 나이 자동 설정 — 생년월일이 없어 사용자가 기타 설정에서 입력
- 온보딩 휴대폰 폭 레이아웃(기존 문제)
