/**
 * 은퇴자 맞춤 3-Bucket 현금 버퍼 플래닝 엔진
 * 
 * - Bucket 1 (1~2년치 생활비): 단기 현금성 자산 (CMA, MMF, 단기예금) -> 시장 폭락 시 버팀목
 * - Bucket 2 (3~7년치 생활비): 인컴·배당·중기채권 자산 -> 꾸준한 현금흐름으로 Bucket 1 재충전
 * - Bucket 3 (8년+ 미래 자금): 장기 성장 자산 (S&P500, 배당성장주) -> 인플레이션 방어 및 자산 증식
 */

export interface ThreeBucketInput {
  totalRetirementAssets: number; // 보유 총 은퇴 자산 (만원, 예: 50,000)
  targetMonthlySpending: number; // 월 목표 생활비 (만원, 예: 300)
  guaranteedMonthlyPension: number; // 국민연금 등 확정 월 연금 (만원, 예: 120)
  bucket1Years: number; // Bucket 1 보유 연수 (기본 2년)
  bucket2Years: number; // Bucket 2 보유 연수 (기본 5년)
  bucket1ReturnRate: number; // Bucket 1 기대수익률 (%/년, 기본 2.5)
  bucket2ReturnRate: number; // Bucket 2 기대수익률 (%/년, 기본 5.5)
  bucket3ReturnRate: number; // Bucket 3 기대수익률 (%/년, 기본 8.0)
}

export interface BucketAllocation {
  id: "bucket1" | "bucket2" | "bucket3";
  name: string;
  horizonYears: string;
  allocatedAmount: number; // 할당 금액 (만원)
  percentage: number; // 비중 (%)
  expectedReturnRate: number; // 연 수익률 (%)
  annualExpectedIncome: number; // 연간 예상 배당/이자 수입 (만원)
  recommendedAssets: string[];
  roleDescription: string;
}

export interface ThreeBucketResult {
  monthlyNetDeficit: number; // 연금 외 자산에서 인출해야 하는 순 월 인출액 (만원)
  annualNetDeficit: number; // 연간 순 인출액 (만원)
  safeRunwayYears: number; // Bucket 1 + 2만으로 시장 폭락 시 주식 매도 없이 버틸 수 있는 햇수 (년)
  
  buckets: {
    bucket1: BucketAllocation;
    bucket2: BucketAllocation;
    bucket3: BucketAllocation;
  };
  
  overallExpectedReturnRate: number; // 전체 포트폴리오 가중평균 기대수익률 (%)
  overallAnnualIncome: number; // 연간 총 배당/이자 인컴 (만원)
  rebalancingRules: string[];
  crisisDefenseScenario: string;
}

export function calculateThreeBucketPlan(input: ThreeBucketInput): ThreeBucketResult {
  const totalAssets = Math.max(1000, input.totalRetirementAssets || 40000);
  const monthlySpending = Math.max(100, input.targetMonthlySpending || 300);
  const monthlyPension = Math.max(0, input.guaranteedMonthlyPension || 100);
  
  // 순수 자산에서 인출해야 하는 순 부족 생활비
  const monthlyNetDeficit = Math.max(0, monthlySpending - monthlyPension);
  const annualNetDeficit = monthlyNetDeficit * 12;

  const b1Years = Math.max(1, Math.min(4, input.bucket1Years || 2));
  const b2Years = Math.max(2, Math.min(8, input.bucket2Years || 5));

  // 1. Bucket 1 (단기 안전 현금): 순 생활비 부족액 × N년
  const b1Needed = Math.round(annualNetDeficit * b1Years);
  const bucket1Amount = Math.min(totalAssets * 0.4, b1Needed);

  // 2. Bucket 2 (중기 배당/채권): 순 생활비 부족액 × N년
  const b2Needed = Math.round(annualNetDeficit * b2Years);
  const remainingAfterB1 = Math.max(0, totalAssets - bucket1Amount);
  const bucket2Amount = Math.min(remainingAfterB1 * 0.7, b2Needed);

  // 3. Bucket 3 (장기 성장 자산): 나머지 전액
  const bucket3Amount = Math.max(0, totalAssets - bucket1Amount - bucket2Amount);

  const b1Rate = input.bucket1ReturnRate ?? 2.5;
  const b2Rate = input.bucket2ReturnRate ?? 5.5;
  const b3Rate = input.bucket3ReturnRate ?? 8.0;

  const b1Income = Math.round((bucket1Amount * b1Rate) / 100);
  const b2Income = Math.round((bucket2Amount * b2Rate) / 100);
  const b3Income = Math.round((bucket3Amount * b3Rate) / 100);

  const buckets: {
    bucket1: BucketAllocation;
    bucket2: BucketAllocation;
    bucket3: BucketAllocation;
  } = {
    bucket1: {
      id: "bucket1",
      name: "Bucket 1: 단기 안심 현금",
      horizonYears: `1~${b1Years}년치 생활비`,
      allocatedAmount: bucket1Amount,
      percentage: Math.round((bucket1Amount / totalAssets) * 100),
      expectedReturnRate: b1Rate,
      annualExpectedIncome: b1Income,
      recommendedAssets: ["CMA / 파킹통장", "단기 MMF / KOFR ETF", "만기 6~12개월 정기예금"],
      roleDescription: "어떤 주식 시장 폭락에도 생활비를 헐값에 팔지 않고 꺼내 쓸 수 있는 절대 안전 방패",
    },
    bucket2: {
      id: "bucket2",
      name: "Bucket 2: 중기 인컴·배당",
      horizonYears: `${b1Years + 1}~${b1Years + b2Years}년치 인컴원`,
      allocatedAmount: bucket2Amount,
      percentage: Math.round((bucket2Amount / totalAssets) * 100),
      expectedReturnRate: b2Rate,
      annualExpectedIncome: b2Income,
      recommendedAssets: ["미국배당다우존스 ETF (SCHD)", "국내 만기매칭형 채권 ETF", "한국/미국 상장 공모리츠", "미국채 혼합형 ETF"],
      roleDescription: "매월/매분기 안정적인 배당과 이자를 창출하여 Bucket 1의 현금을 마르지 않게 재충전",
    },
    bucket3: {
      id: "bucket3",
      name: "Bucket 3: 장기 복리 성장",
      horizonYears: `${b1Years + b2Years + 1}년 이상 미래 자금`,
      allocatedAmount: bucket3Amount,
      percentage: Math.round((bucket3Amount / totalAssets) * 100),
      expectedReturnRate: b3Rate,
      annualExpectedIncome: b3Income,
      recommendedAssets: ["S&P500 지수 ETF", "글로벌 배당성장 펀드", "TDF 2045/2050", "나스닥100 우량 테크 ETF"],
      roleDescription: "인플레이션을 이기고 80~90대 초고령기 간병비와 장수 리스크를 방어하는 자산 증식 엔진",
    },
  };

  // 가중평균 기대수익률
  const overallExpectedReturnRate = Number(
    (
      (bucket1Amount * b1Rate + bucket2Amount * b2Rate + bucket3Amount * b3Rate) /
      totalAssets
    ).toFixed(2)
  );

  const overallAnnualIncome = b1Income + b2Income + b3Income;

  // 시장 폭락 시 주식 매도 없이 버틸 수 있는 기간 (Bucket 1 + Bucket 2)
  const safeRunwayYears = annualNetDeficit > 0
    ? Number(((bucket1Amount + bucket2Amount) / annualNetDeficit).toFixed(1))
    : 30;

  const rebalancingRules = [
    `강세장(시장 상승기): Bucket 3의 주식형 자산이 목표 비중(${buckets.bucket3.percentage}%)을 5%p 이상 초과하면 차익을 실현하여 Bucket 1과 Bucket 2로 이전합니다.`,
    `약세장(시장 하락기): 주식/성장 자산(Bucket 3)을 절대 손절 매도하지 않고, Bucket 1의 현금과 Bucket 2의 배당금(연 약 ${overallAnnualIncome}만원)만으로 최장 ${safeRunwayYears}년간 버팁니다.`,
    `재충전 루틴: 1년에 한 번 정기 점검일에 Bucket 1 잔고가 1년치 미만으로 떨어졌을 때만 Bucket 2의 만기 채권이나 분배금으로 채워 넣습니다.`,
  ];

  const crisisDefenseScenario = `만약 2008년 금융위기나 2020년 팬데믹 같은 대폭락이 발생하더라도, 회원님은 앞으로 ${safeRunwayYears}년 동안 주식을 단 1주도 팔지 않고 월 ${monthlySpending}만원의 생활비를 100% 정상 수령할 수 있습니다.`;

  return {
    monthlyNetDeficit,
    annualNetDeficit,
    safeRunwayYears,
    buckets,
    overallExpectedReturnRate,
    overallAnnualIncome,
    rebalancingRules,
    crisisDefenseScenario,
  };
}
