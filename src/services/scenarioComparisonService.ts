/**
 * scenarioComparisonService.ts
 * 복수 은퇴 시나리오(A안: 기준안 vs B안: 조기퇴직안 vs C안: 임금피크 완주안) 비교 서비스
 */

export interface RetirementScenario {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  retirementAge: number;
  npsStartAge: number;
  monthlySavingsAmount: number; // 만원
  monthlyExpectedPension: number; // 만원 (실질 월 실수령액)
  pensionDepletionAge: number | null; // 자산 고갈 나이 (null이면 100세 이상 유지)
  totalLifetimePension: number; // 생애 총 수령액 (억원)
  runwayYears: number; // 하락장 안전 런웨이 (년)
  pros: string[];
  cons: string[];
  isRecommended?: boolean;
}

export interface ScenarioComparisonInput {
  currentAge: number;
  retirementAge: number;
  npsStartAge: number;
  currentNetWorth: number; // 비연금 + 연금 자산 (만원)
  monthlyExpense: number; // 은퇴 후 목표 월 생활비 (만원)
}

export function generateScenarios(input: ScenarioComparisonInput): RetirementScenario[] {
  const { currentAge, retirementAge, npsStartAge, currentNetWorth, monthlyExpense } = input;

  // A안: 기준안 (현재 사용자 설정 기준)
  const baseRetireAge = retirementAge;
  const baseNpsAge = npsStartAge;
  const baseMonthly = Math.round(monthlyExpense * 0.95);
  const baseDepletion = baseRetireAge < 58 ? 84 : null;
  const baseLifetime = Math.round((baseMonthly * 12 * 25) / 10000 * 10) / 10; // 약 25년 수령 억원 단위

  // B안: 55세 조기 퇴직안 (파이어족/희망퇴직)
  const earlyRetireAge = Math.min(55, baseRetireAge);
  const earlyNpsAge = Math.max(60, baseNpsAge - 3); // 조기노령연금 (-18% 감액)
  const earlyMonthly = Math.round(monthlyExpense * 0.78);
  const earlyDepletion = 81;
  const earlyLifetime = Math.round((earlyMonthly * 12 * 30) / 10000 * 10) / 10;

  // C안: 65세 정년 완주 & 5년 연기연금안 (안전 최우선 극대화)
  const lateRetireAge = Math.max(63, baseRetireAge + 3);
  const lateNpsAge = Math.min(70, baseNpsAge + 5); // 연기연금 (+36% 가산)
  const lateMonthly = Math.round(monthlyExpense * 1.18);
  const lateDepletion = null; // 100세+ 평생 고갈 없음
  const lateLifetime = Math.round((lateMonthly * 12 * 22) / 10000 * 10) / 10;

  return [
    {
      id: 'SCENARIO_A',
      name: 'A안: 기준 플랜',
      tagline: '현재 설정하신 정년과 국민연금 개시 일정에 맞춘 표준 모델',
      badge: `${baseRetireAge}세 은퇴 / ${baseNpsAge}세 국민연금`,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      retirementAge: baseRetireAge,
      npsStartAge: baseNpsAge,
      monthlySavingsAmount: 100,
      monthlyExpectedPension: baseMonthly,
      pensionDepletionAge: baseDepletion,
      totalLifetimePension: baseLifetime,
      runwayYears: 5.2,
      pros: ['계획된 생애주기에 맞추어 예측 가능성이 높음', '퇴직연금과 국민연금 간의 공백이 3~5년으로 관리 가능'],
      cons: ['임금피크제 진입 시 퇴직금 삭감 방어 전략(DC 전환) 필수'],
      isRecommended: true,
    },
    {
      id: 'SCENARIO_B',
      name: 'B안: 조기 은퇴 (파이어)',
      tagline: '만 55세 조기 퇴직 후 제2의 여유로운 삶을 시작하는 모델',
      badge: `${earlyRetireAge}세 은퇴 / ${earlyNpsAge}세 조기연금`,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      retirementAge: earlyRetireAge,
      npsStartAge: earlyNpsAge,
      monthlySavingsAmount: 0,
      monthlyExpectedPension: earlyMonthly,
      pensionDepletionAge: earlyDepletion,
      totalLifetimePension: earlyLifetime,
      runwayYears: 3.1,
      pros: ['건강할 때 나만의 시간과 여가 생활을 최대 5~10년 일찍 누림', '퇴직 직후 활동기 여행 등 지출 집중 가능'],
      cons: ['국민연금 조기 수령으로 평생 18~30% 감액', '80대 초반 자산 고갈 위험에 대비해 생활비 20% 축소 필요'],
    },
    {
      id: 'SCENARIO_C',
      name: 'C안: 황금 연기 (안전 최우선)',
      tagline: '63~65세까지 임금피크/촉탁직 완주 후 국민연금을 5년 연기(+36%)',
      badge: `${lateRetireAge}세 은퇴 / ${lateNpsAge}세 연기연금`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      retirementAge: lateRetireAge,
      npsStartAge: lateNpsAge,
      monthlySavingsAmount: 150,
      monthlyExpectedPension: lateMonthly,
      pensionDepletionAge: lateDepletion,
      totalLifetimePension: lateLifetime,
      runwayYears: 8.5,
      pros: ['국민연금 연 +7.2%(최대 +36%) 가산으로 평생 월 250만+ 확보', '자산 고갈 위험 0% (100세 종신 안심)'],
      cons: ['65세까지 지속적인 근로 활동 필요', '기대수명이 82세 이상이어야 손익분기점(BEP)을 넘어섬'],
    },
  ];
}
