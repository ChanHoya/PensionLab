import { NPS_RULES, premiumRateForYear } from "@/config/npsRules";
import { checkEligibility, effectiveBaseIncome, isVoluntary, runAdditionalPaymentPlan } from "@/services/additionalPaymentCalculator";
import { calcRepaymentCost, estimateCombinedPension, isRepaymentReady, restoredWeights } from "@/services/returnRepaymentCalculator";
import type { PersonData, SimulationParamsState } from "@/store/usePensionStore";

// 국민연금 증액 로드맵: 반납 → 추납 → 임의계속가입(60세~개시 전) → 연기연금 순서로 쌓았을 때 단계별 월 연금과 비용.
// 금액은 국민연금 예상액과 같은 현재가치(만원/월) 기준. 반납·추납은 입력된 정보로 계산하고(대시보드 반영 여부와 무관),
// 임의계속가입·연기는 화면에서 고른 옵션으로 계산한다.

export type BoostStepKey = "base" | "repay" | "additional" | "voluntary" | "defer";
export type BoostStatus = "available" | "needsInput" | "notApplicable";

export interface BoostStep {
  key: BoostStepKey;
  label: string;
  monthly: number; // 이 단계까지 쌓은 월 연금 (연기는 연기 후 받는 금액)
  delta: number; // 이 단계로 늘어난 월 연금
  cost: number; // 드는 돈 (만원): 반납금, 추납 순비용, 임의계속 보험료, 연기로 미루는 수령액
  paybackYears: number | null; // 비용 ÷ 연간 증가액 (단순 회수 기간)
  status: BoostStatus;
  note: string;
}

export interface BoostOptions {
  useVoluntary: boolean; // 60세 이후 임의계속가입
  voluntaryIncome: number; // 임의계속가입 기준소득월액 (만원)
  deferYears: number; // 연기 0~5년
  deferShare: number; // 연기 비율 0.5~1 (부분 연기연금)
}

export interface BoostRoadmap {
  steps: BoostStep[];
  baseMonthly: number;
  finalMonthly: number; // 모든 단계 후 (연기 끝난 뒤) 월 연금
  multiple: number | null; // finalMonthly ÷ baseMonthly
  startAge: number; // 정상 개시 나이
  deferEndAge: number; // 연기 끝나는 나이
  partialMonthly: number; // 연기 기간에 받는 금액 (전액 연기면 0)
  voluntaryMonths: number;
  overDependentCap: boolean; // 최종 연금이 건보 피부양자 소득기준(연 2,000만원) 초과
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function buildBoostRoadmap(
  person: PersonData,
  params: SimulationParamsState, // 그 사람 기준 (배우자는 personParams(params, "SPOUSE"))
  startAge: number, // 그 사람의 국민연금 정상 개시 나이
  options: BoostOptions,
  baseYear: number = new Date().getFullYear()
): BoostRoadmap {
  const national = person.nationalPension;
  const ap = person.additionalPayment;
  const rr = person.returnRepayment;
  const base = national.expectedMonthlyPension || 0;
  // 예상 연금액은 있는데 총 예상 가입월수가 비어 있으면 증가액을 계산할 근거가 없다 (applyNpsOptions와 같은 기준)
  const noBasis = national.expectedTotalContributionMonths < NPS_RULES.minPensionMonths && base > 0;
  const steps: BoostStep[] = [
    { key: "base", label: "현재 예상", monthly: round1(base), delta: 0, cost: 0, paybackYears: null, status: "available", note: "공단 예상연금월액 (60세까지 납부 가정)" },
  ];
  const push = (key: BoostStepKey, label: string, monthly: number, cost: number, status: BoostStatus, note: string) => {
    const prev = steps[steps.length - 1].monthly;
    const ok = status === "available";
    const m = ok ? round1(monthly) : prev;
    const delta = round1(m - prev);
    steps.push({
      key,
      label,
      monthly: m,
      delta,
      cost: ok ? Math.round(cost) : 0,
      paybackYears: ok && delta > 0 && cost > 0 ? round1(cost / (delta * 12)) : null,
      status,
      note,
    });
  };

  // 1) 반납: 반환일시금을 받은 적이 있고 반납 정보가 다 있으면 복원 기간을 되살린다
  const repayReady = !noBasis && ap.receivedLumpSumRefund && isRepaymentReady(rr);
  const restored = repayReady ? { months: rr.restoredMonths, ...restoredWeights(rr) } : { months: 0, wA: 0, wB: 0 };
  if (repayReady) {
    const after = estimateCombinedPension(national, restored, { months: 0, income: 0 }).afterMonthly;
    push("repay", "반납", after, calcRepaymentCost(rr).total, "available", `반환일시금 복원 ${rr.restoredMonths}개월 (당시 높은 소득대체율 적용)`);
  } else if (ap.receivedLumpSumRefund) {
    push("repay", "반납", 0, 0, "needsInput", "반환일시금 수령 이력이 있습니다. 반납 정보(원금·복원 개월수·수령년월)를 입력하면 계산됩니다");
  } else {
    push("repay", "반납", 0, 0, "notApplicable", "반환일시금을 받은 적이 없어 해당 없음");
  }

  // 2) 추납: 희망 개월수(없으면 대상 최대)만큼 납부예외·적용제외·군복무 기간을 채운다
  const eligibility = checkEligibility(ap);
  const addMonths = eligibility.eligible ? (ap.requestedMonths > 0 ? Math.min(ap.requestedMonths, eligibility.maxMonths) : eligibility.maxMonths) : 0;
  const addIncome = effectiveBaseIncome(isVoluntary(ap) ? ap : { ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome });
  let added = { months: 0, income: 0 };
  if (noBasis) {
    push("additional", "추납", 0, 0, "needsInput", "총 예상 가입월수를 입력하면 계산됩니다");
  } else if (addMonths > 0) {
    const applyYm = ap.applyYm || `${baseYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const plan = runAdditionalPaymentPlan({ ...ap, requestedMonths: addMonths, applyYm }, national, params);
    added = { months: addMonths, income: addIncome };
    const after = estimateCombinedPension(national, restored, added).afterMonthly;
    push("additional", "추납", after, plan.netCost, "available", `납부예외 등 ${addMonths}개월 추납 (연말정산 소득공제 환급 차감)`);
  } else if (ap.gapMonths > 0) {
    push("additional", "추납", 0, 0, "needsInput", eligibility.issues[0] ?? "추납 정보를 확인하세요");
  } else {
    push("additional", "추납", 0, 0, "notApplicable", "추납 대상 기간(납부예외·적용제외·군복무)이 없으면 해당 없음");
  }

  // 3) 임의계속가입: 60세(또는 지금)부터 정상 개시 전까지 계속 납부 (최대 60개월)
  const voluntaryMonths = Math.max(0, Math.min(60, (startAge - Math.max(60, params.currentAge)) * 12));
  if (!options.useVoluntary) {
    push("voluntary", "임의계속가입", 0, 0, "notApplicable", "선택하지 않음");
  } else if (noBasis) {
    push("voluntary", "임의계속가입", 0, 0, "needsInput", "총 예상 가입월수를 입력하면 계산됩니다");
  } else if (voluntaryMonths <= 0) {
    push("voluntary", "임의계속가입", 0, 0, "notApplicable", "이미 연금 개시 나이라 해당 없음");
  } else {
    const income = Math.min(NPS_RULES.aValue, Math.max(NPS_RULES.voluntaryIncomeFloor, options.voluntaryIncome));
    const both = added.months + voluntaryMonths;
    const mixed = { months: both, income: (added.income * added.months + income * voluntaryMonths) / both };
    const after = estimateCombinedPension(national, restored, mixed).afterMonthly;
    // 보험료는 납부하는 해의 요율 (임의계속가입자는 전액 본인 부담)
    let cost = 0;
    const firstYear = baseYear + Math.max(0, 60 - params.currentAge);
    for (let k = 0; k < voluntaryMonths; k++) cost += income * (premiumRateForYear(firstYear + Math.floor(k / 12)) / 100);
    push("voluntary", "임의계속가입", after, cost, "available", `${Math.max(60, params.currentAge)}~${startAge - 1}세 ${voluntaryMonths}개월, 기준소득 월 ${Math.round(income)}만원`);
  }

  // 4) 연기연금: 연기 비율만큼 1년에 7.2%씩 가산 (최대 5년). 연기 기간에도 나머지 비율은 정상 수령
  const beforeDefer = steps[steps.length - 1].monthly;
  const years = Math.max(0, Math.min(NPS_RULES.maxDeferralYears, Math.floor(options.deferYears)));
  const share = Math.max(0.5, Math.min(1, options.deferShare));
  if (years > 0 && beforeDefer > 0) {
    const deferred = beforeDefer * (1 - share) + beforeDefer * share * (1 + NPS_RULES.deferralBonusPerYear * years);
    const forgone = beforeDefer * share * 12 * years;
    push("defer", share < 1 ? `부분 연기(${Math.round(share * 100)}%)` : "연기연금", deferred, forgone, "available", `${startAge}세 → ${startAge + years}세, 연 ${(NPS_RULES.deferralBonusPerYear * 100).toFixed(1)}% 가산`);
  } else {
    push("defer", "연기연금", 0, 0, "notApplicable", beforeDefer > 0 ? "연기하지 않음" : "수급권이 생긴 뒤 선택할 수 있습니다");
  }

  const deferredOn = years > 0 && beforeDefer > 0;
  const finalMonthly = steps[steps.length - 1].monthly;
  return {
    steps,
    baseMonthly: round1(base),
    finalMonthly,
    multiple: base > 0 ? Math.round((finalMonthly / base) * 10) / 10 : null,
    startAge,
    deferEndAge: startAge + (deferredOn ? years : 0),
    partialMonthly: deferredOn ? round1(beforeDefer * (1 - share)) : beforeDefer,
    voluntaryMonths,
    overDependentCap: finalMonthly * 12 > NPS_RULES.dependentIncomeCapAnnual,
  };
}
