// [Agent 3] 맞춤형 인출 전략(S0~S4) 최적화, 3-Bucket 현금 버퍼 및 리스크 진단 전담 에이전트
import { runWithdrawalSimulation, privateDrawStartAgeOf } from "@/services/withdrawalCalculator";
import { calculateThreeBucketPlan } from "@/services/threeBucketCalculator";
import { runRetirementStressTest } from "@/services/stressTestEngine";
import { calculateNpsEarlyDeferralBep } from "@/services/npsEarlyDeferralBep";
import { calculateIncomeBridge } from "@/services/incomeBridgeCalculator";
import { runPortfolioBacktest } from "@/services/portfolioBacktest";
import { calculateRebalancingOrders } from "@/services/rebalancingOrderService";
import { runSavingsPlan } from "@/services/savingsPlan";
import { calculateDbDcTransition } from "@/services/dbDcTransitionCalculator";
import { calculatePensionTransferBenefit } from "@/services/pensionTransferCalculator";
import { calculateIsaPensionTransfer } from "@/services/isaPensionTransferCalculator";

export const Agent3StrategyAnalyzer = {
  // S0~S4 5대 인출 전략 시뮬레이션
  runWithdrawalSimulation,
  privateDrawStartAgeOf,

  // 3-Bucket 현금 버퍼 & 시장 폭락 방패
  calculateThreeBucketPlan,

  // 3중 복합 위기 스트레스 테스트 & 조기/정상/연기 손익분기(BEP)
  runRetirementStressTest,
  calculateNpsEarlyDeferralBep,

  // 공백기 브릿지 및 자산 리밸런싱 주문표
  calculateIncomeBridge,
  calculateRebalancingOrders,
  runPortfolioBacktest,

  // 금융사 갈아타기, DB/DC 전환 및 부족액 역산
  runSavingsPlan,
  calculateSavingsPlan: runSavingsPlan,
  calculateDbDcTransition,
  calculatePensionTransferBenefit,
  calculateIsaPensionTransfer,
};
