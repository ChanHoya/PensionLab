// [Agent 2] 다층 연금 수리·세무 계산 및 2026 연금개혁 룰셋 계리 엔진 전담 에이전트
import { runPensionSimulation } from "@/services/pensionCalculator";
import { runCoupleSimulation, statutoryStartAgeOf } from "@/services/coupleSimulation";
import { getSpendingMultiplier, buildSpendingCurve } from "@/services/spendingCurve";
import { calculateLocalHealthInsuranceBill } from "@/services/localHealthInsuranceCalculator";
import { analyzePrivatePensionTax } from "@/services/privatePensionTaxOptimizer";
import { generateTaxAndHealthStatement } from "@/services/taxAndHealthStatementService";
import { calculateReverseMortgage, householdReverseMortgage } from "@/services/reverseMortgageCalculator";
import { calculateSurvivorCare } from "@/services/survivorCareCalculator";
import { calcBasicPension } from "@/services/basicPensionCalculator";

export const Agent2ActuarialTaxEngine = {
  // 다층 연금 시뮬레이션
  runPensionSimulation,
  runCoupleSimulation,
  statutoryStartAgeOf,

  // 지출 곡선 스무딩 & 생애 지출 곡선 생성
  getSpendingMultiplier,
  buildSpendingCurve,

  // 세무 및 건강보험료 정밀 판정
  calculateLocalHealthInsuranceBill,
  analyzePrivatePensionTax,
  generateTaxAndHealthStatement,

  // 주택연금 및 유족연금 계리
  calculateReverseMortgage,
  householdReverseMortgage,
  calculateSurvivorCare,
  calcBasicPension,
};
