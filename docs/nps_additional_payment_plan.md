# 국민연금 추가납부(추납) 플랜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연금 정보창고에 「국민연금 추가납부 플랜」 PDF를 추가하고, 온보딩 STEP 1(국민연금)의 부정확한 「간편 시뮬레이션 입력」 탭을 「추가납부 대상 등록」 탭으로 교체해 추납 자격 판정·추납 보험료·추가 연금액·손익분기 시점을 계산해 보여준다.

**Architecture:** 법 규정 수치는 `src/config/npsRules.ts` 룰셋 한 곳에 모으고, 계산은 순수 함수 모듈 `src/services/additionalPaymentCalculator.ts`에 둔다(기존 `pensionCalculator.ts`와 같은 방식). 입력값은 Zustand 스토어의 새 슬라이스 `additionalPayment`에 저장되어 localStorage·JSON 백업에 함께 실린다. UI는 거대한 `onboarding/page.tsx`(2,664줄)에 직접 넣지 않고 `AdditionalPaymentPanel`(입력+요약)과 `AdditionalPaymentInsights`(비교표·차트·가이드) 두 컴포넌트로 분리한다. 사용자가 「대시보드에 반영」을 켜면 `applyAdditionalPayment()`가 추납 후 국민연금 값을 만들어 기존 시뮬레이터에 그대로 넘긴다(기존 계산기 시그니처 변경 없음).

**Tech Stack:** Next.js 16.2.7 (App Router, `"use client"` 페이지), React 19, Zustand 5 (persist), Recharts 3, TypeScript 5. 검증은 기존 관례대로 `scratch/*.ts` 스크립트를 `npx tsx`로 실행(`node:assert` 사용). 테스트 프레임워크는 없다.

**Spec:** 이 문서의 §0(요구사항·도메인 규칙)이 스펙이다. 원천 자료: `~/Downloads/국민연금추가납부플랜.pdf`(15쪽, 이미지 전용, 추납 내용은 8~13쪽), 국민연금공단 공식 안내 <https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0047M0.do>, 개정 공포 안내(2025-11-25).

## Global Constraints

- 금액 단위는 앱 전체 관례대로 **만원**, 기간은 **개월**, 년월은 `"YYYY-MM"` 문자열.
- 법 규정 수치(요율·한도·A값)는 `src/config/npsRules.ts`에만 둔다. 컴포넌트·계산기에 숫자 하드코딩 금지.
- 모든 결과 화면에 "추정치이며 정확한 금액은 국민연금공단(1355, 내곁에국민연금 앱) 추납 예상액 조회로 확인" 고지.
- `npm run build`는 **실행하지 않는다** — 스크립트에 `prisma migrate deploy`가 들어 있어 DB에 마이그레이션을 건다. 타입 검증은 `npx tsc --noEmit`, 린트는 `npm run lint`.
- Prisma 스키마·DB는 이번 범위에서 건드리지 않는다(입력값은 스토어/백업 JSON으로 보존). DB 저장이 필요해지면 별도 계획 + 사용자 승인.
- 작업 브랜치: `main`에서 `feat/nps-additional-payment` 생성. 현재 브랜치(`chore/claude-md-audit`)의 미커밋 변경(`.serena/project.yml`, `.claude/`)은 커밋에 섞지 않는다 — 항상 파일을 지정해 `git add`.
- 커밋 메시지는 기존 관례(한국어 semantic: `feat:`, `docs:`, `style:`)를 따른다.

---

## 0. 요구사항 및 도메인 규칙 (스펙)

### 0.1 사용자 요구사항

| # | 요구 | 구현 위치 |
|---|---|---|
| R1 | 연금 정보창고에 「국민연금 추가납부 플랜」 추가 | Task 1 |
| R2 | STEP 1 국민연금의 「간편 시뮬레이션 입력」 삭제 | Task 5 |
| R3 | 탭 맨 오른쪽에 「추가납부 대상 등록」 추가 | Task 5 |
| R4 | 입력: 최초 가입년월, 지속 가입개시 년월, 중단 기간(개월), 그 외 추납에 필요한 정보 | Task 2, 5 |
| R5 | 추납 시 추가 수령 예상 연금액 | Task 4, 5 |
| R6 | 추가 수령액 누적이 추납액을 넘는 시점(손익분기) 시뮬레이션 | Task 4, 6 |
| R7 | 일시납 vs 분할납부의 납부금액·수령금액 비교 (분할납부이자는 복리 산정) | Task 3, 4, 6 |

### 0.2 제도 규칙 (국민연금공단 공식 안내, 2026-09 확인)

| 규칙 | 값 | 앱 반영 |
|---|---|---|
| 추납 대상 기간 | ① 납부예외(사업중단·실직 등) ② 적용제외: '99.4.1 이후 무소득배우자, '01.4.1 이후 기초수급자, '08.1.1 이후 1년 이상 행방불명자, '15.7.29 이후 18세 미만 사업장가입자 ③ '88.1.1 이후 군복무(군인연금·타 공적연금 기간 제외). **체납(미납)은 불가** | 중단 사유 선택지 + 날짜 조건 안내 문구, 체납이면 자격 없음 |
| 최대 개월수 | 10년 미만(119개월) | `maxAdditionalMonths` |
| 신청 자격 | 국민연금에 소득신고 중이거나 임의(계속)가입 중. **자격 유지 중에만** 신청 가능 | 현재 가입 상태 「미가입」이면 자격 없음 |
| 추납 보험료 | [신청일 기준소득월액] × [**납부기한 월**의 보험료율] × 개월수 | 비용 계산 |
| 임의가입자 | 상한: **신청일 기준 A값**(2026년 월 3,193,511원 → 월 추납보험료 약 30만원 × 개월수) × 납부기한월 보험료율 초과 불가. 하한 ≈ 지역가입자 중위수(약 100만원) | `effectiveBaseIncome` |
| 기준소득월액 상·하한 | 2026.7~2027.6: 하한 41만원, 상한 659만원 (사업장·지역가입자 추납 기준소득월액도 이 범위) | `effectiveBaseIncome` |
| 납부기한 | 신청 **다음 달** 11~15일 고지서 발송, 그 달 말일까지 납부 → 12월 신청이면 다음 해 1월 요율 적용 | `firstDueYmOf()`, 12월 신청 경고 |
| 분할납부 | 일시납 또는 최대 60회 분할, 분할 시 1년만기 정기예금 이자율 가산 | 분납 옵션 |
| 분할납부이자 | 기간: 신청월 ~ 각 회차 납부월의 **전월**. 1년 초과분은 연 단위로 이자를 원금에 가산(**복리**) 후 나머지 기간 이자 계산. 분할납부총액 = 추납원금 + 분할납부이자 (사용자 제공 산정방법, 2차 출처 기반) | `installmentInterestFactor()` |
| 납부 불가 | 신청 후 연금수급 개시·사망 시 납부 불가, 납부기한 경과 시 가산이자 | 가이드 문구 |
| 제출서류 | 혼인관계증명서(상세, 주민번호 표시) 필수 | 가이드 문구 |
| 보험료율 | 2025년 9.0% → 2026년부터 매년 +0.5%p → 2033년 13% | `premiumRateForYear()` |
| 소득대체율 | 2026년~ 43%(비례상수 1.29). 추납분 소득대체율은 **추납보험료를 납부한 달** 기준 | 추납 월 비례상수 1.29 |
| 최소 가입기간 | 120개월 미만이면 노령연금 없음 | 수급권 획득 경고 |
| 건보 피부양자 | 공적연금 등 소득 연 2,000만원 초과 시 탈락 (기존 `withdrawalCalculator.ts:134`) | 탈락 위험 경고 |

**자료(PDF)와 현행 법의 차이 — 반드시 반영:** 자료 10~12쪽의 "추납 요율 기준이 '신청한 달' → '납부기한이 속하는 달'로 바뀌는 개정안"은 **2025-11-25에 공포·시행 완료**됐다. 따라서 자료 12쪽 의사결정도의 "법 공포 전이면 오늘 분납 신청해 신청시점 요율 확정" 분기는 더 이상 유효하지 않다. 앱 안내는 현행법 기준으로 쓴다. 자료 9쪽의 금액 예시(월 9만원×20년 = 373,000원 등)도 작성 시점 기준값이라 앱에 하드코딩하지 않는다.

**가정(모델 단순화) — UI에 "추정" 표기:**
1. 분납 시 **각 회차**의 요율은 그 회차 납부기한이 속한 해의 요율(자료 11쪽 해석). 공단 운영 방식과 다를 수 있으므로 1355 확인 권장 문구 표시.
2. 분납이자: 회차별 원금 × [(1 + r)^⌊m/12⌋ × (1 + r × (m mod 12)/12) − 1], m = 신청월부터 납부월 전월까지 개월수. 실제로는 연도별 1년 정기예금 이자율이 바뀌지만 앱은 사용자가 입력한 단일 이자율을 쓴다. 정확한 금액은 공단이 발급하는 분할납부계획서로 확인.
3. 연금 증가액: 기본연금액(연) ≈ Σ 비례상수ᵢ × (A + B) × 가입월수ᵢ / 240. 기존 기간의 평균 비례상수는 사용자가 입력한 NPS 예상연금액으로 역산(보정)하고, 추납 월은 1.29 적용. B는 추납 기준소득월액을 가입월수로 가중평균해 갱신. 부양가족연금·재평가율·10~20년 구간의 연 단위 절사는 생략.
4. 손익분기는 **현재가치 기준**: 국민연금은 물가연동이므로 오늘 가치로 매년 Δ월액×12를 받는다고 보고, 순비용(추납액 − 소득공제 환급 추정액)과 비교.
5. 소득공제 환급 추정 = Σ연도별 min(그 해 납부원금, 연소득) × 한계세율. 연소득 = 현재 기준소득월액 × 12. 소득 없는 임의가입자는 한계세율 0으로 입력하도록 안내.
6. 일시납과 분납은 **연금 증가액(수령액)이 같다**(같은 개월수·같은 기준소득, 2026년 이후 납부분은 모두 소득대체율 43%). 차이는 납부총액·소득공제 환급·순비용·손익분기·순이익에서만 난다. 분납 완료 전 연금 수급이 시작되는 경우는 다루지 않는다.

### 0.3 화면 흐름

```
STEP 1 국민연금 탭:  [NPS 공단고서 상세 입력] [📄 금융감독원 통합연금 자료 등록] [➕ 추가납부 대상 등록]
                                                                              └ 신규(맨 오른쪽)
추가납부 대상 등록 탭
 ├ ① 가입 이력: 최초 가입년월 · 지속 가입개시 년월 · 중단 기간(개월) · 중단 사유 · 현재 가입 상태 · 반환일시금 수령 여부
 ├ ② 추납 조건: 추납 희망 개월수 · 추납 기준소득월액 · 신청 년월 · 일시납/분납 · 분납 횟수 · 분납이자율 · 한계세율 · 대시보드 반영
 ├ ③ 결과 요약: 자격 판정/사유 · 추납 개월수 · 추납액(일시납 vs 선택 방식) · 소득공제 환급 · 월 연금 전→후(+Δ) · 손익분기 나이
 └ ④ 인사이트: 일시납 vs 분납(12·24·60회+선택) 납부·수령 비교표 · 기준소득월액 3안 비교표 · 누적 수령액 vs 순비용 차트
              · 분납 연도별 요율표 · 현행법 기준 의사결정 가이드
```

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `public/NPS_Additional_Payment_Plan.pdf` | Create (복사) | 정보창고 PDF |
| `src/app/page.tsx` | Modify `:12-33` | `LIBRARY_DOCUMENTS`에 항목 추가 |
| `src/store/usePensionStore.ts` | Modify | `AdditionalPaymentState` 타입·초기값·`setAdditionalPayment`·import/reset |
| `src/app/onboarding/page.tsx` | Modify `:8`, `:23`, `:509-518`, `:556-590`, `:1001-1102` | 백업에 슬라이스 포함, SIMPLE 탭·핸들러 삭제, 새 탭 연결 |
| `src/app/dashboard/page.tsx` | Modify `:141-149`, `:228-250` | 백업 포함, 시뮬레이터에 추납 반영값 전달 |
| `src/app/dashboard/ai-advisor/page.tsx` | Modify `:276`, `:493` 부근 | 시뮬레이터·AI 요청에 추납 반영값 전달 |
| `src/config/npsRules.ts` | Create | 추납 관련 법 규정 수치 |
| `src/services/additionalPaymentCalculator.ts` | Create | 자격·비용·연금증가·손익분기 순수 함수 |
| `src/components/AdditionalPaymentPanel.tsx` | Create | 입력 폼 + 결과 요약 |
| `src/components/AdditionalPaymentInsights.tsx` | Create | 비교표·누적 차트·분납표·가이드 |
| `scratch/validateAdditionalPayment.ts` | Create | 계산기 검증 스크립트 |
| `docs/features.md` | Modify | FEAT-015 등록 |

---

### Task 1: 연금 정보창고에 「국민연금 추가납부 플랜」 추가

**Files:**
- Create: `public/NPS_Additional_Payment_Plan.pdf` (원본 `~/Downloads/국민연금추가납부플랜.pdf`, 18.0MB)
- Modify: `src/app/page.tsx:12-33`

**Interfaces:**
- Consumes: 없음
- Produces: `/NPS_Additional_Payment_Plan.pdf` 정적 경로 (Task 6 가이드에서 링크로 재사용)

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/chanhojung/Downloads/pension_plan
git switch main && git pull --ff-only
git switch -c feat/nps-additional-payment
```

- [ ] **Step 2: PDF 복사** (기존 파일처럼 ASCII 파일명 사용)

```bash
cp ~/Downloads/국민연금추가납부플랜.pdf public/NPS_Additional_Payment_Plan.pdf
ls -l public/NPS_Additional_Payment_Plan.pdf
```
Expected: 약 18MB 파일 존재

- [ ] **Step 3: `LIBRARY_DOCUMENTS` 끝에 항목 추가** (`src/app/page.tsx`, `The_IRP_Master_Recipe.pdf` 항목 뒤)

```tsx
  {
    title: "장기 생존을 위한 코어-새틀라이트 전략",
    url: "/The_IRP_Master_Recipe.pdf",
    desc: "퇴직연금(IRP)의 장기 안정 자산(코어)과 자산 배분 펀드(새틀라이트) 최적 비율 배분 포트폴리오 레시피"
  },
  {
    title: "국민연금 추가납부 플랜",
    url: "/NPS_Additional_Payment_Plan.pdf",
    desc: "생애주기 재무 설계도와 국민연금 추후납부(추납) 119개월 전략, 보험료율 인상기 일시납·분납 판단 가이드"
  }
];
```

- [ ] **Step 4: 확인**

Run: `npm run lint -- src/app/page.tsx` → Expected: 에러 없음
Run: `npm run dev` 후 `http://localhost:3000` → 「연금 정보창고」 → 5번째 카드 「국민연금 추가납부 플랜」 클릭 → PdfViewerModal에 15쪽 표시, 닫으면 정보창고 모달로 복귀.
(카드가 5개라 2열 그리드 마지막 줄에 1개만 남는 것은 정상)

- [ ] **Step 5: Commit**

```bash
git add public/NPS_Additional_Payment_Plan.pdf src/app/page.tsx
git commit -m "feat: 연금 정보창고에 국민연금 추가납부 플랜 자료 추가"
```

---

### Task 2: 스토어에 `additionalPayment` 슬라이스 추가

**Files:**
- Modify: `src/store/usePensionStore.ts`
- Modify: `src/app/onboarding/page.tsx:509-518` (JSON 저장)
- Modify: `src/app/dashboard/page.tsx:141-149` (JSON 내보내기)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `export type GapReason = "EXEMPT" | "EXCLUDED" | "MILITARY" | "ARREARS"`
  - `export type EnrollStatus = "WORKPLACE" | "REGIONAL" | "VOLUNTARY" | "VOLUNTARY_CONT" | "NONE"`
  - `export interface AdditionalPaymentState` (아래 필드 그대로)
  - 스토어 필드 `additionalPayment: AdditionalPaymentState`, 액션 `setAdditionalPayment(data: Partial<AdditionalPaymentState>): void`

- [ ] **Step 1: 타입 추가** (`usePensionStore.ts`, `SimulationParamsState` 인터페이스 바로 뒤)

```ts
export type GapReason = "EXEMPT" | "EXCLUDED" | "MILITARY" | "ARREARS"; // 납부예외 | 적용제외 | 군복무 | 체납
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
```

- [ ] **Step 2: 스토어 인터페이스·초기값·액션 추가**

`interface PensionStore`의 States에 `additionalPayment: AdditionalPaymentState;`, Actions에 `setAdditionalPayment: (data: Partial<AdditionalPaymentState>) => void;` 추가. `importStoreData`의 인자 타입에 `additionalPayment?: AdditionalPaymentState;` 추가.

`initialSimulationParams` 뒤에:

```ts
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
```

`create` 본문의 초기 상태에 `additionalPayment: initialAdditionalPayment,`, 액션에:

```ts
      setAdditionalPayment: (data) =>
        set((state) => ({
          additionalPayment: { ...state.additionalPayment, ...data },
        })),
```

`importStoreData`의 `set({...})` 안에:

```ts
          additionalPayment: data.additionalPayment
            ? { ...initialAdditionalPayment, ...data.additionalPayment }
            : initialAdditionalPayment,
```

`resetStore`의 `set({...})` 안에 `additionalPayment: initialAdditionalPayment,`.

persist `version`은 **2 그대로 둔다**. Zustand persist 기본 merge는 `{...현재상태, ...저장된상태}` 얕은 병합이라, 저장된 값에 없는 `additionalPayment` 키는 초기값으로 채워진다. (구현 전 `node_modules/zustand/middleware/persist.d.ts`의 `merge` 옵션 설명으로 확인)

- [ ] **Step 3: 백업 JSON에 포함** — 두 곳의 `const data = {...}`에 `simulationParams: store.simulationParams,` 다음 줄로 추가

```ts
      additionalPayment: store.additionalPayment,
```
(`src/app/onboarding/page.tsx` `handleSaveData`, `src/app/dashboard/page.tsx` `handleExportData`)

- [ ] **Step 4: 타입 검증**

Run: `npx tsc --noEmit`
Expected: 새 에러 없음 (작업 시작 전에 한 번 돌려 기존 에러 수를 기록해 두고 비교)

- [ ] **Step 5: 수동 확인** — `npm run dev` → 온보딩에서 「데이터 저장」 → 받은 JSON에 `"additionalPayment"` 키 존재. 기존 백업 파일(예: `~/Downloads/pensionlab_2026-08-19.json`)을 불러와도 오류 없이 복원.

- [ ] **Step 6: Commit**

```bash
git add src/store/usePensionStore.ts src/app/onboarding/page.tsx src/app/dashboard/page.tsx
git commit -m "feat: 추가납부 입력값 스토어 슬라이스 및 백업 포함"
```

---

### Task 3: 룰셋 + 자격 판정 + 추납 보험료 계산

**Files:**
- Create: `src/config/npsRules.ts`
- Create: `src/services/additionalPaymentCalculator.ts`
- Test: `scratch/validateAdditionalPayment.ts`

**Interfaces:**
- Consumes: `AdditionalPaymentState` (Task 2)
- Produces:
  - `NPS_RULES` 객체, `premiumRateForYear(year: number): number`
  - `monthsBetween(fromYm: string, toYm: string): number`, `firstDueYmOf(applyYm: string): string`
  - `installmentInterestFactor(annualRatePct: number, m: number): number` — 복리 이자 계수
  - `checkEligibility(ap): Eligibility` — `{ eligible: boolean; maxMonths: number; issues: string[] }`
  - `effectiveBaseIncome(ap): number`
  - `calcAdditionalPaymentCost(ap, months): CostResult` — `{ total; principal; interest; lumpSumTotal; rows: PaymentRow[] }`, `PaymentRow = { dueYm; rate; principal; interest }`
  - `estimateTaxRefund(cost, annualIncome, marginalTaxRate): number`

- [ ] **Step 1: 실패하는 검증 스크립트 작성** (`scratch/validateAdditionalPayment.ts`)

```ts
import assert from "node:assert/strict";
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  checkEligibility,
  effectiveBaseIncome,
  calcAdditionalPaymentCost,
  estimateTaxRefund,
} from "../src/services/additionalPaymentCalculator";
import { premiumRateForYear } from "../src/config/npsRules";
import type { AdditionalPaymentState } from "../src/store/usePensionStore";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const ap: AdditionalPaymentState = {
  firstEnrollYm: "1998-03",
  resumeYm: "2008-03",
  gapMonths: 84,
  gapReason: "EXEMPT",
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  requestedMonths: 84,
  baseIncome: 100,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "2026-10",
  marginalTaxRate: 16.5,
  applyToSimulation: true,
};

// 보험료율 일정
assert.equal(premiumRateForYear(2025), 9.0);
assert.equal(premiumRateForYear(2026), 9.5);
assert.equal(premiumRateForYear(2033), 13.0);
assert.equal(premiumRateForYear(2040), 13.0);

// 년월 계산 — 첫 납부기한은 신청 다음 달
assert.equal(monthsBetween("1998-03", "2008-03"), 120);
assert.equal(firstDueYmOf("2026-10"), "2026-11");
assert.equal(firstDueYmOf("2026-12"), "2027-01");

// 자격 판정
assert.deepEqual(checkEligibility(ap), { eligible: true, maxMonths: 84, issues: [] });
assert.equal(checkEligibility({ ...ap, gapReason: "ARREARS" }).maxMonths, 0);
assert.equal(checkEligibility({ ...ap, enrollStatus: "NONE" }).eligible, false);
assert.equal(checkEligibility({ ...ap, gapMonths: 200, resumeYm: "2020-01" }).maxMonths, 119);
assert.equal(checkEligibility({ ...ap, gapMonths: 130 }).eligible, false); // 중단기간 > 가입~재가입 120개월
const refund = checkEligibility({ ...ap, receivedLumpSumRefund: true });
assert.equal(refund.eligible, true);
assert.equal(refund.issues.length, 1);

// 임의가입자 기준소득월액 범위 [100, A값], 그 외 [41, 659]
near(effectiveBaseIncome({ ...ap, enrollStatus: "VOLUNTARY", baseIncome: 500 }), 319.3511);
assert.equal(effectiveBaseIncome({ ...ap, enrollStatus: "VOLUNTARY", baseIncome: 50 }), 100);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 500 }), 500);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 800 }), 659);
assert.equal(effectiveBaseIncome({ ...ap, baseIncome: 30 }), 41);

// 일시납: 100만원 × 9.5%(납부기한 2026-11) × 84개월
const lump = calcAdditionalPaymentCost(ap, 84);
near(lump.total, 798);
assert.equal(lump.rows.length, 1);
assert.equal(lump.rows[0].dueYm, "2026-11");

// 12월 신청 → 납부기한 2027-01 → 10% 적용
near(calcAdditionalPaymentCost({ ...ap, applyYm: "2026-12" }, 84).total, 840);

// 분할납부이자 계수: 1년 단위 복리 (연 3%: 12개월 1.03, 24개월 1.0609, 18개월 1.03 × 1.015)
near(installmentInterestFactor(3, 12), 1.03, 1e-9);
near(installmentInterestFactor(3, 24), 1.0609, 1e-9);
near(installmentInterestFactor(3, 18), 1.04545, 1e-9);
near(installmentInterestFactor(3, 1), 1.0025, 1e-9);

// 분납 24회: 납부기한 2026-11~2028-10, 해마다 요율 상승 + 복리 이자
const inst = calcAdditionalPaymentCost({ ...ap, paymentMode: "INSTALLMENT", installments: 24 }, 84);
near(inst.principal, 854);
near(inst.interest, 22.7240);
near(inst.total, 876.7240);
near(inst.lumpSumTotal, 798);
assert.equal(inst.rows[0].dueYm, "2026-11");
assert.equal(inst.rows[0].rate, 9.5);
near(inst.rows[0].interest, 0.0693); // 신청월(10월) 1개월분
assert.equal(inst.rows[2].dueYm, "2027-01");
assert.equal(inst.rows[2].rate, 10.0);
assert.equal(inst.rows[23].dueYm, "2028-10");
assert.equal(inst.rows[23].rate, 10.5);

// 소득공제 환급: 연소득 한도 내 × 한계세율
near(estimateTaxRefund(lump, 3600, 16.5), 131.67);
near(estimateTaxRefund(lump, 50, 16.5), 8.25);

console.log("Task 3 validation success!");
```

- [ ] **Step 2: 실패 확인**

Run: `npx tsx scratch/validateAdditionalPayment.ts`
Expected: FAIL — `Cannot find module '../src/services/additionalPaymentCalculator'`

- [ ] **Step 3: 룰셋 작성** (`src/config/npsRules.ts`)

```ts
// 국민연금 추후납부(추납) 계산 룰셋
// 출처: 국민연금공단 추납 안내(nps.or.kr/pnsinfo/ntpsklg/getOHAF0047M0.do), 2026-09 확인
// A값·중위수·기준소득월액 상하한은 매년 바뀌므로 공단 고시 후 갱신한다.
export const NPS_RULES = {
  aValue: 319.3511, // 2026년 A값 (만원/월) — 임의가입자 추납 상한, 신청일 기준 A값 적용
  voluntaryIncomeFloor: 100, // 임의가입자 기준소득월액 하한 근사 (지역가입자 중위수, 만원)
  incomeFloor: 41, // 기준소득월액 하한 (2026.7~2027.6, 만원)
  incomeCap: 659, // 기준소득월액 상한 (2026.7~2027.6, 만원)
  maxAdditionalMonths: 119, // 추납 최대 개월수 (10년 미만)
  maxInstallments: 60, // 분할납부 최대 횟수
  minPensionMonths: 120, // 노령연금 최소 가입기간
  replacementConstant: 1.29, // 2026년~ 소득대체율 43%의 비례상수
  dependentIncomeCapAnnual: 2000, // 건보 피부양자 소득기준 (만원/년)
};

// 2025년까지 9%, 2026년부터 매년 0.5%p 인상, 2033년 13%에서 고정
export function premiumRateForYear(year: number): number {
  if (year <= 2025) return 9.0;
  return Math.min(13.0, 9.0 + 0.5 * (year - 2025));
}
```

- [ ] **Step 4: 계산기 1부 작성** (`src/services/additionalPaymentCalculator.ts`)

```ts
import { NPS_RULES, premiumRateForYear } from "@/config/npsRules";
import type { AdditionalPaymentState } from "@/store/usePensionStore";

export function monthsBetween(fromYm: string, toYm: string): number {
  const [fy, fm] = fromYm.split("-").map(Number);
  const [ty, tm] = toYm.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const yearOf = (ym: string) => Number(ym.slice(0, 4));

// 첫 납부기한 = 신청 다음 달 말일 (공단: 신청 다음 달 고지, 그 달 말일까지 납부)
export const firstDueYmOf = (applyYm: string) => addMonths(applyYm, 1);

export interface Eligibility {
  eligible: boolean;
  maxMonths: number;
  issues: string[];
}

export function checkEligibility(ap: AdditionalPaymentState): Eligibility {
  const issues: string[] = [];
  let blocked = false;
  if (!ap.firstEnrollYm) {
    issues.push("최초 가입년월을 입력해야 과거 납부 이력(1개월 이상)을 확인할 수 있습니다.");
    blocked = true;
  }
  if (ap.gapReason === "ARREARS") {
    issues.push("체납(미납) 기간은 추납 대상이 아닙니다. 납부예외·적용제외·군복무 기간만 가능합니다.");
    blocked = true;
  }
  if (ap.enrollStatus === "NONE") {
    issues.push("국민연금 자격을 유지하는 동안(소득신고 또는 임의가입 중)에만 신청할 수 있습니다. 임의가입 후 신청하세요.");
    blocked = true;
  }
  if (ap.firstEnrollYm && ap.resumeYm) {
    const span = monthsBetween(ap.firstEnrollYm, ap.resumeYm);
    if (ap.gapMonths > span) {
      issues.push(`중단 기간(${ap.gapMonths}개월)이 최초 가입~지속 가입개시 사이(${span}개월)보다 깁니다.`);
      blocked = true;
    }
  }
  if (ap.receivedLumpSumRefund) {
    issues.push("반환일시금을 받은 기간은 먼저 반납해야 추납 자격이 생깁니다.");
  }
  const maxMonths = blocked ? 0 : Math.min(ap.gapMonths, NPS_RULES.maxAdditionalMonths);
  return { eligible: maxMonths > 0, maxMonths, issues };
}

// 임의(계속)가입자는 [지역 중위수, A값], 그 외는 기준소득월액 [하한, 상한] 범위로 제한
export function effectiveBaseIncome(ap: AdditionalPaymentState): number {
  if (ap.enrollStatus === "VOLUNTARY" || ap.enrollStatus === "VOLUNTARY_CONT") {
    return Math.min(NPS_RULES.aValue, Math.max(NPS_RULES.voluntaryIncomeFloor, ap.baseIncome));
  }
  return Math.min(NPS_RULES.incomeCap, Math.max(NPS_RULES.incomeFloor, ap.baseIncome));
}

// 분할납부이자: 신청월부터 납부월 전월까지(m개월), 1년 단위로 이자를 원금에 가산하는 복리
// 계수 = (1 + r)^(m/12의 몫) × (1 + r × (m/12의 나머지)/12)
export function installmentInterestFactor(annualRatePct: number, m: number): number {
  const r = annualRatePct / 100;
  return Math.pow(1 + r, Math.floor(m / 12)) * (1 + (r * (m % 12)) / 12);
}

export interface PaymentRow {
  dueYm: string;
  rate: number;
  principal: number;
  interest: number;
}

export interface CostResult {
  total: number;
  principal: number;
  interest: number;
  lumpSumTotal: number;
  rows: PaymentRow[];
}

// 보험료율은 납부기한이 속하는 달 기준 (2025.11.25 공포·시행 국민연금법 개정)
export function calcAdditionalPaymentCost(ap: AdditionalPaymentState, months: number): CostResult {
  const income = effectiveBaseIncome(ap);
  const firstDueYm = firstDueYmOf(ap.applyYm);
  const lumpRate = premiumRateForYear(yearOf(firstDueYm));
  const lumpSumTotal = income * (lumpRate / 100) * months;
  if (ap.paymentMode === "LUMP") {
    return {
      total: lumpSumTotal,
      principal: lumpSumTotal,
      interest: 0,
      lumpSumTotal,
      rows: [{ dueYm: firstDueYm, rate: lumpRate, principal: lumpSumTotal, interest: 0 }],
    };
  }
  const n = Math.min(NPS_RULES.maxInstallments, Math.max(1, ap.installments));
  const rows: PaymentRow[] = [];
  for (let k = 0; k < n; k++) {
    const dueYm = addMonths(firstDueYm, k);
    const rate = premiumRateForYear(yearOf(dueYm));
    const principal = income * (rate / 100) * (months / n);
    const interest = principal * (installmentInterestFactor(ap.installmentInterestRate, monthsBetween(ap.applyYm, dueYm)) - 1);
    rows.push({ dueYm, rate, principal, interest });
  }
  const principal = rows.reduce((s, r) => s + r.principal, 0);
  const interest = rows.reduce((s, r) => s + r.interest, 0);
  return { total: principal + interest, principal, interest, lumpSumTotal, rows };
}

// 연금보험료 소득공제 환급 추정: 연도별 납부원금을 연소득 한도 내에서 공제 × 한계세율
export function estimateTaxRefund(cost: CostResult, annualIncome: number, marginalTaxRate: number): number {
  const byYear = new Map<number, number>();
  cost.rows.forEach((r) => byYear.set(yearOf(r.dueYm), (byYear.get(yearOf(r.dueYm)) || 0) + r.principal));
  let refund = 0;
  byYear.forEach((paid) => {
    refund += Math.min(paid, annualIncome) * (marginalTaxRate / 100);
  });
  return refund;
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx tsx scratch/validateAdditionalPayment.ts`
Expected: `Task 3 validation success!`

- [ ] **Step 6: Commit**

```bash
git add src/config/npsRules.ts src/services/additionalPaymentCalculator.ts scratch/validateAdditionalPayment.ts
git commit -m "feat: 추납 룰셋 및 자격 판정·추납 보험료 계산 로직"
```

---

### Task 4: 연금 증가액 · 손익분기 · 종합 플랜 · 대시보드 반영 함수

**Files:**
- Modify: `src/services/additionalPaymentCalculator.ts` (type import 교체 + 파일 끝에 추가)
- Test: `scratch/validateAdditionalPayment.ts` (import 교체 + 끝에 추가)

**Interfaces:**
- Consumes: Task 3 함수 전부, `NationalPensionState`, `SimulationParamsState`
- Produces:
  - `estimatePensionIncrease(national, months, baseIncome): PensionIncrease` — `{ beforeMonthly; afterMonthly; deltaMonthly; totalMonthsBefore; totalMonthsAfter; becomesEligible }`
  - `calcBreakEven(deltaMonthly, netCost, params): BreakEven` — `{ breakEvenAge: number | null; yearsToBreakEven: number | null; lifetimeGain; cumulative: { age; received; cost }[] }`
  - `compareBaseIncomes(ap, national, params, months): IncomeOption[]` — `{ label; baseIncome; cost; deltaMonthly; yearsToBreakEven }`
  - `compareLumpVsInstallment(ap, national, params, months): PaymentOption[]` — `{ label; installments; total; principal; interest; monthlyMin; monthlyMax; lastDueYm; taxRefund; netCost; deltaMonthly; breakEvenAge; lifetimeGain }` (일시납 + 분납 12·24·60회 + 사용자 선택 횟수, 중복 제거·오름차순)
  - `runAdditionalPaymentPlan(ap, national, params): AdditionalPaymentPlan` — `{ eligibility; months; cost; taxRefund; netCost; increase; breakEven; comparisons; paymentOptions; warnings: string[] }`
  - `applyAdditionalPayment(national, ap, params): NationalPensionState`

- [ ] **Step 1: 검증 스크립트에 실패 케이스 추가** — 맨 위 import 두 블록을 아래로 교체

```ts
import {
  monthsBetween,
  firstDueYmOf,
  installmentInterestFactor,
  checkEligibility,
  effectiveBaseIncome,
  calcAdditionalPaymentCost,
  estimateTaxRefund,
  estimatePensionIncrease,
  calcBreakEven,
  compareLumpVsInstallment,
  runAdditionalPaymentPlan,
  applyAdditionalPayment,
} from "../src/services/additionalPaymentCalculator";
import { premiumRateForYear } from "../src/config/npsRules";
import type {
  AdditionalPaymentState,
  NationalPensionState,
  SimulationParamsState,
} from "../src/store/usePensionStore";
```

마지막 `console.log(...)` 줄을 아래 블록으로 교체:

```ts
const national: NationalPensionState = {
  contributionMonths: 240,
  totalPaidAmount: 5400,
  currentStandardMonthlyIncome: 300,
  expectedTotalContributionMonths: 300,
  expectedMonthlyPension: 80,
  totalExpectedPremium: 8100,
  basicPensionAmount: 0,
  aValue: 319.3511,
  bValue: 300,
};
const params = { nationalPensionStartAge: 65, expectedLifeExpectancy: 85 } as SimulationParamsState;

// 연금 증가: NPS 예상액 80만원(300개월)에 84개월(기준소득 100만원) 추납
const inc = estimatePensionIncrease(national, 84, 100);
assert.equal(inc.beforeMonthly, 80);
near(inc.afterMonthly, 96.0059);
near(inc.deltaMonthly, 16.0059);
assert.equal(inc.totalMonthsAfter, 384);
assert.equal(inc.becomesEligible, false);

// 10년 미달자: 60개월 → 144개월, 수급권 획득
const short = estimatePensionIncrease(
  { ...national, expectedTotalContributionMonths: 60, expectedMonthlyPension: 0, bValue: 0, currentStandardMonthlyIncome: 100 },
  84,
  100
);
assert.equal(short.beforeMonthly, 0);
near(short.afterMonthly, 27.0481);
assert.equal(short.becomesEligible, true);

// 손익분기
assert.equal(calcBreakEven(10, 100, params).breakEvenAge, 65);
assert.equal(calcBreakEven(0, 100, params).breakEvenAge, null);

// 종합 플랜: 일시납 798만원 - 환급 131.67만원 = 순비용 666.33만원, 연 192만원 수령 → 4년차(68세)
const plan = runAdditionalPaymentPlan(ap, national, params);
assert.equal(plan.months, 84);
near(plan.netCost, 666.33);
assert.equal(plan.breakEven.breakEvenAge, 68);
assert.equal(plan.breakEven.yearsToBreakEven, 4);
near(plan.breakEven.lifetimeGain, 3367.16);
assert.deepEqual(plan.warnings, []);
assert.equal(plan.comparisons.length, 3);
assert.equal(plan.comparisons[0].yearsToBreakEven, 5); // 최소 기준소득 (세전)
assert.equal(plan.comparisons[2].yearsToBreakEven, 9); // A값 기준은 회수가 더 늦다

// 분납 경고: 일시납보다 약 79만원 더
const instPlan = runAdditionalPaymentPlan({ ...ap, paymentMode: "INSTALLMENT", installments: 24 }, national, params);
assert.ok(instPlan.warnings.some((w) => w.includes("약 79만원")));

// 일시납 vs 분납 비교 (사용자 선택 36회 포함)
const options = compareLumpVsInstallment({ ...ap, installments: 36 }, national, params, 84);
assert.deepEqual(options.map((o) => o.label), ["일시납", "분납 12회", "분납 24회", "분납 36회", "분납 60회"]);
const [lumpOpt, inst12, , , inst60] = options;
near(lumpOpt.total, 798);
near(lumpOpt.netCost, 666.33);
assert.equal(lumpOpt.breakEvenAge, 68);
near(inst12.total, 844.3531);
near(inst12.monthlyMin, 66.6385);
near(inst12.monthlyMax, 71.75);
assert.equal(inst12.lastDueYm, "2027-10");
near(inst60.total, 979.3511);
near(inst60.interest, 62.3511);
assert.equal(inst60.lastDueYm, "2031-10");
assert.equal(inst60.breakEvenAge, 69);
near(inst60.lifetimeGain, 3205.4447);
// 수령액(연금 증가)은 납부 방식과 무관
assert.ok(options.every((o) => Math.abs(o.deltaMonthly - lumpOpt.deltaMonthly) < 1e-9));
// 종합 플랜에도 포함 (기본 12회 → 일시납·12·24·60)
assert.equal(plan.paymentOptions.length, 4);

// 12월 신청 경고
const decPlan = runAdditionalPaymentPlan({ ...ap, applyYm: "2026-12" }, national, params);
assert.ok(decPlan.warnings.some((w) => w.includes("12월")));

// 희망 개월수가 한도 초과 → 잘라서 계산 + 경고
const over = runAdditionalPaymentPlan({ ...ap, requestedMonths: 150 }, national, params);
assert.equal(over.months, 84);
assert.ok(over.warnings[0].includes("최대 84개월"));

// 대시보드 반영
const applied = applyAdditionalPayment(national, ap, params);
assert.equal(applied.expectedMonthlyPension, 96);
assert.equal(applied.expectedTotalContributionMonths, 384);
assert.equal(applied.totalPaidAmount, 6198);
assert.equal(applyAdditionalPayment(national, { ...ap, applyToSimulation: false }, params), national);

console.log("Additional payment validation success!");
```

- [ ] **Step 2: 실패 확인**

Run: `npx tsx scratch/validateAdditionalPayment.ts`
Expected: FAIL — `estimatePensionIncrease is not a function` (또는 export 없음 SyntaxError)

- [ ] **Step 3: 구현** — 계산기 상단 type import를 교체

```ts
import type {
  AdditionalPaymentState,
  NationalPensionState,
  SimulationParamsState,
} from "@/store/usePensionStore";
```

파일 끝에 추가:

```ts
export interface PensionIncrease {
  beforeMonthly: number;
  afterMonthly: number;
  deltaMonthly: number;
  totalMonthsBefore: number;
  totalMonthsAfter: number;
  becomesEligible: boolean;
}

// 기본연금액(연) ≈ 비례상수 × (A + B) × 가입월수 / 240.
// 기존 기간의 평균 비례상수는 NPS 예상연금액으로 역산하고, 추납 월은 현행 1.29 적용.
export function estimatePensionIncrease(
  national: NationalPensionState,
  months: number,
  baseIncome: number
): PensionIncrease {
  const A = national.aValue || NPS_RULES.aValue;
  const P = national.expectedTotalContributionMonths;
  const bOld = national.bValue || national.currentStandardMonthlyIncome;
  const c = NPS_RULES.replacementConstant;
  const calibrated = national.expectedMonthlyPension > 0 && P >= NPS_RULES.minPensionMonths;
  const alphaOld = calibrated ? (national.expectedMonthlyPension * 12 * 240) / ((A + bOld) * P) : c;
  const monthly = (B: number, weightedMonths: number) => ((A + B) * weightedMonths) / 240 / 12;

  const beforeMonthly =
    P >= NPS_RULES.minPensionMonths
      ? calibrated ? national.expectedMonthlyPension : monthly(bOld, alphaOld * P)
      : 0;
  const totalAfter = P + months;
  const bNew = totalAfter > 0 ? (bOld * P + baseIncome * months) / totalAfter : baseIncome;
  const afterMonthly = totalAfter >= NPS_RULES.minPensionMonths ? monthly(bNew, alphaOld * P + c * months) : 0;
  return {
    beforeMonthly,
    afterMonthly,
    deltaMonthly: afterMonthly - beforeMonthly,
    totalMonthsBefore: P,
    totalMonthsAfter: totalAfter,
    becomesEligible: P < NPS_RULES.minPensionMonths && totalAfter >= NPS_RULES.minPensionMonths,
  };
}

export interface BreakEven {
  breakEvenAge: number | null;
  yearsToBreakEven: number | null;
  lifetimeGain: number;
  cumulative: { age: number; received: number; cost: number }[];
}

// 현재가치 기준: 국민연금은 물가연동이므로 오늘 가치로 매년 Δ월액×12를 받는다
export function calcBreakEven(deltaMonthly: number, netCost: number, params: SimulationParamsState): BreakEven {
  const cumulative: BreakEven["cumulative"] = [];
  let received = 0;
  let breakEvenAge: number | null = null;
  for (let age = params.nationalPensionStartAge; age <= params.expectedLifeExpectancy; age++) {
    received += deltaMonthly * 12;
    cumulative.push({ age, received: Math.round(received), cost: Math.round(netCost) });
    if (breakEvenAge === null && received >= netCost) breakEvenAge = age;
  }
  return {
    breakEvenAge,
    yearsToBreakEven: breakEvenAge === null ? null : breakEvenAge - params.nationalPensionStartAge + 1,
    lifetimeGain: received - netCost,
    cumulative,
  };
}

export interface IncomeOption {
  label: string;
  baseIncome: number;
  cost: number;
  deltaMonthly: number;
  yearsToBreakEven: number | null;
}

// 같은 개월수에서 기준소득월액만 바꿔 비교 ("적은 금액 × 최장 기간" 원칙 확인용, 세전 비용)
export function compareBaseIncomes(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState,
  months: number
): IncomeOption[] {
  const options = [
    { label: "최소(지역 중위수)", baseIncome: NPS_RULES.voluntaryIncomeFloor },
    { label: "현재 입력", baseIncome: effectiveBaseIncome(ap) },
    { label: "A값(임의가입 상한)", baseIncome: NPS_RULES.aValue },
  ];
  return options.map((o) => {
    const cost = calcAdditionalPaymentCost({ ...ap, baseIncome: o.baseIncome, enrollStatus: "REGIONAL" }, months).total;
    const deltaMonthly = estimatePensionIncrease(national, months, o.baseIncome).deltaMonthly;
    return { ...o, cost, deltaMonthly, yearsToBreakEven: calcBreakEven(deltaMonthly, cost, params).yearsToBreakEven };
  });
}

export interface PaymentOption {
  label: string;
  installments: number; // 1 = 일시납
  total: number;
  principal: number;
  interest: number;
  monthlyMin: number; // 회차별 납부액 최소 (원금+이자)
  monthlyMax: number; // 회차별 납부액 최대
  lastDueYm: string;
  taxRefund: number;
  netCost: number;
  deltaMonthly: number;
  breakEvenAge: number | null;
  lifetimeGain: number;
}

// 일시납 vs 분납(12·24·60회 + 사용자 선택 횟수) 납부액·수령액 비교
export function compareLumpVsInstallment(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState,
  months: number
): PaymentOption[] {
  const counts = [...new Set([12, 24, NPS_RULES.maxInstallments, ap.installments])]
    .filter((n) => n >= 2 && n <= NPS_RULES.maxInstallments)
    .sort((a, b) => a - b);
  // 연금 증가액은 납부 방식과 무관 (같은 개월수·기준소득)
  const deltaMonthly = estimatePensionIncrease(national, months, effectiveBaseIncome(ap)).deltaMonthly;
  const variants = [
    { label: "일시납", installments: 1, ap: { ...ap, paymentMode: "LUMP" as const } },
    ...counts.map((n) => ({
      label: `분납 ${n}회`,
      installments: n,
      ap: { ...ap, paymentMode: "INSTALLMENT" as const, installments: n },
    })),
  ];
  return variants.map((v) => {
    const cost = calcAdditionalPaymentCost(v.ap, months);
    const perRow = cost.rows.map((r) => r.principal + r.interest);
    const taxRefund = estimateTaxRefund(cost, national.currentStandardMonthlyIncome * 12, ap.marginalTaxRate);
    const netCost = cost.total - taxRefund;
    const be = calcBreakEven(deltaMonthly, netCost, params);
    return {
      label: v.label,
      installments: v.installments,
      total: cost.total,
      principal: cost.principal,
      interest: cost.interest,
      monthlyMin: Math.min(...perRow),
      monthlyMax: Math.max(...perRow),
      lastDueYm: cost.rows[cost.rows.length - 1].dueYm,
      taxRefund,
      netCost,
      deltaMonthly,
      breakEvenAge: be.breakEvenAge,
      lifetimeGain: be.lifetimeGain,
    };
  });
}

export interface AdditionalPaymentPlan {
  eligibility: Eligibility;
  months: number;
  cost: CostResult;
  taxRefund: number;
  netCost: number;
  increase: PensionIncrease;
  breakEven: BreakEven;
  comparisons: IncomeOption[];
  paymentOptions: PaymentOption[];
  warnings: string[];
}

export function runAdditionalPaymentPlan(
  ap: AdditionalPaymentState,
  national: NationalPensionState,
  params: SimulationParamsState
): AdditionalPaymentPlan {
  const eligibility = checkEligibility(ap);
  const months = Math.min(ap.requestedMonths, eligibility.maxMonths);
  const cost = calcAdditionalPaymentCost(ap, months);
  const taxRefund = estimateTaxRefund(cost, national.currentStandardMonthlyIncome * 12, ap.marginalTaxRate);
  const netCost = cost.total - taxRefund;
  const increase = estimatePensionIncrease(national, months, effectiveBaseIncome(ap));
  const breakEven = calcBreakEven(increase.deltaMonthly, netCost, params);
  const comparisons = compareBaseIncomes(ap, national, params, months);
  const paymentOptions = compareLumpVsInstallment(ap, national, params, months);

  const warnings: string[] = [];
  if (ap.requestedMonths > eligibility.maxMonths && eligibility.maxMonths > 0) {
    warnings.push(`추납 가능 개월수는 최대 ${eligibility.maxMonths}개월입니다. 초과분은 제외하고 계산했습니다.`);
  }
  if (increase.becomesEligible) {
    warnings.push("추납으로 최소 가입기간 10년(120개월)을 채워 노령연금 수급권이 생깁니다.");
  }
  if (ap.applyYm && yearOf(firstDueYmOf(ap.applyYm)) > yearOf(ap.applyYm)) {
    warnings.push("12월에 신청하면 첫 납부기한이 다음 해 1월이라 인상된 보험료율이 적용됩니다. 11월 이전 신청을 권장합니다.");
  }
  const extra = cost.total - cost.lumpSumTotal;
  if (ap.paymentMode === "INSTALLMENT" && extra > 0) {
    warnings.push(`분납 시 해마다 오르는 보험료율과 분납이자로 일시납보다 약 ${Math.round(extra).toLocaleString()}만원을 더 냅니다.`);
  }
  if (
    increase.beforeMonthly * 12 <= NPS_RULES.dependentIncomeCapAnnual &&
    increase.afterMonthly * 12 > NPS_RULES.dependentIncomeCapAnnual
  ) {
    warnings.push("추납 후 공적연금이 연 2,000만원을 넘어 건강보험 피부양자 자격을 잃을 수 있습니다.");
  }
  return { eligibility, months, cost, taxRefund, netCost, increase, breakEven, comparisons, paymentOptions, warnings };
}

// 대시보드 시뮬레이션 반영용: 추납 후 값으로 바꾼 국민연금 상태 (반영 토글이 꺼져 있으면 원본 그대로)
export function applyAdditionalPayment(
  national: NationalPensionState,
  ap: AdditionalPaymentState,
  params: SimulationParamsState
): NationalPensionState {
  if (!ap.applyToSimulation) return national;
  const plan = runAdditionalPaymentPlan(ap, national, params);
  if (plan.months === 0) return national;
  return {
    ...national,
    expectedMonthlyPension: Math.round(plan.increase.afterMonthly * 10) / 10,
    expectedTotalContributionMonths: plan.increase.totalMonthsAfter,
    totalPaidAmount: Math.round(national.totalPaidAmount + plan.cost.total),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx tsx scratch/validateAdditionalPayment.ts`
Expected: `Additional payment validation success!`
Run: `npx tsc --noEmit` → 새 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/services/additionalPaymentCalculator.ts scratch/validateAdditionalPayment.ts
git commit -m "feat: 추납 연금 증가액·손익분기·종합 플랜 계산"
```

---

### Task 5: STEP 1 탭 교체 — 간편 시뮬레이션 삭제, 「추가납부 대상 등록」 입력·요약 추가

**Files:**
- Create: `src/components/AdditionalPaymentPanel.tsx`
- Modify: `src/app/onboarding/page.tsx:8`(import), `:23`, `:556-590`(`handleSimpleNationalCalculate` 삭제), `:1001-1102`(탭·SIMPLE 블록)

**Interfaces:**
- Consumes: `usePensionStore().additionalPayment`, `setAdditionalPayment` (Task 2), `runAdditionalPaymentPlan`, `monthsBetween`, `firstDueYmOf` (Task 3/4), `NPS_RULES`
- Produces: `export default function AdditionalPaymentPanel()` (props 없음)

- [ ] **Step 1: 패널 컴포넌트 작성** (`src/components/AdditionalPaymentPanel.tsx`)

```tsx
"use client";

import React from "react";
import { usePensionStore, AdditionalPaymentState } from "@/store/usePensionStore";
import { runAdditionalPaymentPlan, monthsBetween, firstDueYmOf } from "@/services/additionalPaymentCalculator";
import { NPS_RULES } from "@/config/npsRules";

const fmt = (v: number) => Math.round(v).toLocaleString();

// 공단 안내 기준 추납 가능 기간의 시작일
const GAP_REASON_HINT: Record<AdditionalPaymentState["gapReason"], string> = {
  EXEMPT: "사업중단·실직 등으로 납부예외를 신청한 기간",
  EXCLUDED: "'99.4.1 이후 무소득배우자, '01.4.1 이후 기초수급자, '08.1.1 이후 1년 이상 행방불명자, '15.7.29 이후 18세 미만 사업장가입자",
  MILITARY: "'88.1.1 이후 군복무 (군인연금·타 공적연금 가입기간 제외)",
  ARREARS: "보험료를 내야 했는데 내지 않은 기간 — 추납 대상 아님",
};

export default function AdditionalPaymentPanel() {
  const store = usePensionStore();
  const ap = store.additionalPayment;
  const set = (data: Partial<AdditionalPaymentState>) => store.setAdditionalPayment(data);
  const plan = runAdditionalPaymentPlan(ap, store.nationalPension, store.simulationParams);
  const span = ap.firstEnrollYm && ap.resumeYm ? monthsBetween(ap.firstEnrollYm, ap.resumeYm) : 0;
  const hasNpsData = store.nationalPension.expectedTotalContributionMonths > 0;
  const isVoluntary = ap.enrollStatus === "VOLUNTARY" || ap.enrollStatus === "VOLUNTARY_CONT";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-in">
      <div style={styles.infoAlert}>
        💡 소득이 없어 보험료를 못 낸 기간(납부예외·적용제외·군복무)을 나중에 채워 넣어 <strong>가입기간을 늘리는 제도</strong>입니다.
        최대 {NPS_RULES.maxAdditionalMonths}개월까지 가능하며, 적은 금액으로 긴 기간을 채울수록 효율이 좋습니다.
      </div>
      {!hasNpsData && (
        <div style={styles.warnAlert}>
          ⚠ 「NPS 공단고서 상세 입력」 또는 「금융감독원 통합연금 자료 등록」 탭에서 예상 가입기간·예상 연금액을 먼저 입력하면
          추가 연금액이 훨씬 정확해집니다.
        </div>
      )}

      <h4 style={styles.sectionTitle}>① 가입 이력</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>최초 가입년월</label>
          <input type="month" className="premium-input" value={ap.firstEnrollYm}
            onChange={(e) => set({ firstEnrollYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>지속 가입개시 년월 <span style={styles.labelHint}>(중단 후 다시 내기 시작한 달)</span></label>
          <input type="month" className="premium-input" value={ap.resumeYm}
            onChange={(e) => set({ resumeYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            중단 기간 (개월) {span > 0 && <span style={styles.labelHint}>(두 년월 사이 최대 {span}개월)</span>}
          </label>
          <input type="number" className="premium-input" placeholder="예: 84" value={ap.gapMonths || ""}
            onChange={(e) => set({ gapMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>중단 사유</label>
          <select className="premium-input" value={ap.gapReason}
            onChange={(e) => set({ gapReason: e.target.value as AdditionalPaymentState["gapReason"] })}>
            <option value="EXEMPT">납부예외 (실직·휴직·사업중단)</option>
            <option value="EXCLUDED">적용제외 (무소득 배우자 등)</option>
            <option value="MILITARY">군복무</option>
            <option value="ARREARS">체납 (미납)</option>
          </select>
          <span style={styles.labelHint}>{GAP_REASON_HINT[ap.gapReason]}</span>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>현재 가입 상태</label>
          <select className="premium-input" value={ap.enrollStatus}
            onChange={(e) => set({ enrollStatus: e.target.value as AdditionalPaymentState["enrollStatus"] })}>
            <option value="WORKPLACE">사업장가입자 (직장)</option>
            <option value="REGIONAL">지역가입자</option>
            <option value="VOLUNTARY">임의가입자</option>
            <option value="VOLUNTARY_CONT">임의계속가입자 (60세 이후)</option>
            <option value="NONE">미가입</option>
          </select>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 수령 여부</label>
          <select className="premium-input" value={ap.receivedLumpSumRefund ? "Y" : "N"}
            onChange={(e) => set({ receivedLumpSumRefund: e.target.value === "Y" })}>
            <option value="N">받은 적 없음</option>
            <option value="Y">받은 적 있음</option>
          </select>
        </div>
      </div>

      <h4 style={styles.sectionTitle}>② 추납 조건</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>추납 희망 개월수 <span style={styles.labelHint}>(가능: {plan.eligibility.maxMonths}개월)</span></label>
          <input type="number" className="premium-input" value={ap.requestedMonths || ""}
            onChange={(e) => set({ requestedMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            추납 기준소득월액 (만원)
            <span style={styles.labelHint}>
              {isVoluntary
                ? ` (임의가입: ${NPS_RULES.voluntaryIncomeFloor}~${Math.floor(NPS_RULES.aValue)}만원, 신청일 기준 A값 상한)`
                : ` (${NPS_RULES.incomeFloor}~${NPS_RULES.incomeCap}만원)`}
            </span>
          </label>
          <input type="number" className="premium-input" value={ap.baseIncome || ""}
            onChange={(e) => set({ baseIncome: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            신청 년월 {ap.applyYm && <span style={styles.labelHint}>(첫 납부기한: {firstDueYmOf(ap.applyYm)} 말일)</span>}
          </label>
          <input type="month" className="premium-input" value={ap.applyYm}
            onChange={(e) => set({ applyYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>납부 방식</label>
          <select className="premium-input" value={ap.paymentMode}
            onChange={(e) => set({ paymentMode: e.target.value as AdditionalPaymentState["paymentMode"] })}>
            <option value="LUMP">일시납</option>
            <option value="INSTALLMENT">분납</option>
          </select>
        </div>
        {ap.paymentMode === "INSTALLMENT" && (
          <>
            <div style={styles.fieldRow}>
              <label style={styles.label}>분납 횟수 <span style={styles.labelHint}>(최대 {NPS_RULES.maxInstallments}회)</span></label>
              <input type="number" className="premium-input" value={ap.installments || ""}
                onChange={(e) => set({ installments: Number(e.target.value) })} />
            </div>
            <div style={styles.fieldRow}>
              <label style={styles.label}>분납이자율 (%/년) <span style={styles.labelHint}>(1년 만기 정기예금 이자율)</span></label>
              <input type="number" step="0.1" className="premium-input" value={ap.installmentInterestRate}
                onChange={(e) => set({ installmentInterestRate: Number(e.target.value) })} />
            </div>
          </>
        )}
        <div style={styles.fieldRow}>
          <label style={styles.label}>한계세율 (%) <span style={styles.labelHint}>(소득공제 환급 추정, 소득 없으면 0)</span></label>
          <input type="number" step="0.1" className="premium-input" value={ap.marginalTaxRate}
            onChange={(e) => set({ marginalTaxRate: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>대시보드 시뮬레이션에 반영</label>
          <select className="premium-input" value={ap.applyToSimulation ? "Y" : "N"}
            onChange={(e) => set({ applyToSimulation: e.target.value === "Y" })}>
            <option value="N">반영 안 함</option>
            <option value="Y">추납 후 연금액으로 반영</option>
          </select>
        </div>
      </div>

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>③ 추납 결과 요약</h4>
        {plan.eligibility.issues.map((msg) => (
          <div key={msg} style={{ ...styles.warnAlert, marginBottom: "8px" }}>⚠ {msg}</div>
        ))}
        {plan.months > 0 && ap.applyYm ? (
          <div style={styles.previewGrid}>
            <div>추납 개월수: <strong>{plan.months}개월</strong> ({plan.increase.totalMonthsBefore} → {plan.increase.totalMonthsAfter}개월)</div>
            <div>추납 보험료: <strong>{fmt(plan.cost.total)} 만원</strong> {ap.paymentMode === "INSTALLMENT" && `(일시납 ${fmt(plan.cost.lumpSumTotal)} 만원)`}</div>
            <div>소득공제 환급 추정: <strong>{fmt(plan.taxRefund)} 만원</strong> → 순비용 <strong>{fmt(plan.netCost)} 만원</strong></div>
            <div>
              예상 연금 월액: <strong>{plan.increase.beforeMonthly.toFixed(1)} → {plan.increase.afterMonthly.toFixed(1)} 만원</strong>{" "}
              <strong style={{ color: "var(--text-accent)" }}>(+{plan.increase.deltaMonthly.toFixed(1)})</strong>
            </div>
            <div>
              손익분기: <strong style={{ color: "var(--text-accent)" }}>
                {plan.breakEven.breakEvenAge === null ? "기대수명 내 회수 불가" : `${plan.breakEven.breakEvenAge}세 (수령 ${plan.breakEven.yearsToBreakEven}년차)`}
              </strong>
            </div>
            <div>기대수명({store.simulationParams.expectedLifeExpectancy}세)까지 순이익: <strong>{fmt(plan.breakEven.lifetimeGain)} 만원</strong></div>
          </div>
        ) : (
          plan.eligibility.eligible && <div style={styles.labelHint}>추납 희망 개월수와 신청 년월을 입력하면 결과가 계산됩니다.</div>
        )}
        {plan.warnings.map((msg) => (
          <div key={msg} style={{ ...styles.warnAlert, marginTop: "8px" }}>⚠ {msg}</div>
        ))}
        <p style={{ ...styles.labelHint, marginTop: "10px" }}>
          ※ 현재가치 기준 추정치입니다. 정확한 추납 보험료와 연금 증가액은 국민연금공단(☎1355, 내곁에국민연금 앱) 추납 예상액 조회로 확인하세요.
        </p>
      </div>
    </div>
  );
}

// onboarding/page.tsx의 스타일 값과 동일하게 맞춤 (warnAlert·sectionTitle만 신규)
const styles: { [key: string]: React.CSSProperties } = {
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
  warnAlert: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    borderLeft: "3px solid rgba(245, 158, 11, 0.7)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0" },
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
};
```

- [ ] **Step 2: onboarding 페이지 수정**

(a) import 추가 (`import { resolveAge } from "@/utils/age";` 아래):

```tsx
import AdditionalPaymentPanel from "@/components/AdditionalPaymentPanel";
```

(b) `:23` 입력 모드 타입·기본값 교체 — SIMPLE 제거, 기본 탭은 상세 입력:

```tsx
  const [nationalInputMode, setNationalInputMode] = useState<"DETAILED" | "PDF" | "SYNC" | "ADDITIONAL">("DETAILED");
```

(c) `:556-590` `handleSimpleNationalCalculate` 함수 전체 삭제. 호출처는 SIMPLE 블록뿐이다.

(d) `:1002-1011` 「간편 시뮬레이션 입력」 버튼 삭제. `:1022-1032` PDF 탭 버튼 뒤(= 맨 오른쪽)에 추가:

```tsx
                  <button
                    onClick={() => setNationalInputMode("ADDITIONAL")}
                    style={{
                      ...styles.tabButton,
                      borderBottomColor: nationalInputMode === "ADDITIONAL" ? "var(--primary)" : "transparent",
                      color: nationalInputMode === "ADDITIONAL" ? "var(--primary)" : "var(--text-secondary)",
                    }}
                    id="btn-tab-nps-additional"
                  >
                    ➕ 추가납부 대상 등록
                  </button>
```

(e) `:1035-1102` `{nationalInputMode === "SIMPLE" && (...)}` 블록 전체 삭제. `{nationalInputMode === "PDF" && renderPdfUploadSection()}` 다음 줄에:

```tsx
                {nationalInputMode === "ADDITIONAL" && <AdditionalPaymentPanel />}
```

- [ ] **Step 3: 정적 검증**

Run: `grep -n "SIMPLE\|handleSimpleNationalCalculate\|간편 시뮬레이션" src/app/onboarding/page.tsx`
Expected: 결과 없음
Run: `npx tsc --noEmit && npm run lint -- src/components/AdditionalPaymentPanel.tsx src/app/onboarding/page.tsx`
Expected: 새 에러 없음

- [ ] **Step 4: 브라우저 확인** (`npm run dev` → `/onboarding` → STEP 1)
  - 탭 순서 「NPS 공단고서 상세 입력 | 📄 금융감독원 통합연금 자료 등록 | ➕ 추가납부 대상 등록」, 처음 진입 시 상세 입력 탭 선택.
  - 상세 입력 탭: 현재 기준 월소득액 300, 총 예상 가입월수 300, 예상 연금 월액 80, A값 319.35, B값 300.
  - 추가납부 탭: 최초 1998-03, 지속 2008-03, 중단 84, 납부예외, 지역가입자, 희망 84, 기준소득 100, 신청 2026-10(→ 첫 납부기한 2026-11 표시), 일시납, 한계세율 16.5.
  - Expected: 추납 보험료 798 만원, 환급 132 만원 → 순비용 666 만원, 연금 80.0 → 96.0 (+16.0), 손익분기 68세(4년차). (Task 4 검증값과 동일)
  - 신청 년월 2026-12 → 추납 보험료 840 만원 + 「12월에 신청하면…」 경고.
  - 중단 사유 「체납」 → 경고 표시, 결과 사라짐. 분납 24회 → "일시납보다 약 79만원 더" 경고.
  - 새로고침 후에도 입력값 유지(persist).

- [ ] **Step 5: Commit**

```bash
git add src/components/AdditionalPaymentPanel.tsx src/app/onboarding/page.tsx
git commit -m "feat: 국민연금 간편 시뮬레이션을 추가납부 대상 등록 탭으로 교체"
```

---

### Task 6: 인사이트 — 일시납 vs 분납 비교표 · 기준소득 비교표 · 누적 수령 차트 · 분납 요율표 · 현행법 가이드

**Files:**
- Create: `src/components/AdditionalPaymentInsights.tsx`
- Modify: `src/components/AdditionalPaymentPanel.tsx` (import 1줄 + 렌더 1줄)

**Interfaces:**
- Consumes: `AdditionalPaymentPlan` 타입 (Task 4)
- Produces: `export default function AdditionalPaymentInsights({ plan, paymentMode }: { plan: AdditionalPaymentPlan; paymentMode: "LUMP" | "INSTALLMENT" })`

- [ ] **Step 1: 컴포넌트 작성** (`src/components/AdditionalPaymentInsights.tsx`)

작성 전 `grep -n "ReferenceLine\|LineChart\|ResponsiveContainer" node_modules/recharts/types/index.d.ts`로 Recharts 3 export 이름을 확인한다.

```tsx
"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { AdditionalPaymentPlan } from "@/services/additionalPaymentCalculator";

const fmt = (v: number) => Math.round(v).toLocaleString();

interface Props {
  plan: AdditionalPaymentPlan;
  paymentMode: "LUMP" | "INSTALLMENT";
}

export default function AdditionalPaymentInsights({ plan, paymentMode }: Props) {
  // 분납 회차를 연도별로 묶어 요율·금액 표시
  const byYear = new Map<string, { rate: number; count: number; amount: number }>();
  plan.cost.rows.forEach((r) => {
    const y = r.dueYm.slice(0, 4);
    const prev = byYear.get(y) || { rate: r.rate, count: 0, amount: 0 };
    byYear.set(y, { rate: r.rate, count: prev.count + 1, amount: prev.amount + r.principal + r.interest });
  });

  // 순이익이 가장 큰 납부 방식 강조
  const bestGain = Math.max(...plan.paymentOptions.map((o) => o.lifetimeGain));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={styles.box}>
        <h4 style={styles.title}>④ 일시납 vs 분할납부 비교 ({plan.months}개월 추납)</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>납부 방식</th>
                <th style={styles.th}>총 납부액 (이자)</th>
                <th style={styles.th}>회차당 납부액</th>
                <th style={styles.th}>완납 월</th>
                <th style={styles.th}>순비용 (환급 후)</th>
                <th style={styles.th}>연금 증가(월)</th>
                <th style={styles.th}>손익분기</th>
                <th style={styles.th}>기대수명까지 순이익</th>
              </tr>
            </thead>
            <tbody>
              {plan.paymentOptions.map((o) => (
                <tr key={o.label} style={o.lifetimeGain === bestGain ? styles.bestRow : undefined}>
                  <td style={styles.td}>{o.label}</td>
                  <td style={styles.td}>{fmt(o.total)} 만원 ({fmt(o.interest)})</td>
                  <td style={styles.td}>
                    {o.installments === 1 ? "-" : `${o.monthlyMin.toFixed(1)}~${o.monthlyMax.toFixed(1)} 만원`}
                  </td>
                  <td style={styles.td}>{o.lastDueYm}</td>
                  <td style={styles.td}>{fmt(o.netCost)} 만원</td>
                  <td style={styles.td}>+{o.deltaMonthly.toFixed(1)} 만원</td>
                  <td style={styles.td}>{o.breakEvenAge === null ? "회수 불가" : `${o.breakEvenAge}세`}</td>
                  <td style={styles.td}>{fmt(o.lifetimeGain)} 만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          수령액(연금 증가)은 납부 방식과 관계없이 같고, 분납은 해가 바뀐 회차의 인상 요율과 분할납부이자(1년 만기 정기예금 이자율, 1년 단위 복리)만큼 더 냅니다.
          실제 이자율은 해마다 바뀌므로 정확한 금액은 공단이 발급하는 분할납부계획서로 확인하세요.
        </p>
      </div>

      <div style={styles.box}>
        <h4 style={styles.title}>기준소득월액별 비교 ({plan.months}개월 추납, 세전)</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>기준소득월액</th>
              <th style={styles.th}>추납액</th>
              <th style={styles.th}>연금 증가(월)</th>
              <th style={styles.th}>회수 기간</th>
            </tr>
          </thead>
          <tbody>
            {plan.comparisons.map((o) => (
              <tr key={o.label}>
                <td style={styles.td}>{o.label} · {fmt(o.baseIncome)}만원</td>
                <td style={styles.td}>{fmt(o.cost)} 만원</td>
                <td style={styles.td}>+{o.deltaMonthly.toFixed(1)} 만원</td>
                <td style={styles.td}>{o.yearsToBreakEven === null ? "회수 불가" : `${o.yearsToBreakEven}년`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={styles.note}>
          국민연금은 소득이 낮을수록 낸 돈 대비 많이 받도록 설계되어 있어, 금액을 높이기보다 <strong>적은 금액으로 가능한 한 긴 기간</strong>을 채우는 편이 회수가 빠릅니다.
        </p>
      </div>

      <div style={styles.box}>
        <h4 style={styles.title}>누적 추가 수령액 vs 순비용 (현재가치)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={plan.breakEven.cumulative} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="age" tickFormatter={(v) => `${v}세`} stroke="var(--text-muted)" fontSize={12} />
            <YAxis tickFormatter={(v) => `${fmt(v)}`} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip formatter={(v) => `${fmt(Number(v))} 만원`} labelFormatter={(l) => `${l}세`} />
            <Legend />
            <Line type="monotone" dataKey="received" name="누적 추가 수령액" stroke="var(--primary)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cost" name="순비용" stroke="#f59e0b" strokeDasharray="6 4" dot={false} />
            {plan.breakEven.breakEvenAge !== null && (
              <ReferenceLine
                x={plan.breakEven.breakEvenAge}
                stroke="var(--success-light)"
                label={{ value: "손익분기", fill: "var(--success-light)", fontSize: 12 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {paymentMode === "INSTALLMENT" && (
        <div style={styles.box}>
          <h4 style={styles.title}>분납 연도별 보험료율</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>연도</th>
                <th style={styles.th}>적용 요율</th>
                <th style={styles.th}>회차</th>
                <th style={styles.th}>납부액(이자 포함)</th>
              </tr>
            </thead>
            <tbody>
              {[...byYear.entries()].map(([year, v]) => (
                <tr key={year}>
                  <td style={styles.td}>{year}년</td>
                  <td style={styles.td}>{v.rate.toFixed(1)}%</td>
                  <td style={styles.td}>{v.count}회</td>
                  <td style={styles.td}>{fmt(v.amount)} 만원</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={styles.note}>
            2025.11.25 개정 국민연금법에 따라 추납 보험료율은 납부기한이 속하는 달 기준입니다. 해가 바뀐 회차부터 오른 요율이 적용된다고 가정했습니다(정확한 적용 방식은 공단 확인).
          </p>
        </div>
      )}

      <div style={styles.box}>
        <h4 style={styles.title}>추납 의사결정 가이드 (현행법 기준)</h4>
        <ol style={styles.guide}>
          <li><strong>목돈이 있다면</strong> 같은 해 안에 일시납으로 끝내세요. 보험료율은 매년 1월 0.5%p씩 올라 2033년 13%가 됩니다. 첫 납부기한은 신청 다음 달이므로 <strong>12월 신청은 다음 해 요율</strong>이 적용됩니다.</li>
          <li><strong>목돈이 없다면</strong> 분납(최대 60회)이 가능하지만, 해가 바뀐 회차부터 오른 요율과 분납이자(1년 정기예금 이자율)가 붙습니다. 횟수를 줄이거나 연내에 끝내는 편이 유리합니다.</li>
          <li><strong>종합소득세율이 높은 직장인·사업자</strong>는 여러 해에 나눠 내면 해마다 소득공제를 받아 환급이 커질 수 있습니다. 소득이 없는 임의가입자(전업주부 등)에게는 해당되지 않습니다.</li>
          <li><strong>가입기간이 10년 미만</strong>이면 추납으로 10년을 채우는 것이 가장 큰 효과입니다(노령연금 수급권 확보).</li>
          <li>반환일시금을 받은 적이 있다면 <strong>반납</strong>이 먼저입니다. 신청 후 <strong>연금 수급이 시작되면 납부할 수 없고</strong>, 납부기한을 넘기면 가산이자가 붙습니다.</li>
          <li>신청 시 <strong>혼인관계증명서</strong>(상세, 주민등록번호 표시)를 제출해야 합니다. 문의: 국민연금 고객센터 1355.</li>
        </ol>
        <a href="/NPS_Additional_Payment_Plan.pdf" target="_blank" rel="noopener noreferrer" style={styles.link}>
          📄 연금 정보창고: 국민연금 추가납부 플랜 자료 보기 ↗
        </a>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
  },
  title: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600 },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  bestRow: { backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: 600 },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
  guide: { fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: "18px", margin: 0 },
  link: { display: "inline-block", marginTop: "10px", fontSize: "0.8rem", color: "var(--primary-light)", textDecoration: "underline" },
};
```

- [ ] **Step 2: 패널에 연결** (`AdditionalPaymentPanel.tsx`)

import 추가:

```tsx
import AdditionalPaymentInsights from "@/components/AdditionalPaymentInsights";
```

③ 결과 요약 `previewBox`의 닫는 `</div>` 바로 뒤(최상위 flex 컨테이너 닫기 전)에:

```tsx
      {plan.months > 0 && ap.applyYm && <AdditionalPaymentInsights plan={plan} paymentMode={ap.paymentMode} />}
```

- [ ] **Step 3: 정적 검증**

Run: `npx tsc --noEmit && npm run lint -- src/components/AdditionalPaymentInsights.tsx src/components/AdditionalPaymentPanel.tsx`
Expected: 새 에러 없음

- [ ] **Step 4: 브라우저 확인** (Task 5 Step 4 입력값 그대로)
  - 일시납 vs 분납표(분납 횟수 기본 12): 일시납 798 / 순비용 666 / 68세 / 순이익 3,367(강조), 분납 12회 844 / 회차당 66.6~71.8 / 2027-10 완납, 분납 24회 877 / 2028-10, 분납 60회 979(이자 62) / 2031-10 / 69세 / 3,205. 연금 증가는 모두 +16.0. 좁은 화면에서 표가 가로 스크롤.
  - 기준소득 비교표: 최소 100만원 → 798만원 / +16.0 / 5년, A값 319만원 → 2,548만원 / +24.0 / 9년.
  - 차트: 65~85세 누적선이 순비용선(666)을 68세에서 넘고 「손익분기」 세로선 표시. 라이트/다크 테마 모두 선·글자가 보임.
  - 분납 24회 선택 시 연도별 표: 2026년 9.5% 2회 / 2027년 10.0% 12회 / 2028년 10.5% 10회, 일시납 vs 분납표에 「분납 24회」 행이 중복 없이 1개.
  - 가이드의 PDF 링크가 새 탭에서 열림.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdditionalPaymentInsights.tsx src/components/AdditionalPaymentPanel.tsx
git commit -m "feat: 추납 기준소득 비교표·손익분기 차트·의사결정 가이드"
```

---

### Task 7: 대시보드·AI 어드바이저에 추납 반영 + 기능 문서화

**Files:**
- Modify: `src/app/dashboard/page.tsx:228-250`
- Modify: `src/app/dashboard/ai-advisor/page.tsx` (`store.nationalPension`을 계산기·AI 요청에 넘기는 `:276`, `:493` 부근)
- Modify: `docs/features.md`

**Interfaces:**
- Consumes: `applyAdditionalPayment(national, ap, params): NationalPensionState` (Task 4)
- Produces: 없음 (최종 통합)

- [ ] **Step 1: 대시보드** — import 추가 후, `runPensionSimulation` 호출 바로 위에 반영값 계산, 두 계산기 호출의 첫 인자를 교체

```tsx
import { applyAdditionalPayment } from "@/services/additionalPaymentCalculator";
```

```tsx
  // 추가납부 탭에서 「대시보드 반영」을 켠 경우 추납 후 국민연금 값으로 시뮬레이션
  const nationalForSim = applyAdditionalPayment(store.nationalPension, store.additionalPayment, store.simulationParams);

  // Run the basic pension simulation based on store states
  const simulation = runPensionSimulation(
    nationalForSim,
    store.basicPension,
```

`runWithdrawalSimulation(` 호출의 첫 인자 `store.nationalPension,`도 `nationalForSim,`으로 교체. (`:143` 백업, `:190` 리다이렉트 조건의 `store.nationalPension`은 원본 유지)

- [ ] **Step 2: AI 어드바이저 페이지** — 파일을 읽고, `store.nationalPension`이 **계산기 인자**나 **AI API 요청 body**로 쓰이는 곳만 `nationalForSim`으로 교체(리다이렉트 조건 `:258-261`은 원본 유지). import는 Step 1과 같고, 선언은 `const store = usePensionStore();` 아래에 한 번:

```tsx
  const nationalForSim = applyAdditionalPayment(store.nationalPension, store.additionalPayment, store.simulationParams);
```

API 라우트(`src/app/api/ai/advisor/route.ts`)는 받은 `nationalPension`을 그대로 쓰므로 수정 불필요.

- [ ] **Step 3: 기능 문서** — `docs/features.md` 끝에 추가

```markdown
- **[FEAT-015] 국민연금 추가납부(추납) 대상 등록 및 손익분기 시뮬레이션**: 온보딩 STEP 1의 간편 시뮬레이션을 대체. 최초 가입년월·지속 가입개시 년월·중단 기간·사유·가입 상태로 추납 자격(최대 119개월)을 판정하고, 납부기한월 보험료율(2026년 9.5%→2033년 13%, 첫 납부기한 = 신청 다음 달) 기준 일시납/분납 추납액(분할납부이자 1년 단위 복리), 일시납 vs 분납 12·24·60회 납부·수령 비교표, 소득공제 환급, 추납 후 연금 월액, 현재가치 손익분기 나이, 기준소득월액 3안 비교를 제공. 룰셋 `src/config/npsRules.ts`, 대시보드 반영 토글 지원. 연금 정보창고에 「국민연금 추가납부 플랜」 PDF 추가 (Sprint 25)
```

- [ ] **Step 4: 전체 검증**

Run: `npx tsx scratch/validateAdditionalPayment.ts` → `Additional payment validation success!`
Run: `npx tsx scratch/validateWithdrawal.ts` → `Validation success!` (기존 인출 엔진 회귀 없음)
Run: `npx tsc --noEmit` → 새 에러 없음
Run: `npm run lint` → 새 에러 없음
브라우저: 추가납부 탭에서 「추납 후 연금액으로 반영」 선택 → `/dashboard` 국민연금 월 수령액이 80 → 96으로 바뀌고, 끄면 80으로 복귀. `/dashboard/ai-advisor` 진단 요청 시 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/ai-advisor/page.tsx docs/features.md
git commit -m "feat: 추납 결과를 대시보드·AI 어드바이저 시뮬레이션에 반영"
```

---

## 범위 밖 (이번 계획에서 하지 않음)

- **Prisma/DB 저장**: `api/onboarding`은 `NationalPension`만 저장한다. 추납 입력의 DB 저장은 스키마 마이그레이션이 필요하므로 별도 승인 후 진행.
- **여러 개의 중단 구간**: 이번엔 합계 개월수 1개 + 사유 1개. 사유가 섞인 구간별 입력(예: 군복무 + 무소득배우자)은 수요 확인 후.
- **적용제외 기간의 시작일 검증**: 공단 기준('99.4.1 이후 무소득배우자 등)은 안내 문구로만 제공. 중단 구간의 시작·종료 년월을 받게 되면 자동 검증으로 확장.
- **기존 계산기의 보험료율 일정 오류(별도 이슈)**: `pensionCalculator.ts:82-94`는 세대별 차등 인상(연 0.25~1.0%p)을 쓰는데, 이는 정부안이었고 국회 통과안은 전 세대 매년 0.5%p 동일 인상이다. 이 계획은 새 룰셋의 `premiumRateForYear()`만 쓰며, 기존 계산기 수정은 별도 작업으로 분리한다.
- 부양가족연금, 조기/연기 수령 감액·가산과 추납의 결합 효과.
