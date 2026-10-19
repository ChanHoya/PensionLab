/**
 * 월별 배당 인컴 캘린더 & 연금 인출 스케줄러 서비스
 * S4 하이브리드 배당 전략 및 대표 국내 상장 월배당/격주배당 ETF 기반 1월~12월 현금흐름 스케줄러
 */

export interface MonthlyCashflowEvent {
  day: number;
  type: "DIVIDEND" | "NATIONAL_PENSION" | "PRIVATE_PENSION" | "EXPENSE";
  label: string;
  amountWon: number;
  isIncome: boolean;
  notes?: string;
}

export interface MonthSchedule {
  month: number; // 1 ~ 12
  monthLabel: string;
  totalIncomeWon: number;
  totalExpenseWon: number;
  netCashflowWon: number; // 수지차 (수입 - 지출)
  events: MonthlyCashflowEvent[];
}

export interface DividendCalendarOverview {
  annualTotalDividendPreTaxWon: number;
  annualTotalDividendPostTaxWon: number;
  averageMonthlyDividendWon: number;
  peakMonth: number;
  lowestMonth: number;
  monthlySchedules: MonthSchedule[];
  biweeklyScheduleSupported: boolean;
  recommendations: string[];
}

export function generateDividendCalendar(params: {
  coveredCallAssetManwon: number; // 커버드콜/월배당 투자금 (만원, e.g. 5000)
  annualDividendRate: number; // 연 분배율 (%, e.g. 9.0)
  targetMonthlyExpenseWon: number; // 월 목표 생활비 (원, e.g. 3500000)
  monthlyNationalPensionWon: number; // 월 국민연금 (원, e.g. 1300000)
  monthlyPrivatePensionWon: number; // 월 사적연금 (원, e.g. 1000000)
  hasBiweeklyAllocation?: boolean; // 격주 배당 분산 여부 (월초/월중 + 월말 포트폴리오 조합)
}): DividendCalendarOverview {
  const assetWon = params.coveredCallAssetManwon * 10000;
  const annualRate = params.annualDividendRate / 100;
  const annualDividendPreTaxWon = Math.round(assetWon * annualRate);
  const annualDividendPostTaxWon = Math.round(annualDividendPreTaxWon * (1 - 0.154)); // 15.4% 배당소득세 차감
  const baseMonthlyDividendPostTax = Math.round(annualDividendPostTaxWon / 12);

  const isBiweekly = params.hasBiweeklyAllocation ?? true;
  const monthlySchedules: MonthSchedule[] = [];

  for (let m = 1; m <= 12; m++) {
    const events: MonthlyCashflowEvent[] = [];

    // 1. 생활비 지출 (매월 1일 고정 지출)
    events.push({
      day: 1,
      type: "EXPENSE",
      label: "월 생활비 인출",
      amountWon: params.targetMonthlyExpenseWon,
      isIncome: false,
      notes: "주거/식비/생활비 고정 지출",
    });

    // 2. 배당금 입금
    if (isBiweekly) {
      // 격주 분배 포트폴리오 (월중 15일경 50%, 월말 50%)
      const midMonthDividend = Math.round(baseMonthlyDividendPostTax * 0.5);
      const endMonthDividend = baseMonthlyDividendPostTax - midMonthDividend;

      events.push({
        day: 15,
        type: "DIVIDEND",
        label: "월중 배당금 (TIGER 미당다/채권혼합)",
        amountWon: midMonthDividend,
        isIncome: true,
        notes: "세후 15.4% 원천징수 후 입금",
      });

      events.push({
        day: 28,
        type: "DIVIDEND",
        label: "월말 배당금 (SOL 미당다/리츠인프라)",
        amountWon: endMonthDividend,
        isIncome: true,
        notes: "월말 결산 분배금 입금",
      });
    } else {
      // 단일 월말 배당
      events.push({
        day: 28,
        type: "DIVIDEND",
        label: "월배당 ETF 분배금 입금",
        amountWon: baseMonthlyDividendPostTax,
        isIncome: true,
        notes: "세후 15.4% 원천징수 후 입금",
      });
    }

    // 3. 국민연금 입금 (매월 25일 법정 지급일)
    if (params.monthlyNationalPensionWon > 0) {
      events.push({
        day: 25,
        type: "NATIONAL_PENSION",
        label: "국민연금 정기 수령",
        amountWon: params.monthlyNationalPensionWon,
        isIncome: true,
        notes: "국민연금공단 25일 정기 이체",
      });
    }

    // 4. 사적연금/퇴직연금 입금 (매월 10일 지정일)
    if (params.monthlyPrivatePensionWon > 0) {
      events.push({
        day: 10,
        type: "PRIVATE_PENSION",
        label: "사적연금(IRP/연금저축) 인출",
        amountWon: params.monthlyPrivatePensionWon,
        isIncome: true,
        notes: "세후 저율과세(3.3~5.5%) 차감 후 입금",
      });
    }

    // 날짜순 정렬
    events.sort((a, b) => a.day - b.day);

    const totalIncomeWon = events.filter((e) => e.isIncome).reduce((sum, e) => sum + e.amountWon, 0);
    const totalExpenseWon = events.filter((e) => !e.isIncome).reduce((sum, e) => sum + e.amountWon, 0);
    const netCashflowWon = totalIncomeWon - totalExpenseWon;

    monthlySchedules.push({
      month: m,
      monthLabel: `${m}월`,
      totalIncomeWon,
      totalExpenseWon,
      netCashflowWon,
      events,
    });
  }

  const recommendations: string[] = [
    "📅 격주 배당 캘린더 구성: 월초(1일) 생활비 인출 시점에 맞춰 15일과 28일로 분배금 입금일을 이원화하면 현금 유동성 공백을 최소화할 수 있습니다.",
    "🛡️ 비상 완충 버퍼(3-Bucket): 배당금이 매월 일정하더라도 분배금 입금일과 카드값/공과금 지출일 간의 며칠 간격 시차를 커버하기 위해 1~2개월치 생활비를 수시입출식 통장(MMF/파킹통장)에 유지하세요.",
    "💡 연금계좌(IRP/연금저축) 내 배당 투자: 일반 위탁계좌에서 수령 시 15.4% 배당소득세가 즉시 원천징수되지만, IRP/연금저축에서 투자 시 100% 비과세 재투자되어 복리 효과를 극대화할 수 있습니다.",
  ];

  return {
    annualTotalDividendPreTaxWon: annualDividendPreTaxWon,
    annualTotalDividendPostTaxWon: annualDividendPostTaxWon,
    averageMonthlyDividendWon: baseMonthlyDividendPostTax,
    peakMonth: 12,
    lowestMonth: 1,
    monthlySchedules,
    biweeklyScheduleSupported: isBiweekly,
    recommendations,
  };
}
