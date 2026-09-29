import assert from "node:assert/strict";
import { resolveAge, resolveBirthYear } from "../src/utils/age";
import { statutoryStartAgeOf } from "../src/services/coupleSimulation";
import type { SimulationParamsState } from "../src/store/usePensionStore";

const ref = new Date(2026, 8, 29); // 2026-09-29

// 주민번호 앞자리 → 정확한 출생연도, 숫자 나이 → 기준 연도 − 나이 (근사)
assert.equal(resolveBirthYear("680315", ref), 1968);
assert.equal(resolveBirthYear("681215", ref), 1968); // 생일 전이라 만 57세여도 1968년생
assert.equal(resolveAge("681215", ref), 57);
assert.equal(resolveBirthYear("6812151", ref), 1968);
assert.equal(resolveBirthYear("0501013", ref), 2005);
assert.equal(resolveBirthYear("58", ref), 1968);
assert.equal(resolveBirthYear("", ref), null);

// 법정 개시 연령: 저장된 출생연도가 있으면 그것으로, 없으면 기준 연도 − 나이
const params = { currentAge: 57, spouseAge: 55, birthYear: 1968, spouseBirthYear: 1971 } as SimulationParamsState;
assert.equal(statutoryStartAgeOf(params, "SELF", 2026), 64); // 1968년생 → 64세 (만 57세여도)
assert.equal(statutoryStartAgeOf(params, "SPOUSE", 2026), 65); // 1971년생 → 65세
const noBirth = { currentAge: 58, spouseAge: 55 } as SimulationParamsState;
assert.equal(statutoryStartAgeOf(noBirth, "SELF", 2026), 64); // 2026 − 58 = 1968
assert.equal(statutoryStartAgeOf(noBirth, "SPOUSE", 2026), 65);

console.log("Age validation success!");
