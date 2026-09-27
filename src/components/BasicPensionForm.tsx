"use client";

import React, { useEffect } from "react";
import { usePensionStore, type BasicPensionState, type NationalPensionState } from "@/store/usePensionStore";
import { calcBasicPension, type BasicPensionPerson } from "@/services/basicPensionCalculator";
import { BASIC_PENSION_RULES, type Region } from "@/config/basicPensionRules";
import { NPS_RULES } from "@/config/npsRules";

const REGION_LABEL: Record<Region, string> = {
  METRO: "대도시 (특별·광역시 구, 특례시)",
  CITY: "중소도시 (도의 시, 세종시)",
  RURAL: "농어촌 (도의 군)",
};

const aShareOf = (n: NationalPensionState) => {
  const A = n.aValue || NPS_RULES.aValue;
  const B = n.bValue || n.currentStandardMonthlyIncome || A;
  return A / (A + B);
};

// 기초연금 (1층, 본인/배우자): 가구 재산 + 두 사람 소득으로 소득인정액·수급액을 계산한다 (2026년 기준, 현재가치)
export default function BasicPensionForm() {
  const store = usePensionStore();
  const b = store.basicPension;
  const hasSpouse = store.simulationParams.hasSpouse;
  const set = (data: Partial<BasicPensionState>) => store.setBasicPension(data);

  const person = (earned: number, other: number, occupational: boolean, n: NationalPensionState): BasicPensionPerson => ({
    alive: true,
    age: BASIC_PENSION_RULES.eligibleAge,
    earnedIncome: earned,
    otherIncome: other,
    nationalPension: n.expectedMonthlyPension,
    aShare: aShareOf(n),
    occupational,
  });
  const household = {
    region: b.region,
    generalProperty: b.generalProperty,
    financialAssets: b.financialAssets,
    debts: b.debts,
    luxuryAssets: b.luxuryAssets,
  };
  // 두 사람 모두 65세 이상이고 생존한 시점 기준 (국민연금은 각자 예상 연금액)
  const result = calcBasicPension(
    person(b.selfEarnedIncome, b.selfOtherIncome, b.selfOccupational, store.nationalPension),
    hasSpouse ? person(b.spouseEarnedIncome, b.spouseOtherIncome, b.spouseOccupational, store.spouse.nationalPension) : null,
    household
  );

  // 기존 본인 기준 엔진(대시보드 S0~S4)이 쓰는 값도 함께 맞춘다
  const householdType = hasSpouse ? "COUPLE" : "SINGLE";
  const recognizedIncome = Math.round(result.recognizedIncome * 10) / 10;
  const expectedMonthlyAmount = Math.round(result.self * 10) / 10;
  const expectedEligibility = result.self > 0;
  useEffect(() => {
    if (
      b.householdType !== householdType ||
      b.recognizedIncome !== recognizedIncome ||
      b.expectedMonthlyAmount !== expectedMonthlyAmount ||
      b.expectedEligibility !== expectedEligibility
    ) {
      store.setBasicPension({ householdType, recognizedIncome, expectedMonthlyAmount, expectedEligibility });
    }
  }, [householdType, recognizedIncome, expectedMonthlyAmount, expectedEligibility, b, store]);

  const numberField = (label: string, value: number, key: keyof BasicPensionState, hint?: string) => (
    <div style={styles.fieldRow}>
      <label style={styles.label}>
        {label} {hint && <span style={styles.labelHint}>{hint}</span>}
      </label>
      <input type="number" min={0} className="premium-input" value={value || ""}
        onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<BasicPensionState>)} />
    </div>
  );

  const personColumn = (title: string, earnedKey: keyof BasicPensionState, otherKey: keyof BasicPensionState, occKey: keyof BasicPensionState) => (
    <div style={styles.column}>
      <h4 style={styles.columnTitle}>{title}</h4>
      {numberField("65세 이후 상시근로소득 (만원/월)", b[earnedKey] as number, earnedKey, "(116만원 공제 후 70% 반영)")}
      {numberField("사업·임대·이자·배당·사적연금 소득 (만원/월)", b[otherKey] as number, otherKey, "(100% 반영)")}
      <div style={styles.fieldRow}>
        <label style={styles.label}>직역연금 수급권</label>
        <select className="premium-input" value={b[occKey] ? "Y" : "N"}
          onChange={(e) => set({ [occKey]: e.target.value === "Y" } as Partial<BasicPensionState>)}>
          <option value="N">해당 없음</option>
          <option value="Y">공무원·사학·군인·별정우체국연금 수급권자</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-in">
      <div style={styles.infoAlert}>
        ℹ️ 기초연금은 만 65세 이상 가구의 소득인정액이 선정기준액(2026년 단독 월 {BASIC_PENSION_RULES.thresholdSingle}만원,
        부부 월 {BASIC_PENSION_RULES.thresholdCouple}만원) 이하일 때 받습니다. 부부가 모두 받으면 각각 20% 감액되고,
        국민연금이 많으면 연계감액이 적용됩니다. 국민연금은 국민연금 단계에서 입력한 예상 연금액을 자동으로 씁니다.
      </div>

      <h4 style={styles.sectionTitle}>① 가구 재산</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>거주지역</label>
          <select className="premium-input" value={b.region} onChange={(e) => set({ region: e.target.value as Region })}>
            {(Object.keys(REGION_LABEL) as Region[]).map((r) => (
              <option key={r} value={r}>{REGION_LABEL[r]}</option>
            ))}
          </select>
        </div>
        {numberField("일반재산: 주택 공시가격 등 (만원)", b.generalProperty, "generalProperty", `(기본공제 ${BASIC_PENSION_RULES.propertyDeduction[b.region].toLocaleString()}만원)`)}
        {numberField("금융재산 (만원)", b.financialAssets, "financialAssets", `(가구당 ${BASIC_PENSION_RULES.financialDeduction.toLocaleString()}만원 공제)`)}
        {numberField("부채: 주택담보대출·임대보증금 (만원)", b.debts, "debts")}
        {numberField("고급 차량·회원권 가액 (만원)", b.luxuryAssets, "luxuryAssets", "(가액 전액이 월 소득으로 반영)")}
      </div>

      <h4 style={styles.sectionTitle}>② 소득 (본인{hasSpouse ? " / 배우자" : ""})</h4>
      <div style={hasSpouse ? styles.twoColumns : undefined}>
        {personColumn("본인", "selfEarnedIncome", "selfOtherIncome", "selfOccupational")}
        {hasSpouse && personColumn("배우자", "spouseEarnedIncome", "spouseOtherIncome", "spouseOccupational")}
      </div>

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>기초연금 예상 수급 결과 ({hasSpouse ? "부부 모두 65세 이상일 때" : "65세 이상일 때"}, 현재가치)</h4>
        <div style={styles.previewGrid}>
          <div>소득인정액: <strong>{result.recognizedIncome.toFixed(1)} 만원/월</strong></div>
          <div>선정기준액: <strong>{result.threshold.toFixed(1)} 만원/월</strong></div>
          <div>본인 기초연금: <strong style={{ color: "var(--text-accent)" }}>{result.self.toFixed(1)} 만원/월</strong></div>
          {hasSpouse && <div>배우자 기초연금: <strong style={{ color: "var(--text-accent)" }}>{result.spouse.toFixed(1)} 만원/월</strong></div>}
        </div>
        {result.notes.map((n) => (
          <p key={n} style={styles.note}>• {n}</p>
        ))}
        <p style={styles.note}>
          ※ 연도별 실제 수급액(한 사람만 65세 이상인 기간, 배우자 사망 후 단독가구 전환 등)은 대시보드의 부부 통합 시뮬레이션에서 계산합니다.
          기초연금은 신청한 달부터 지급되며 소급되지 않습니다.
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0" },
  infoAlert: {
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" },
  twoColumns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  column: { display: "flex", flexDirection: "column", gap: "12px" },
  columnTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", margin: 0 },
  fieldRow: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" },
  labelHint: { fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" },
  previewBox: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
  },
  previewTitle: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px" },
  previewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
};
