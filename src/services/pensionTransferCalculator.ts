/**
 * 개인연금(연금저축/IRP) 금융사 갈아타기(계좌이체) 실익 분석 엔진
 * 
 * - 세금 불이익 없이(과세이연 100% 승계) 원스톱으로 금융사를 이전하는 '연금계좌 계약이전 제도' 기반
 * - 기존 저수익 상품(은행 신탁, 보험사 연금보험 연 1.5~2.5%) vs 증권사 포트폴리오(ETF/TDF 연 5~7%) 간
 *   은퇴 시점 복리 자산 격차 및 월 수령액 증가분 역산
 */

export interface PensionTransferInput {
  currentBalance: number; // 현재 적립금 (만원, 예: 3000)
  monthlyContribution: number; // 월 추가 납입액 (만원, 예: 30)
  holdingYears: number; // 잔여 운용 및 수령 개시까지 남은 기간 (년, 예: 15)
  receivingYears: number; // 은퇴 후 연금 수령 기간 (년, 기본 20년)

  currentReturnRate: number; // 기존 금융사 연 기대수익률 (%/년, 예: 2.2)
  currentFeeRate: number; // 기존 금융사 연 수수료율 (%/년, 예: 1.2)

  newReturnRate: number; // 이전 대상 금융사 연 기대수익률 (%/년, 예: 6.5)
  newFeeRate: number; // 이전 대상 금융사 연 수수료율 (%/년, 예: 0.3)
}

export interface YearSimulationPoint {
  year: number;
  currentBalance: number; // 기존 유지 시 누적 자산 (만원)
  newBalance: number; // 갈아타기 후 누적 자산 (만원)
  difference: number; // 격차 (만원)
  totalContributions: number; // 원금 누적 (만원)
}

export interface PensionTransferResult {
  currentFinalBalance: number; // 기존 유지 시 최종 예상 자산 (만원)
  newFinalBalance: number; // 갈아타기 시 최종 예상 자산 (만원)
  assetGap: number; // 은퇴 시점 자산 격차 (만원)
  growthMultiplier: number; // 자산 증식 배수 (예: 1.5배)

  currentMonthlyPension: number; // 기존 유지 시 월 예상 수령액 (만원)
  newMonthlyPension: number; // 갈아타기 시 월 예상 수령액 (만원)
  monthlyPensionGap: number; // 월 수령액 증가분 (만원)

  totalFeeSaved: number; // 수수료 절감 효과 추정치 (만원)

  yearlyTrajectory: YearSimulationPoint[]; // 연도별 성장 궤적
  transferGuideSteps: {
    step: number;
    title: string;
    description: string;
    tip?: string;
  }[];
  warningPoints: string[];
}

export function calculatePensionTransferBenefit(input: PensionTransferInput): PensionTransferResult {
  const balance = Math.max(0, input.currentBalance || 3000);
  const monthlyAdd = Math.max(0, input.monthlyContribution || 30);
  const annualAdd = monthlyAdd * 12;
  const years = Math.max(1, Math.min(40, input.holdingYears || 15));
  const receivingYears = Math.max(5, Math.min(40, input.receivingYears || 20));

  // 실질 순수익률 (기대수익률 - 수수료)
  const currentNetRate = Math.max(0, (input.currentReturnRate - input.currentFeeRate) / 100);
  const newNetRate = Math.max(0, (input.newReturnRate - input.newFeeRate) / 100);

  const trajectory: YearSimulationPoint[] = [];

  let curBal = balance;
  let newBal = balance;
  let totalContrib = balance;

  trajectory.push({
    year: 0,
    currentBalance: Math.round(curBal),
    newBalance: Math.round(newBal),
    difference: 0,
    totalContributions: Math.round(totalContrib),
  });

  let totalCurFees = 0;
  let totalNewFees = 0;

  for (let y = 1; y <= years; y++) {
    // 1년 간 발생 수수료 추정
    totalCurFees += curBal * (input.currentFeeRate / 100);
    totalNewFees += newBal * (input.newFeeRate / 100);

    // 연 복리 계산
    curBal = curBal * (1 + currentNetRate) + annualAdd;
    newBal = newBal * (1 + newNetRate) + annualAdd;
    totalContrib += annualAdd;

    trajectory.push({
      year: y,
      currentBalance: Math.round(curBal),
      newBalance: Math.round(newBal),
      difference: Math.round(newBal - curBal),
      totalContributions: Math.round(totalContrib),
    });
  }

  const currentFinalBalance = Math.round(curBal);
  const newFinalBalance = Math.round(newBal);
  const assetGap = Math.max(0, newFinalBalance - currentFinalBalance);
  const growthMultiplier = Number((newFinalBalance / (currentFinalBalance || 1)).toFixed(2));

  // 은퇴 후 수령 기간(receivingYears) 동안 연 3% 보수적 운용 가정 시 월 연금 지급액 (PMT 역산 근사)
  const postRetireRate = 0.03 / 12;
  const totalMonths = receivingYears * 12;

  const currentMonthlyPension = Math.round(
    (currentFinalBalance * postRetireRate) /
    (1 - Math.pow(1 + postRetireRate, -totalMonths))
  );

  const newMonthlyPension = Math.round(
    (newFinalBalance * postRetireRate) /
    (1 - Math.pow(1 + postRetireRate, -totalMonths))
  );

  const monthlyPensionGap = Math.max(0, newMonthlyPension - currentMonthlyPension);
  const totalFeeSaved = Math.max(0, Math.round(totalCurFees - totalNewFees));

  const transferGuideSteps = [
    {
      step: 1,
      title: "신규 금융사(증권사)에서 비대면 계좌 개설",
      description: "갈아탈 증권사 모바일 앱에서 '연금저축펀드' 또는 '개인형 IRP' 계좌를 개설합니다. (지점 방문 불필요)",
      tip: "기존 계좌가 연금저축이면 연금저축으로, IRP면 IRP로 동일 계좌 유형으로 개설해야 합니다.",
    },
    {
      step: 2,
      title: "앱에서 '연금계좌 계약이전(가져오기)' 신청",
      description: "신규 금융사 앱 메뉴에서 [연금 이전 신청]을 누르고, 가져올 기존 금융사를 선택합니다.",
      tip: "기존 금융사에 전화하거나 방문할 필요 없이 원스톱으로 처리됩니다.",
    },
    {
      step: 3,
      title: "기존 금융사의 확인 전화/문자 승인",
      description: "기존 금융사에서 해지 의사 확인 전화나 카카오톡 확인 알림이 오면 '이전 동의'를 진행합니다.",
      tip: "동의 완료 후 2~3영업일 이내에 원금과 수익금이 세금 차감 없이 100% 신규 계좌로 입금됩니다.",
    },
  ];

  const warningPoints = [
    "세금 불이익 0원: '해지'가 아닌 '계약이전'이므로 기타소득세(16.5%)가 부과되지 않고 기존 세액공제 혜택과 가입기간이 100% 승계됩니다.",
    "보험사 연금저축보험 주의사항: 가입 후 5~7년 이내인 경우 사업비 차감으로 인해 해약환급금이 원금보다 적을 수 있으므로 이전 전 콜센터에서 '이전 가능 환급금'을 꼭 확인하세요.",
    "종신연금형 선택 불가: 생명보험사 특화 '종신연금형(사망 시까지 평생 지급)'을 원하시는 분은 증권사로 이전 시 종신형 수령이 불가능하므로 확정기간형(10~30년)으로 설계해야 합니다.",
  ];

  return {
    currentFinalBalance,
    newFinalBalance,
    assetGap,
    growthMultiplier,
    currentMonthlyPension,
    newMonthlyPension,
    monthlyPensionGap,
    totalFeeSaved,
    yearlyTrajectory: trajectory,
    transferGuideSteps,
    warningPoints,
  };
}
