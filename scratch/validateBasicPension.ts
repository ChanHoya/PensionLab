import assert from "node:assert/strict";
import { calcBasicPension, type BasicPensionPerson, type BasicPensionHousehold } from "../src/services/basicPensionCalculator";

const near = (actual: number, expected: number, eps = 0.01) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

const person = (o: Partial<BasicPensionPerson> = {}): BasicPensionPerson => ({
  alive: true,
  age: 66,
  earnedIncome: 0,
  otherIncome: 0,
  nationalPension: 0,
  aShare: 0.5,
  occupational: false,
  ...o,
});
const hh = (o: Partial<BasicPensionHousehold> = {}): BasicPensionHousehold => ({
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  ...o,
});

// 참고 사례 A: 서울 공시가 6억 단독 → 소득환산 월 155만원, 전액 수급
const a = calcBasicPension(person(), null, hh({ generalProperty: 60000 }));
near(a.recognizedIncome, 155);
assert.equal(a.threshold, 247);
near(a.self, 34.97);

// 참고 사례 B: 중소도시 공시가 8억 부부, 주담대 2억 → 월 171.67만원, 부부 각 20% 감액
const b = calcBasicPension(person(), person({ age: 67 }), hh({ region: "CITY", generalProperty: 80000, debts: 20000 }));
near(b.recognizedIncome, 171.67);
assert.equal(b.threshold, 395.2);
near(b.self, 27.976);
near(b.spouse, 27.976);

// 부부 중 한 명만 65세 이상 → 부부 기준 심사, 감액 없음
const c = calcBasicPension(person(), person({ age: 60 }), hh());
assert.equal(c.threshold, 395.2);
near(c.self, 34.97);
assert.equal(c.spouse, 0);

// 근로소득: 116만원 공제 후 70% 반영
near(calcBasicPension(person({ earnedIncome: 216 }), null, hh()).recognizedIncome, 70);

// 국민연금 연계감액: 국민연금 80만원(A급여 40만원) → 34.97 − ⅔×40 + 17.485
near(calcBasicPension(person({ nationalPension: 80 }), null, hh()).self, 25.79);
// 연계감액 하한: 기준연금액의 50%
near(calcBasicPension(person({ nationalPension: 200 }), null, hh()).self, 17.485);

// 소득역전방지: 소득인정액 230 + 34.97 > 247 → 17만원
near(calcBasicPension(person({ otherIncome: 230 }), null, hh()).self, 17);

// 선정기준 초과 / 직역연금
assert.equal(calcBasicPension(person({ nationalPension: 250 }), null, hh({ generalProperty: 60000 })).eligible, false);
assert.equal(calcBasicPension(person(), person({ occupational: true }), hh()).self, 0);

// 금액 기준 물가 지수 (index 1.1 → 기준연금액 38.467)
near(calcBasicPension(person(), null, hh(), 1.1).self, 38.467);

console.log("Basic pension validation success!");
