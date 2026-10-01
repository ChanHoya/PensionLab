import type { SimulationParamsState } from "@/store/usePensionStore";

/**
 * 노후 지출 규모 패턴 (Spending Curve Pattern)
 * - ACTIVE_FOCUSED: 활동기 집중형 (은퇴 초기 N년은 목표 생활비 100% 유지 후, 매년 일정 비율 완만하게 체감)
 * - SMILING_3STAGE: 3단계 생애주기형 (활동기 100% → 안정기 75% → 간병/노년기 55%)
 * - FLAT: 고정 균등형 (전 기간 동일한 실질 가치 유지)
 */
export type SpendingPattern = "ACTIVE_FOCUSED" | "SMILING_3STAGE" | "FLAT";

export interface SpendingPoint {
  year: number;
  age: number; // 본인 나이
  t: number; // 은퇴 후 경과 연수 (0, 1, 2, ...)
  targetReal: number; // 목표 생활비 (현재가치, 만원/월)
  minReal: number; // 최소 생활비 (현재가치, 만원/월)
  phase: "ACTIVE" | "PASSIVE" | "LATE";
  phaseLabel: string;
}

export const DEFAULT_ACTIVE_YEARS = 5; // 초기 활동기 기본 유지 기간: 5년
export const DEFAULT_ANNUAL_DECLINE_RATE = 2.0; // 이후 연간 감액률 기본값: 2.0%

/**
 * 은퇴 나이부터 기대수명까지 연차별 목표/최소 생활비(현재가치) 곡선을 생성
 */
export function buildSpendingCurve(
  params: SimulationParamsState,
  baseYear: number = new Date().getFullYear()
): Map<number, SpendingPoint> {
  const currentAge = params.currentAge;
  const retAge = params.retirementAge;
  const lifeExp = Math.max(params.expectedLifeExpectancy, params.hasSpouse ? (params.spouseLifeExpectancy || 85) : 85);
  const targetBase = params.targetMonthlySpending || 300;
  const minBase = params.minMonthlySpending || 200;

  const pattern: SpendingPattern = params.spendingPattern || (params.decumulationStrategy === "FLAT" ? "FLAT" : "ACTIVE_FOCUSED");
  const activeYears = params.activePhaseYears ?? DEFAULT_ACTIVE_YEARS;
  const declineRate = (params.annualDeclineRate ?? DEFAULT_ANNUAL_DECLINE_RATE) / 100;

  const curve = new Map<number, SpendingPoint>();
  const totalYears = Math.max(0, lifeExp - currentAge);

  for (let t = 0; t <= totalYears; t++) {
    const age = currentAge + t;
    const year = baseYear + t;
    if (age < retAge) {
      // 은퇴 전: 목표 생활비 기준 그대로
      curve.set(year, {
        year,
        age,
        t,
        targetReal: targetBase,
        minReal: minBase,
        phase: "ACTIVE",
        phaseLabel: "은퇴 전",
      });
      continue;
    }

    const retiredT = age - retAge; // 은퇴 후 0, 1, 2, ...
    let target = targetBase;
    let min = minBase;
    let phase: "ACTIVE" | "PASSIVE" | "LATE" = "ACTIVE";
    let phaseLabel = "초기 활동기";

    if (pattern === "ACTIVE_FOCUSED") {
      if (retiredT < activeYears) {
        target = targetBase;
        min = minBase;
        phase = "ACTIVE";
        phaseLabel = `초기 활동기 (${retiredT + 1}/${activeYears}년)`;
      } else {
        const decayYears = retiredT - activeYears + 1;
        const decayFactor = Math.pow(1 - declineRate, decayYears);
        target = Math.max(minBase, Math.round(targetBase * decayFactor));
        // 최소 생활비도 바닥(150만 또는 minBase의 70%)을 지키며 완만하게 조정
        const minFloor = Math.min(minBase, Math.max(150, Math.round(minBase * 0.7)));
        min = Math.max(minFloor, Math.round(minBase * decayFactor));
        phase = target <= minBase * 1.1 ? "LATE" : "PASSIVE";
        phaseLabel = phase === "LATE" ? "노년기" : "소비 안정기";
      }
    } else if (pattern === "SMILING_3STAGE") {
      if (age <= 70) {
        target = targetBase;
        min = minBase;
        phase = "ACTIVE";
        phaseLabel = "1단계 활동기 (~70세)";
      } else if (age <= 80) {
        target = Math.max(minBase, Math.round(targetBase * 0.75));
        min = Math.max(150, Math.round(minBase * 0.8));
        phase = "PASSIVE";
        phaseLabel = "2단계 안정기 (71~80세)";
      } else {
        target = Math.max(150, Math.round(targetBase * 0.55));
        min = Math.max(150, Math.round(minBase * 0.65));
        phase = "LATE";
        phaseLabel = "3단계 간병기 (81세~)";
      }
    } else {
      // FLAT
      target = targetBase;
      min = minBase;
      phase = retiredT <= 5 ? "ACTIVE" : retiredT <= 15 ? "PASSIVE" : "LATE";
      phaseLabel = "균등 정액식";
    }

    curve.set(year, {
      year,
      age,
      t: retiredT,
      targetReal: target,
      minReal: min,
      phase,
      phaseLabel,
    });
  }

  return curve;
}

/**
 * 특정 연차(경과 연수)의 상대 지출 가중치 (은퇴 시점 = 1.0)
 */
export function getSpendingMultiplier(retiredT: number, params: SimulationParamsState): number {
  if (retiredT <= 0) return 1.0;
  const pattern: SpendingPattern = params.spendingPattern || (params.decumulationStrategy === "FLAT" ? "FLAT" : "ACTIVE_FOCUSED");
  if (pattern === "FLAT") return 1.0;

  const activeYears = params.activePhaseYears ?? DEFAULT_ACTIVE_YEARS;
  const declineRate = (params.annualDeclineRate ?? DEFAULT_ANNUAL_DECLINE_RATE) / 100;

  if (pattern === "ACTIVE_FOCUSED") {
    if (retiredT < activeYears) return 1.0;
    return Math.pow(1 - declineRate, retiredT - activeYears + 1);
  }

  if (pattern === "SMILING_3STAGE") {
    // 상대 경과 기준: 초기 7년 1.0, 8~17년 0.75, 18년차~ 0.55
    if (retiredT <= 7) return 1.0;
    if (retiredT <= 17) return 0.75;
    return 0.55;
  }

  return 1.0;
}
