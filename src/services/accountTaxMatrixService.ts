/**
 * accountTaxMatrixService.ts
 * 2026년 세법 기준 절세 계좌 4총사(ISA / 연금저축 / IRP / 일반계좌) 자산배분 최적화 매트릭스 서비스
 */

export interface AccountTaxRule {
  id: 'GENERAL' | 'ISA' | 'PENSION_SAVINGS' | 'IRP';
  name: string;
  badge: string;
  annualLimit: string; // 연간 납입한도
  taxBenefitNow: string; // 납입 시 세제 혜택
  tradingTax: string; // 매매차익 과세
  dividendTax: string; // 배당/분배금 과세
  healthInsuranceImpact: string; // 건보료 합산 여부
  mandatoryPeriod: string; // 의무가입/수령 요건
  recommendationAsset: string; // 추천 적합 자산군
}

export interface AssetClassTaxGuide {
  id: string;
  assetName: string;
  category: string;
  bestAccount: 'PENSION_SAVINGS' | 'IRP' | 'ISA' | 'GENERAL';
  bestAccountName: string;
  reason: string;
  expectedAnnualReturn: number; // %
  afterTaxReturnGeneral: number; // 일반계좌 세후 실질 수익률 (%)
  afterTaxReturnBest: number; // 최적계좌 세후 실질 수익률 (%)
  differenceNote: string;
}

export function getAccountTaxRules(): AccountTaxRule[] {
  return [
    {
      id: 'GENERAL',
      name: '일반 위탁계좌',
      badge: '제약 없음',
      annualLimit: '한도 없음',
      taxBenefitNow: '없음',
      tradingTax: '국내주식 비과세 / 해외주식 22% 양도세 / 해외ETF 15.4% 배당소득세',
      dividendTax: '15.4% 원천징수 (연 2,000만원 초과 시 종합과세)',
      healthInsuranceImpact: '⚠️ 금융소득 1,000만원 초과 시 전액 건보료 부과',
      mandatoryPeriod: '언제든 자유 입출금 가능',
      recommendationAsset: '비과세 국내 직투 주식, 3년 이내 단기 운용 자금',
    },
    {
      id: 'ISA',
      name: '중개형 ISA (절세만능)',
      badge: '3년 주기 풍차돌리기',
      annualLimit: '연 2,000만원 (총 1억원까지 이월 가능)',
      taxBenefitNow: '없음 (단, 만기 시 연금계좌 전환 시 10% 추가 세액공제)',
      tradingTax: '손익통산 후 200~500만원 비과세 / 초과분 9.9% 분리과세',
      dividendTax: '손익통산 후 비과세 한도 적용, 초과분 9.9% 분리과세 종결',
      healthInsuranceImpact: '🛡️ 건보료 완전 비과세 (금융소득 합산 제외)',
      mandatoryPeriod: '의무 가입 3년 (원금 중도인출 자유)',
      recommendationAsset: '미국 배당 다우존스(SCHD), 고배당 리츠, 채권형 ETF',
    },
    {
      id: 'PENSION_SAVINGS',
      name: '연금저축펀드',
      badge: '자유 운용 & 세액공제',
      annualLimit: '연 600만원 (IRP 합산 연 900만원)',
      taxBenefitNow: '연 최대 99만원 환급 (13.2%~16.5% 세액공제)',
      tradingTax: '매매차익 전액 과세이연 (운용 중 세금 0원)',
      dividendTax: '배당세 0원 (인출 전까지 복리 재투자)',
      healthInsuranceImpact: '🛡️ 만 55세 이후 연금 수령 시 건보료 완전 비과세',
      mandatoryPeriod: '만 55세 이상 + 가입 5년 이상',
      recommendationAsset: 'S&P500 / 나스닥100 해외지수 ETF, 글로벌 성장 테마',
    },
    {
      id: 'IRP',
      name: '개인형 퇴직연금 (IRP)',
      badge: '최대 세액공제 + 퇴직금',
      annualLimit: '연 900만원 (퇴직금은 무제한 이체)',
      taxBenefitNow: '연 최대 148.5만원 환급 (퇴직소득세 30~40% 감면)',
      tradingTax: '전액 과세이연 (안전자산 30% 의무 채움)',
      dividendTax: '배당세 0원 (연금수령 시 3.3~5.5% 저율과세)',
      healthInsuranceImpact: '🛡️ 연금 수령 시 건보료 완전 비과세',
      mandatoryPeriod: '만 55세 이상',
      recommendationAsset: '타깃데이트펀드(TDF), 금리연동형 채권, 안전자산 30%용 ETF',
    },
  ];
}

export function getAssetClassGuides(): AssetClassTaxGuide[] {
  return [
    {
      id: 'ASSET_US_DIVIDEND',
      assetName: '미국 배당 다우존스 (한국판 SCHD)',
      category: '월배당 / 고배당',
      bestAccount: 'ISA',
      bestAccountName: '중개형 ISA',
      reason: '매월 발생하는 분배금 배당소득세(15.4%)를 전액 비과세(200~500만) 받고, 초과분도 9.9% 분리과세되어 금융소득종합과세와 건보료를 100% 방어합니다.',
      expectedAnnualReturn: 8.0,
      afterTaxReturnGeneral: 6.77,
      afterTaxReturnBest: 7.82,
      differenceNote: '연 1.05%p 세후 수익률 격차 (10년 복리 시 수천만원 차이)',
    },
    {
      id: 'ASSET_US_INDEX',
      assetName: '미국 S&P500 / 나스닥100 ETF',
      category: '장기 성장형 지수',
      bestAccount: 'PENSION_SAVINGS',
      bestAccountName: '연금저축펀드',
      reason: '10~20년 장기 투자 시 발생하는 수천만원의 매매차익에 대해 15.4%를 즉시 떼지 않고 전액 복리로 굴린 뒤, 은퇴 후 3.3~5.5% 저율 연금소득세만 냅니다.',
      expectedAnnualReturn: 9.5,
      afterTaxReturnGeneral: 8.04,
      afterTaxReturnBest: 9.18,
      differenceNote: '과세이연 스노우볼 복리 효과로 20년 뒤 잔고 25% 이상 격차',
    },
    {
      id: 'ASSET_TDF_BOND',
      assetName: '타깃데이트펀드(TDF) 및 만기채권',
      category: '생애주기 자산배분',
      bestAccount: 'IRP',
      bestAccountName: '개인형 IRP',
      reason: 'IRP의 안전자산 30% 의무 규정을 100% 만족하면서 연간 900만원 세액공제(최대 148.5만원 환급)를 극대화할 수 있습니다.',
      expectedAnnualReturn: 5.5,
      afterTaxReturnGeneral: 4.65,
      afterTaxReturnBest: 5.32,
      differenceNote: '연말정산 즉시 환급액 + 세후 복리',
    },
    {
      id: 'ASSET_DOMESTIC_STOCK',
      assetName: '국내 주식형 ETF (코스피200 / 2차전지 등)',
      category: '국내 주식',
      bestAccount: 'GENERAL',
      bestAccountName: '일반 위탁계좌',
      reason: '국내 상장주식 매매차익은 일반 계좌에서도 전액 비과세이므로, 굳이 납입한도나 의무기간이 있는 절세 계좌의 귀한 한도를 낭비할 필요가 없습니다.',
      expectedAnnualReturn: 7.0,
      afterTaxReturnGeneral: 7.0,
      afterTaxReturnBest: 7.0,
      differenceNote: '일반 계좌에서도 매매차익 비과세 (절세 계좌 한도 보존)',
    },
  ];
}
