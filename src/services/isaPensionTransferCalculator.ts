/**
 * ISA 만기 자금 연금계좌 전환 및 절세 3총사(연금저축/IRP/ISA) 통합 플래너 엔진
 * 조세특례제한법 제91조의18 및 소득세법 제59조의3
 * ISA 3년 만기 전환금의 10%(최대 300만원) 추가 세액공제 및 3년 풍차돌리기 시뮬레이션
 */

export interface IsaTransferInput {
  isaMaturityAmountWon: number; // ISA 만기 자금 (원, 기본 3,000만원)
  annualSalaryWon: number; // 총급여 (원, 5,500만원 기준 16.5% vs 13.2%)
  annualRegularPensionDepositWon?: number; // 정기 연금저축/IRP 납입액 (원, 기본 900만원)
  rollingOverCycles?: number; // 3년 만기 풍차돌리기 횟수 (기본 3회 = 9년)
  expectedAnnualReturnRate?: number; // 연평균 예상 운용 수익률 (%, 기본 5.0)
}

export interface AccountComparisonItem {
  feature: string; // 비교 항목
  generalAccount: string; // 일반 위탁계좌
  isaAccount: string; // ISA 계좌
  pensionAccount: string; // 연금저축 / IRP
}

export interface IsaTransferResult {
  taxCreditRate: number; // 0.165 or 0.132
  taxCreditRateLabel: string; // "16.5% (총급여 5,500만원 이하)" | "13.2% (총급여 5,500만원 초과)"
  isaTransferTaxCreditWon: number; // ISA 전환 추가 인정액 (전환액 10%, 최대 300만원)
  regularTaxCreditWon: number; // 기본 연금저축/IRP 인정액 (최대 900만원)
  totalTaxCreditEligibleWon: number; // 당해 연도 총 공제 대상 납입액 (최대 1,200만원)
  regularTaxRefundWon: number; // 기본 납입 연말정산 환급액
  isaBonusTaxRefundWon: number; // ISA 전환에 따른 추가 보너스 환급액 (최대 49.5만원)
  totalAnnualTaxRefundWon: number; // 당해 연도 총 세액공제 환급액 (최대 198만원)
  threeYearCycleTotalRefundWon: number; // 3개년 누적 세액공제 환급액 (기본납입 3년 + ISA보너스 1회)
  cumulativeTaxBenefitWon: number; // N회 풍차돌리기 누적 총 절세 혜택
  comparisonTable: AccountComparisonItem[];
  expertTips: string[];
}

// 상용 상수
export const ISA_TRANSFER_TAX_CREDIT_RATE = 0.1; // 10%
export const ISA_TRANSFER_MAX_CREDIT_WON = 3000000; // 최대 300만원 한도
export const REGULAR_PENSION_MAX_CREDIT_WON = 9000000; // 기본 연금 900만원 한도
export const MAX_TOTAL_TAX_CREDIT_WON = 12000000; // 총 1,200만원 한도

export function calculateIsaPensionTransfer(input: IsaTransferInput): IsaTransferResult {
  const {
    isaMaturityAmountWon,
    annualSalaryWon,
    annualRegularPensionDepositWon = 9000000,
    rollingOverCycles = 3,
  } = input;

  // 총급여 5,500만원(종합소득 4,500만원) 이하 여부
  const isLowerIncome = annualSalaryWon <= 55000000;
  const taxCreditRate = isLowerIncome ? 0.165 : 0.132;
  const taxCreditRateLabel = isLowerIncome
    ? "16.5% (총급여 5,500만원 이하 우대)"
    : "13.2% (총급여 5,500만원 초과)";

  // ISA 전환 추가 세액공제 대상 금액 (전환금액의 10%, 최대 300만원)
  const isaTransferTaxCreditWon = Math.min(
    Math.round(isaMaturityAmountWon * ISA_TRANSFER_TAX_CREDIT_RATE),
    ISA_TRANSFER_MAX_CREDIT_WON
  );

  // 기본 연금저축/IRP 납입 공제 대상액 (최대 900만원)
  const regularTaxCreditWon = Math.min(
    annualRegularPensionDepositWon,
    REGULAR_PENSION_MAX_CREDIT_WON
  );

  // 총 공제 대상 납입액 (최대 1,200만원)
  const totalTaxCreditEligibleWon = Math.min(
    regularTaxCreditWon + isaTransferTaxCreditWon,
    MAX_TOTAL_TAX_CREDIT_WON
  );

  // 환급액 계산
  const regularTaxRefundWon = Math.round(regularTaxCreditWon * taxCreditRate);
  const isaBonusTaxRefundWon = Math.round(isaTransferTaxCreditWon * taxCreditRate);
  const totalAnnualTaxRefundWon = Math.round(totalTaxCreditEligibleWon * taxCreditRate);

  // 3개년 1사이클 누적 환급액 (기본납입 환급 3년치 + ISA 전환 보너스 환급 1회치)
  const threeYearCycleTotalRefundWon = regularTaxRefundWon * 3 + isaBonusTaxRefundWon;

  // N회 풍차돌리기 누적 총 환급 혜택
  const cumulativeTaxBenefitWon = threeYearCycleTotalRefundWon * rollingOverCycles;

  // 절세 3총사 비교표
  const comparisonTable: AccountComparisonItem[] = [
    {
      feature: "세액공제 혜택",
      generalAccount: "없음 (0원)",
      isaAccount: "없음 (단, 연금 전환 시 10% 공제)",
      pensionAccount: "연 900만원 (ISA 전환 시 연 1,200만원)",
    },
    {
      feature: "배당/이자 과세",
      generalAccount: "15.4% 즉시 원천징수",
      isaAccount: "200만~400만 비과세, 초과 9.9% 분리과세",
      pensionAccount: "과세이연 (운용 중 세금 0원)",
    },
    {
      feature: "건강보험료 영향",
      generalAccount: "1,000만원 초과 시 전액 건보료 부과",
      isaAccount: "건강보험료 완전 제외 (비합산)",
      pensionAccount: "수령 시 현재 건보료 완전 비과세",
    },
    {
      feature: "중도인출 유연성",
      generalAccount: "언제나 자유롭게 인출 가능",
      isaAccount: "납입 원금 한도 내 자유 인출 가능",
      pensionAccount: "만 55세 이전 해지 시 16.5% 페널티",
    },
    {
      feature: "추천 운용 전략",
      generalAccount: "단기 비상금 및 공모주 투자",
      isaAccount: "국내상장 미국/고배당 ETF 3년 투자",
      pensionAccount: "TDF, S&P500, 배당 ETF 은퇴 종신 설계",
    },
  ];

  // 전문가 팁
  const expertTips: string[] = [
    `ISA 만기 자금 ${(isaMaturityAmountWon / 10000).toLocaleString()}만원을 연금저축/IRP로 전환하면 전환금의 10%인 ${(isaTransferTaxCreditWon / 10000).toLocaleString()}만원이 당해 연도 세액공제 한도에 추가 가산됩니다.`,
    `기본 연금 납입 900만원에 ISA 300만원이 더해져 연간 최대 1,200만원까지 공제받으며, 연말정산 시 약 ${(totalAnnualTaxRefundWon / 10000).toFixed(0)}만원을 13월의 월급으로 즉시 환급받습니다.`,
    "3년 만기 ISA 해지 후 즉시 새 ISA를 재가입하는 '3년 풍차돌리기'를 실행하면, 3년마다 300만원의 추가 세액공제와 비과세 혜택을 무한 반복하여 복리 자산을 극대화할 수 있습니다.",
    "ISA 만기 자금은 해지일로부터 60일 이내에 연금계좌로 전환 신청해야 세액공제 혜택이 적용되므로 기한을 놓치지 않도록 주의하세요.",
  ];

  return {
    taxCreditRate,
    taxCreditRateLabel,
    isaTransferTaxCreditWon,
    regularTaxCreditWon,
    totalTaxCreditEligibleWon,
    regularTaxRefundWon,
    isaBonusTaxRefundWon,
    totalAnnualTaxRefundWon,
    threeYearCycleTotalRefundWon,
    cumulativeTaxBenefitWon,
    comparisonTable,
    expertTips,
  };
}
