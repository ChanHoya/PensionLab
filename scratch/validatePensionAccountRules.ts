import { assessAccountRegulation } from "../src/services/pensionAccountRules";

console.log("=== Pension Account Regulation & IRP 70% Limit Validation Suite ===");

// 1. 연금저축펀드 100% 위험자산 테스트
const pensionSavingsTest = assessAccountRegulation("PENSION_SAVINGS", [
  { name: "TIGER 미국배당다우존스", amountWon: 50000000, isRiskAsset: true },
]);
console.log(`[PENSION_SAVINGS] isCompliant: ${pensionSavingsTest.isCompliant}, riskRatio: ${pensionSavingsTest.riskRatio}%`);
if (!pensionSavingsTest.isCompliant || pensionSavingsTest.riskRatio !== 100) {
  console.error("FAIL: Pension Savings should allow 100% risk assets!");
  process.exit(1);
}

// 2. IRP 정상 준수 테스트 (위험 60%, 안전 40%)
const irpCompliantTest = assessAccountRegulation("IRP", [
  { name: "TIGER 미국배당다우존스 (주식형)", amountWon: 60000000, isRiskAsset: true },
  { name: "SOL 미국배당미국채혼합50 (안전자산)", amountWon: 40000000, isRiskAsset: false },
]);
console.log(`[IRP Compliant] isCompliant: ${irpCompliantTest.isCompliant}, riskRatio: ${irpCompliantTest.riskRatio}%, safeRatio: ${irpCompliantTest.safeRatio}%`);
if (!irpCompliantTest.isCompliant || irpCompliantTest.riskRatio !== 60 || irpCompliantTest.safeRatio !== 40) {
  console.error("FAIL: IRP with 60% risk asset should be compliant!");
  process.exit(1);
}

// 3. IRP 한도 초과 테스트 (위험 8000만원, 안전 2000만원 = 위험 80%)
const irpViolationTest = assessAccountRegulation("IRP", [
  { name: "TIGER 미국배당다우존스", amountWon: 80000000, isRiskAsset: true },
  { name: "정기예금", amountWon: 20000000, isRiskAsset: false },
]);
console.log(`[IRP Violation] isCompliant: ${irpViolationTest.isCompliant}, riskRatio: ${irpViolationTest.riskRatio}%, excessRisk: ${Math.round(irpViolationTest.excessRiskWon / 10000)}만원`);
if (irpViolationTest.isCompliant) {
  console.error("FAIL: IRP with 80% risk asset must NOT be compliant!");
  process.exit(1);
}
// 1억원 중 70%는 7000만원, 위험자산이 8000만원이므로 초과액은 1000만원
if (Math.round(irpViolationTest.excessRiskWon / 10000) !== 1000) {
  console.error(`FAIL: Excess risk should be 1000만원, got ${Math.round(irpViolationTest.excessRiskWon / 10000)}만원`);
  process.exit(1);
}
// 안전자산 추가납입 필요액: 8000 / 0.7 - 10000 = 11428.57 - 10000 ≈ 1429만원
console.log(`[IRP Violation] Required safe asset deposit: ${Math.round(irpViolationTest.requiredSafeDepositWon / 10000)}만원`);
if (Math.round(irpViolationTest.requiredSafeDepositWon / 10000) !== 1429) {
  console.error(`FAIL: Required safe deposit should be 1429만원, got ${Math.round(irpViolationTest.requiredSafeDepositWon / 10000)}만원`);
  process.exit(1);
}

console.log("✅ All Pension Account Regulation tests PASSED!");
