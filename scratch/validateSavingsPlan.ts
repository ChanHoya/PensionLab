import assert from "node:assert/strict";
import { annualTaxCredit, requiredMonthly, runSavingsPlan } from "../src/services/savingsPlan";

const near = (actual: number, expected: number, eps: number) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

// 영상 「텐텐 공식」: 50세부터 월 100만원 10년 적립 → 10년 거치 → 70세부터 30년 수령, 연 7%, 물가 0
// 60세 약 1.7억, 70세 약 3.4억, 월 약 219만원
const ten = runSavingsPlan({ monthly: 100, contributeYears: 10, holdYears: 10, payoutYears: 30, returnRate: 7, inflationRate: 0, indexed: false }, 50);
near(ten.path.find((x) => x.age === 60)!.real, 17000, 400);
near(ten.potNominal, 34000, 800);
near(ten.monthlyPayoutReal, 219, 5);
assert.equal(ten.payoutStartAge, 70);
assert.equal(ten.totalPaid, 12000);
near(ten.path[ten.path.length - 1].real, 0, 1); // 수령 기간 끝에 소진
assert.equal(ten.path[ten.path.length - 1].age, 100);

// 40세에 시작하면 70세 약 6.6억, 월 약 431만원 (영상)
const early = runSavingsPlan({ monthly: 100, contributeYears: 10, holdYears: 20, payoutYears: 30, returnRate: 7, inflationRate: 0, indexed: false }, 40);
near(early.potNominal, 66000, 1800);
near(early.monthlyPayoutReal, 431, 12);

// 물가 반영: 현재가치 = 명목 ÷ (1+물가)^기간, 수령액은 실질 수익률로 나눠 구매력 유지
const infl = runSavingsPlan({ monthly: 100, contributeYears: 10, holdYears: 10, payoutYears: 30, returnRate: 7, inflationRate: 2.5, indexed: false }, 50);
near(infl.potReal, infl.potNominal / Math.pow(1.025, 20), 1);
assert.ok(infl.monthlyPayoutReal < ten.monthlyPayoutReal);
near(infl.monthlyPayoutNominal, infl.monthlyPayoutReal * Math.pow(1.025, 20), 0.5);
// 납입액을 물가만큼 늘리면 더 많이 내고 더 많이 받는다
const indexed = runSavingsPlan({ monthly: 100, contributeYears: 10, holdYears: 10, payoutYears: 30, returnRate: 7, inflationRate: 2.5, indexed: true }, 50);
assert.ok(indexed.totalPaid > infl.totalPaid && indexed.monthlyPayoutReal > infl.monthlyPayoutReal);

// 수익률 = 물가면 실질 0%: 적립금(현재가치)을 그대로 나눠 받음.
// 납입액은 1년에 한 번 올리므로 그해 안에 낸 돈은 물가만큼 조금씩 실질 가치가 줄어 원금 12,000만원보다 약간 적다
const zero = runSavingsPlan({ monthly: 100, contributeYears: 10, holdYears: 0, payoutYears: 20, returnRate: 2.5, inflationRate: 2.5, indexed: true }, 55);
assert.ok(zero.potReal > 11800 && zero.potReal < 12000, `실질 0%: ${zero.potReal}`);
near(zero.monthlyPayoutReal, zero.potReal / 240, 0.01);

// 역산: 필요한 납입액으로 다시 돌리면 목표 월 수령액이 나온다 (부족액 + 일시 필요액)
const base = { contributeYears: 10, holdYears: 5, payoutYears: 25, returnRate: 5, inflationRate: 2.5, indexed: true };
const need = requiredMonthly(80, 0, base, 50);
near(runSavingsPlan({ ...base, monthly: need }, 50).monthlyPayoutReal, 80, 0.01);
const needLump = requiredMonthly(0, 10000, base, 50);
near(runSavingsPlan({ ...base, monthly: needLump }, 50).potReal, 10000, 0.5);
assert.equal(requiredMonthly(0, 0, base, 50), 0);

// 세액공제: 연 900만원 한도
near(annualTaxCredit(75, true), 148.5, 0.01);
near(annualTaxCredit(100, false), 118.8, 0.01);
near(annualTaxCredit(50, false), 79.2, 0.01);

console.log(`텐텐: 60세 ${Math.round(ten.path[10].real)}만, 70세 ${Math.round(ten.potNominal)}만, 월 ${ten.monthlyPayoutReal.toFixed(1)}만원`);
console.log("Savings plan validation success!");
