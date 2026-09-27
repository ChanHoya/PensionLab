import assert from "node:assert/strict";

// zustand persist는 window.localStorage를 쓰므로 Node에서는 메모리 저장소를 window에 둔다
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => void memory.set(k, v),
      removeItem: (k: string) => void memory.delete(k),
    },
  },
});

async function main() {
  const { usePensionStore, mergeWithDefaults, pensionsOf } = await import("../src/store/usePensionStore");
  const s = usePensionStore.getState();

  // who를 생략하면 본인, SPOUSE면 배우자에 쓴다
  s.setNationalPension({ expectedMonthlyPension: 80 });
  s.setNationalPension({ expectedMonthlyPension: 56 }, "SPOUSE");
  s.addRetirementPension({ pensionType: "IRP", totalAccumulated: 1000 }, "SPOUSE");
  s.setReturnRepayment({ refundAmount: 104.4 }, "SPOUSE");
  s.setAdditionalPayment({ requestedMonths: 119 }, "SPOUSE");
  let st = usePensionStore.getState();
  assert.equal(st.nationalPension.expectedMonthlyPension, 80);
  assert.equal(st.spouse.nationalPension.expectedMonthlyPension, 56);
  assert.equal(st.retirementPensions.length, 0);
  assert.equal(st.spouse.retirementPensions.length, 1);
  assert.equal(pensionsOf(st, "SPOUSE").returnRepayment.refundAmount, 104.4);
  assert.equal(st.additionalPayment.requestedMonths, 0);
  assert.equal(st.spouse.additionalPayment.requestedMonths, 119);

  const id = st.spouse.retirementPensions[0].id;
  st.updateRetirementPension(id, { totalAccumulated: 2000 }, "SPOUSE");
  assert.equal(usePensionStore.getState().spouse.retirementPensions[0].totalAccumulated, 2000);
  st.deleteRetirementPension(id, "SPOUSE");
  assert.equal(usePensionStore.getState().spouse.retirementPensions.length, 0);

  // 이전 버전 백업: 새 필드가 없어도 초기값으로 채우고 액션은 유지한다
  usePensionStore.getState().importStoreData({
    basicPension: { householdType: "SINGLE", recognizedIncome: 10, expectedEligibility: true, expectedMonthlyAmount: 33 },
  } as never);
  st = usePensionStore.getState();
  assert.equal(st.basicPension.expectedMonthlyAmount, 33);
  assert.equal(st.basicPension.region, "METRO");
  assert.equal(st.spouse.nationalPension.expectedMonthlyPension, 0);
  assert.equal(st.simulationParams.spouseLifeExpectancy, 85);
  assert.equal(st.returnRepayment.installments, 1);
  assert.equal(typeof st.setNationalPension, "function");

  // F5: defaults에 없는 알 수 없는 최상위 키는 추가되지 않고, 액션 이름과 같은 키도 액션을 덮어쓰지 않는다
  usePensionStore.getState().importStoreData({
    exportedAt: "2024-01-01T00:00:00.000Z",
    setNationalPension: 1,
    basicPension: { expectedMonthlyAmount: 77 },
  } as never);
  st = usePensionStore.getState();
  assert.equal((st as unknown as Record<string, unknown>).exportedAt, undefined);
  assert.equal(typeof st.setNationalPension, "function");
  assert.equal(st.basicPension.expectedMonthlyAmount, 77);

  // 객체는 재귀 병합, 배열·값은 덮어쓰기
  assert.deepEqual(mergeWithDefaults({ a: { x: 1 }, arr: [9] }, { a: { x: 0, y: 2 }, arr: [1, 2], z: 3 }), {
    a: { x: 1, y: 2 },
    arr: [9],
    z: 3,
  });

  usePensionStore.getState().resetStore();
  assert.equal(usePensionStore.getState().spouse.retirementPensions.length, 0);
  console.log("Couple store validation success!");
}

main();
