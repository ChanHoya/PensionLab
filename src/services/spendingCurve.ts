import type { SimulationParamsState, AgeBandsConfig } from "@/store/usePensionStore";
import { DEFAULT_AGE_BANDS } from "@/store/usePensionStore";

/**
 * 노후 지출 규모 패턴 (Spending Curve Pattern)
 * - AGE_BANDS: 연령대별 맞춤형 (60대, 70대, 80대, 90대+ 현재 비용 수준을 정교하게 설정)
 * - ACTIVE_FOCUSED: 활동기 집중형 (은퇴 초기 N년은 목표 생활비 100% 유지 후, 매년 일정 비율 완만하게 체감)
 * - SMILING_3STAGE: 3단계 생애주기형 (활동기 100% → 안정기 75% → 간병/노년기 55%)
 * - FLAT: 고정 균등형 (전 기간 동일한 실질 가치 유지)
 */
export type SpendingPattern = "AGE_BANDS" | "ACTIVE_FOCUSED" | "SMILING_3STAGE" | "FLAT";

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
 * 연령대별 목표/최소 생활비를 나이에 따라 부드럽게 보간(Smoothing)하여 계산
 */
function interpolateAgeBands(
  age: number,
  bands: AgeBandsConfig,
  retAge: number
): { target: number; min: number; phase: "ACTIVE" | "PASSIVE" | "LATE"; phaseLabel: string } {
  const b60 = bands.age60s || DEFAULT_AGE_BANDS.age60s;
  const b70 = bands.age70s || DEFAULT_AGE_BANDS.age70s;
  const b80 = bands.age80s || DEFAULT_AGE_BANDS.age80s;
  const b90 = bands.age90s || DEFAULT_AGE_BANDS.age90s;

  // 60대 (은퇴 나이 ~ 68세)
  if (age < 69) {
    return {
      target: b60.target,
      min: b60.min,
      phase: "ACTIVE",
      phaseLabel: "60대 초기 활동기",
    };
  }
  // 69~70세: 60대에서 70대로 완만한 전환 (스무딩)
  if (age === 69) {
    const t = Math.round(b60.target * 0.7 + b70.target * 0.3);
    const m = Math.round(b60.min * 0.7 + b70.min * 0.3);
    return { target: t, min: m, phase: "ACTIVE", phaseLabel: "활동기 전환 (69세)" };
  }
  if (age === 70) {
    const t = Math.round(b60.target * 0.3 + b70.target * 0.7);
    const m = Math.round(b60.min * 0.3 + b70.min * 0.7);
    return { target: t, min: m, phase: "PASSIVE", phaseLabel: "70대 소비 안정기 (70세)" };
  }
  // 71~78세: 70대 안정기
  if (age < 79) {
    return {
      target: b70.target,
      min: b70.min,
      phase: "PASSIVE",
      phaseLabel: "70대 소비 안정기",
    };
  }
  // 79~80세: 70대에서 80대로 완만한 전환
  if (age === 79) {
    const t = Math.round(b70.target * 0.7 + b80.target * 0.3);
    const m = Math.round(b70.min * 0.7 + b80.min * 0.3);
    return { target: t, min: m, phase: "PASSIVE", phaseLabel: "안정기 전환 (79세)" };
  }
  if (age === 80) {
    const t = Math.round(b70.target * 0.3 + b80.target * 0.7);
    const m = Math.round(b70.min * 0.3 + b80.min * 0.7);
    return { target: t, min: m, phase: "LATE", phaseLabel: "80대 활동 감소기 (80세)" };
  }
  // 81~88세: 80대 활동 감소기
  if (age < 89) {
    return {
      target: b80.target,
      min: b80.min,
      phase: "LATE",
      phaseLabel: "80대 활동 감소기",
    };
  }
  // 89~90세: 80대에서 90대로 완만한 전환
  if (age === 89) {
    const t = Math.round(b80.target * 0.7 + b90.target * 0.3);
    const m = Math.round(b80.min * 0.7 + b90.min * 0.3);
    return { target: t, min: m, phase: "LATE", phaseLabel: "노년기 전환 (89세)" };
  }
  // 90세 이상: 간병/노년기 (100세, 105세까지 일정하게 안전한 수준 유지)
  return {
    target: b90.target,
    min: b90.min,
    phase: "LATE",
    phaseLabel: "90대 이상 간병·노년기",
  };
}

/**
 * 은퇴 나이부터 부부 최장 기대수명 및 horizon 전체 연차별 목표/최소 생활비(현재가치) 곡선을 생성
 */
export function buildSpendingCurve(
  params: SimulationParamsState,
  baseYear: number = new Date().getFullYear(),
  maxHorizonYears?: number
): Map<number, SpendingPoint> {
  const currentAge = params.currentAge;
  const retAge = params.retirementAge;
  const lifeExp = Math.max(
    params.expectedLifeExpectancy,
    params.hasSpouse ? (params.spouseLifeExpectancy || 85) : 85
  );

  const pattern: SpendingPattern =
    params.spendingPattern ||
    (params.ageBands ? "AGE_BANDS" : params.decumulationStrategy === "FLAT" ? "FLAT" : "ACTIVE_FOCUSED");

  const targetBase =
    pattern === "AGE_BANDS"
      ? (params.ageBands?.age60s?.target ?? params.targetMonthlySpending ?? 450)
      : (params.targetMonthlySpending || 300);

  const minBase =
    pattern === "AGE_BANDS"
      ? (params.ageBands?.age60s?.min ?? params.minMonthlySpending ?? 300)
      : (params.minMonthlySpending || 200);

  const activeYears = params.activePhaseYears ?? DEFAULT_ACTIVE_YEARS;
  const declineRate = (params.annualDeclineRate ?? DEFAULT_ANNUAL_DECLINE_RATE) / 100;

  const curve = new Map<number, SpendingPoint>();
  // 90세 기대수명 이후에도 105세 또는 maxHorizonYears까지 넉넉하게 곡선을 채워 끝단 치솟음 방지
  const totalYears = Math.max(
    maxHorizonYears ?? 0,
    lifeExp - currentAge + 10,
    105 - currentAge
  );

  let lastPoint: SpendingPoint | null = null;
  // 노후 대비 연간 의료비(현재가치)는 어떤 지출 패턴이든 은퇴 후 목표·최소 생활비에 월 환산해 더한다
  const medical = Math.round((params.annualMedicalExpense || 0) / 12);

  for (let t = 0; t <= totalYears; t++) {
    const age = currentAge + t;
    const year = baseYear + t;

    if (age < retAge) {
      // 은퇴 전: 목표 생활비 기준 그대로
      const pt: SpendingPoint = {
        year,
        age,
        t,
        targetReal: targetBase,
        minReal: minBase,
        phase: "ACTIVE",
        phaseLabel: "은퇴 전",
      };
      curve.set(year, pt);
      lastPoint = pt;
      continue;
    }

    const retiredT = age - retAge; // 은퇴 후 0, 1, 2, ...
    let target = targetBase;
    let min = minBase;
    let phase: "ACTIVE" | "PASSIVE" | "LATE" = "ACTIVE";
    let phaseLabel = "초기 활동기";

    if (pattern === "AGE_BANDS") {
      const bandResult = interpolateAgeBands(age, params.ageBands || DEFAULT_AGE_BANDS, retAge);
      target = bandResult.target;
      min = bandResult.min;
      phase = bandResult.phase;
      phaseLabel = bandResult.phaseLabel;
    } else if (pattern === "ACTIVE_FOCUSED") {
      if (retiredT < activeYears) {
        target = targetBase;
        min = minBase;
        phase = "ACTIVE";
        phaseLabel = `초기 활동기 (${retiredT + 1}/${activeYears}년)`;
      } else {
        const decayYears = activeYears > 0 ? (retiredT - activeYears + 1) : retiredT;
        const decayFactor = Math.pow(1 - declineRate, decayYears);
        target = Math.max(minBase, Math.round(targetBase * decayFactor));
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

    const pt: SpendingPoint = {
      year,
      age,
      t: retiredT,
      targetReal: target + medical,
      minReal: min + medical,
      phase,
      phaseLabel,
    };
    curve.set(year, pt);
    lastPoint = pt;
  }

  return curve;
}

/**
 * 특정 연차(경과 연수)의 상대 지출 가중치 (은퇴 시점 = 1.0)
 */
export function getSpendingMultiplier(retiredT: number, params: SimulationParamsState): number {
  if (retiredT <= 0) return 1.0;
  const pattern: SpendingPattern =
    params.spendingPattern ||
    (params.ageBands ? "AGE_BANDS" : params.decumulationStrategy === "FLAT" ? "FLAT" : "ACTIVE_FOCUSED");
  if (pattern === "FLAT") return 1.0;

  const retAge = params.retirementAge;
  const currentAge = retAge + retiredT;

  if (pattern === "AGE_BANDS") {
    const bands = params.ageBands || DEFAULT_AGE_BANDS;
    const baseTarget = bands.age60s?.target || params.targetMonthlySpending || 450;
    if (baseTarget <= 0) return 1.0;
    const currentPoint = interpolateAgeBands(currentAge, bands, retAge);
    return currentPoint.target / baseTarget;
  }

  const activeYears = params.activePhaseYears ?? DEFAULT_ACTIVE_YEARS;
  const declineRate = (params.annualDeclineRate ?? DEFAULT_ANNUAL_DECLINE_RATE) / 100;

  if (pattern === "ACTIVE_FOCUSED") {
    if (retiredT < activeYears) return 1.0;
    const decayYears = activeYears > 0 ? (retiredT - activeYears + 1) : retiredT;
    return Math.pow(1 - declineRate, decayYears);
  }

  if (pattern === "SMILING_3STAGE") {
    if (retiredT <= 7) return 1.0;
    if (retiredT <= 17) return 0.75;
    return 0.55;
  }

  return 1.0;
}
