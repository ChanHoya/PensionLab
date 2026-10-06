/**
 * pensionAccountRules.ts
 * 
 * 근로자퇴직급여 보장법 및 퇴직연금감독규정에 따른 계좌 유형별 운용 규제 판정 엔진
 * 
 * 1. IRP (개인형퇴직연금) & DC (확정기여형):
 *    - 위험자산(주식형 ETF, 주식형 펀드, 파생결합 등) 최대 70% 한도
 *    - 안전자산(채권혼합형, 채권형 ETF, 예적금, 원리금보장) 최소 30% 의무 편입
 * 
 * 2. 연금저축펀드 (신탁/보험 제외):
 *    - 주식형 ETF 등 위험자산 최대 100% 편입 가능 (안전자산 30% 의무 없음)
 * 
 * 3. 일반 종합위탁계좌:
 *    - 운용 제한 없음, 분배금 발생 시 15.4% 배당소득세 원천징수 및 금융소득 1,000만원 초과 시 건보료 피부양자 탈락
 */

export interface AssetAllocationItem {
  name: string;
  amountWon: number; // 투자 금액 (원)
  isRiskAsset: boolean; // 위험자산 여부 (true: 주식/커버드콜 등, false: 채권/예금 등 안전자산)
}

export interface AccountRegulationAssessment {
  accountType: "IRP" | "PENSION_SAVINGS" | "TAXABLE";
  totalAmountWon: number;
  riskAssetAmountWon: number;
  safeAssetAmountWon: number;
  riskRatio: number; // 위험자산 비중 (0~100 %)
  safeRatio: number; // 안전자산 비중 (0~100 %)
  maxAllowedRiskRatio: number; // 최대 허용 위험자산 비중 (IRP: 70%, 연금저축: 100%, 일반: 100%)
  minRequiredSafeRatio: number; // 최소 요구 안전자산 비중 (IRP: 30%, 연금저축: 0%, 일반: 0%)
  isCompliant: boolean; // 규정 준수 여부
  excessRiskWon: number; // 위험자산 한도 초과 금액 (원, 규정 위반 시 매도/조정 필요 금액)
  requiredSafeDepositWon: number; // 추가 납입 시 70%를 맞추기 위해 필요한 최소 안전자산 납입액 (원)
  adviceMessage: string;
}

/**
 * 포트폴리오 자산 배분을 바탕으로 퇴직연금/연금계좌 운용 규정 준수 여부를 진단합니다.
 */
export function assessAccountRegulation(
  accountType: "IRP" | "PENSION_SAVINGS" | "TAXABLE",
  assets: AssetAllocationItem[]
): AccountRegulationAssessment {
  const totalAmountWon = assets.reduce((sum, a) => sum + a.amountWon, 0);
  const riskAssetAmountWon = assets
    .filter((a) => a.isRiskAsset)
    .reduce((sum, a) => sum + a.amountWon, 0);
  const safeAssetAmountWon = totalAmountWon - riskAssetAmountWon;

  const riskRatio = totalAmountWon > 0 ? (riskAssetAmountWon / totalAmountWon) * 100 : 0;
  const safeRatio = totalAmountWon > 0 ? (safeAssetAmountWon / totalAmountWon) * 100 : 0;

  if (accountType === "PENSION_SAVINGS") {
    return {
      accountType,
      totalAmountWon,
      riskAssetAmountWon,
      safeAssetAmountWon,
      riskRatio: Math.round(riskRatio * 10) / 10,
      safeRatio: Math.round(safeRatio * 10) / 10,
      maxAllowedRiskRatio: 100,
      minRequiredSafeRatio: 0,
      isCompliant: true,
      excessRiskWon: 0,
      requiredSafeDepositWon: 0,
      adviceMessage: "연금저축계좌는 안전자산 30% 의무가 없어 주식형/커버드콜 ETF를 100%까지 자유롭게 매수할 수 있습니다.",
    };
  }

  if (accountType === "TAXABLE") {
    return {
      accountType,
      totalAmountWon,
      riskAssetAmountWon,
      safeAssetAmountWon,
      riskRatio: Math.round(riskRatio * 10) / 10,
      safeRatio: Math.round(safeRatio * 10) / 10,
      maxAllowedRiskRatio: 100,
      minRequiredSafeRatio: 0,
      isCompliant: true,
      excessRiskWon: 0,
      requiredSafeDepositWon: 0,
      adviceMessage: "일반 위탁계좌는 매매 제한이 없으나, 매년 15.4% 배당소득세 및 금융소득 1,000만원 초과 시 건보료 피부양자 탈락에 유의하세요.",
    };
  }

  // IRP (퇴직연금감독규정 70% 룰 적용)
  const maxAllowedRiskRatio = 70.0;
  const minRequiredSafeRatio = 30.0;
  const isCompliant = riskRatio <= maxAllowedRiskRatio;

  let excessRiskWon = 0;
  let requiredSafeDepositWon = 0;

  if (!isCompliant) {
    // 70%를 맞추기 위한 위험자산 초과액: riskAsset - (total * 0.7)
    // riskAsset - (riskAsset + safe) * 0.7 = 0.3 * riskAsset - 0.7 * safe
    excessRiskWon = Math.round(riskAssetAmountWon - totalAmountWon * 0.7);
    // 추가로 안전자산만 매수하여 70%로 희석할 경우 필요한 안전자산 납입액:
    // riskAsset / (total + X) = 0.7  =>  total + X = riskAsset / 0.7  =>  X = (riskAsset / 0.7) - total
    requiredSafeDepositWon = Math.round(riskAssetAmountWon / 0.7 - totalAmountWon);
  }

  const adviceMessage = isCompliant
    ? `IRP 규정을 완벽히 준수하고 있습니다. (위험자산 ${Math.round(riskRatio)}% ≤ 70%, 안전자산 ${Math.round(safeRatio)}% ≥ 30%)`
    : `⚠️ IRP 위험자산 70% 한도를 초과했습니다 (현재 ${Math.round(riskRatio)}%). 위험자산을 ${Math.round(excessRiskWon / 10000).toLocaleString()}만원 매도하거나, 안전자산(채권혼합/예금 등)을 ${Math.round(requiredSafeDepositWon / 10000).toLocaleString()}만원 추가 납입해야 주문이 체결됩니다.`;

  return {
    accountType,
    totalAmountWon,
    riskAssetAmountWon,
    safeAssetAmountWon,
    riskRatio: Math.round(riskRatio * 10) / 10,
    safeRatio: Math.round(safeRatio * 10) / 10,
    maxAllowedRiskRatio,
    minRequiredSafeRatio,
    isCompliant,
    excessRiskWon,
    requiredSafeDepositWon,
    adviceMessage,
  };
}
