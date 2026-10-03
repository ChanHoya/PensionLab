// 적립 플랜: 매월 일정액을 몇 년 넣고(적립), 몇 년 묵힌 뒤(거치), 몇 년간 연금으로 나눠 받는지(수령) 계산한다.
// 운용수익은 월복리, 납입액은 선택에 따라 매년 물가만큼 늘린다. 결과는 현재가치(물가 할인)와 명목을 함께 낸다.
// 수령액은 실질 수익률로 수령 기간 동안 같은 구매력이 유지되도록 나눈다 (세전).

export interface SavingsPlanInput {
  monthly: number; // 월 납입액 (만원, 첫해 기준)
  contributeYears: number; // 적립 기간
  holdYears: number; // 거치 기간 (넣지도 빼지도 않음)
  payoutYears: number; // 수령 기간
  returnRate: number; // 기대 운용수익률 (연 %, 명목)
  inflationRate: number; // 물가상승률 (연 %)
  indexed: boolean; // 납입액을 매년 물가만큼 늘림
}

export interface SavingsPlanResult {
  payoutStartAge: number;
  potNominal: number; // 수령 시작 때 적립금 (명목, 만원)
  potReal: number; // 같은 금액의 현재가치
  totalPaid: number; // 낸 돈 합계 (명목)
  monthlyPayoutReal: number; // 월 수령액 (현재가치)
  monthlyPayoutNominal: number; // 수령 첫해 월 수령액 (명목)
  path: { age: number; real: number }[]; // 연말 적립금 잔액 (현재가치)
}

const monthlyRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

export function runSavingsPlan(p: SavingsPlanInput, startAge: number): SavingsPlanResult {
  const im = monthlyRate(p.inflationRate);
  const rm = monthlyRate(p.returnRate);
  const rr = monthlyRate(((1 + p.returnRate / 100) / (1 + p.inflationRate / 100) - 1) * 100); // 실질 월 수익률
  const accMonths = Math.max(0, Math.round(p.contributeYears * 12));
  const n = accMonths + Math.max(0, Math.round(p.holdYears * 12));
  const path = [{ age: startAge, real: 0 }];

  let pot = 0;
  let paid = 0;
  for (let k = 0; k < n; k++) {
    if (k < accMonths) {
      const c = p.monthly * (p.indexed ? Math.pow(1 + im, Math.floor(k / 12) * 12) : 1);
      pot += c;
      paid += c;
    }
    pot *= 1 + rm;
    if ((k + 1) % 12 === 0) path.push({ age: startAge + (k + 1) / 12, real: pot / Math.pow(1 + im, k + 1) });
  }
  const potReal = pot / Math.pow(1 + im, n);
  const P = Math.max(0, Math.round(p.payoutYears * 12));
  const payout = P === 0 ? 0 : Math.abs(rr) < 1e-12 ? potReal / P : (potReal * rr) / (1 - Math.pow(1 + rr, -P));

  let bal = potReal;
  for (let k = 0; k < P; k++) {
    bal = bal * (1 + rr) - payout;
    if ((k + 1) % 12 === 0) path.push({ age: startAge + (n + k + 1) / 12, real: Math.max(0, bal) });
  }
  return {
    payoutStartAge: startAge + n / 12,
    potNominal: pot,
    potReal,
    totalPaid: paid,
    monthlyPayoutReal: payout,
    monthlyPayoutNominal: payout * Math.pow(1 + im, n),
    path,
  };
}

// 부족액을 메우는 데 필요한 월 납입액: 은퇴 후 매달 모자라는 금액(현재가치)과 한 번에 필요한 금액(현재가치, 예: 자녀 지원 미충당분)
// 결과는 납입액에 비례하므로 월 1만원 기준 결과로 나눠 구한다
export function requiredMonthly(gapMonthlyReal: number, lumpReal: number, p: Omit<SavingsPlanInput, "monthly">, startAge: number): number {
  const unit = runSavingsPlan({ ...p, monthly: 1 }, startAge);
  const forIncome = unit.monthlyPayoutReal > 0 ? gapMonthlyReal / unit.monthlyPayoutReal : 0;
  const forLump = unit.potReal > 0 ? lumpReal / unit.potReal : 0;
  return forIncome + forLump;
}

// 연금저축·IRP 세액공제: 연 900만원 한도, 총급여 5,500만원 이하 16.5% / 초과 13.2% (지방소득세 포함)
export const PENSION_CREDIT_LIMIT = 900;
export function annualTaxCredit(monthly: number, lowIncome: boolean): number {
  return Math.min(monthly * 12, PENSION_CREDIT_LIMIT) * (lowIncome ? 0.165 : 0.132);
}
