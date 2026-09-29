"use client";

import React, { useEffect } from "react";
import { usePensionStore, type SimulationParamsState } from "@/store/usePensionStore";
import { NPS_RULES } from "@/config/npsRules";
import { statutoryStartAgeOf } from "@/services/coupleSimulation";

// 대시보드 왼쪽 입력 열: 시뮬레이션·시나리오에 쓰는 모든 입력을 그룹별로 모은다 (접으면 결과가 전체 폭 사용)
interface Props {
  collapsed: boolean;
  onToggle: () => void;
  personalTaxCreditRatio: number;
  setPersonalTaxCreditRatio: (v: number) => void;
  retirementLumpSumTaxRate: number;
  setRetirementLumpSumTaxRate: (v: number) => void;
  otherIncomeAnnual: number;
  setOtherIncomeAnnual: (v: number) => void;
  s3StartAges: Record<string, number>;
  setS3StartAges: (v: Record<string, number>) => void;
  s3Periods: Record<string, number>;
  setS3Periods: (v: Record<string, number>) => void;
}

export default function DashboardSidebar(props: Props) {
  const store = usePensionStore();
  const params = store.simulationParams;
  const hasSpouse = params.hasSpouse;
  const setParam = (data: Partial<SimulationParamsState>) => store.setSimulationParams(data);

  // 국민연금 개시 나이는 출생연도별 법정 나이로 고정 (늦추려면 「수령 시작」 연기). 예전 저장값(예: 70세)도 맞춘다
  const selfStatutory = statutoryStartAgeOf(params, "SELF");
  const spouseStatutory = statutoryStartAgeOf(params, "SPOUSE");
  // 출생연도: 온보딩에서 주민번호 앞자리로 저장된 값, 없으면 올해 − 나이 (생일 전이면 1년 차이 가능)
  const thisYear = new Date().getFullYear();
  const selfBirth = params.birthYear || thisYear - params.currentAge;
  const spouseBirth = params.spouseBirthYear || thisYear - (params.spouseAge ?? params.currentAge);
  const setSimulationParams = store.setSimulationParams;
  useEffect(() => {
    const fix: Partial<SimulationParamsState> = {};
    if (params.nationalPensionStartAge !== selfStatutory) fix.nationalPensionStartAge = selfStatutory;
    if (hasSpouse && params.spouseNationalPensionStartAge !== spouseStatutory) fix.spouseNationalPensionStartAge = spouseStatutory;
    if (Object.keys(fix).length > 0) setSimulationParams(fix);
  }, [params.nationalPensionStartAge, params.spouseNationalPensionStartAge, selfStatutory, spouseStatutory, hasSpouse, setSimulationParams]);

  if (props.collapsed) {
    return (
      <aside style={styles.rail} className="dash-sidebar">
        <button type="button" onClick={props.onToggle} style={styles.railButton} title="입력 옵션 펼치기">
          ▶<span style={styles.railText}>입력 옵션</span>
        </button>
      </aside>
    );
  }

  const slider = (label: string, value: number, unit: string, min: number, max: number, step: number, onChange: (v: number) => void) => (
    <div style={styles.field}>
      <div style={styles.labelRow}>
        <label style={styles.label}>{label}</label>
        <span style={styles.value}>
          {value}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={styles.range} />
    </div>
  );
  const number = (label: string, value: number, onChange: (v: number) => void, hint?: string, placeholder?: string) => (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {hint && <span style={styles.hint}>{hint}</span>}
      </label>
      <input type="number" min={0} className="premium-input" style={styles.input} placeholder={placeholder ?? "0"} value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
  const deferSelect = (label: string, value: number, baseAge: number, key: "nationalPensionDeferYears" | "spouseNationalPensionDeferYears") => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <select className="premium-input" style={styles.input} value={value} onChange={(e) => setParam({ [key]: Number(e.target.value) })}>
        {Array.from({ length: NPS_RULES.maxDeferralYears + 1 }, (_, y) => (
          <option key={y} value={y}>
            {y === 0 ? `연기 안 함 (${baseAge}세)` : `${y}년 연기 · ${baseAge + y}세 (+${(NPS_RULES.deferralBonusPerYear * y * 100).toFixed(1)}%)`}
          </option>
        ))}
      </select>
    </div>
  );
  const accounts = [
    ...store.retirementPensions.map((p) => ({ id: p.id, name: `${p.pensionType} 퇴직연금` })),
    ...store.personalPensions.map((p) => ({ id: p.id, name: `개인연금저축 (${p.savingsType})` })),
    ...store.pensionInsurances.map((i) => ({ id: i.id, name: `연금보험 (${i.insuranceType})` })),
    // 배우자 계좌 (가구 기준 시나리오)
    ...(hasSpouse
      ? [
          ...store.spouse.retirementPensions.map((p) => ({ id: p.id, name: `배우자 ${p.pensionType} 퇴직연금` })),
          ...store.spouse.personalPensions.map((p) => ({ id: p.id, name: `배우자 개인연금저축 (${p.savingsType})` })),
          ...store.spouse.pensionInsurances.map((i) => ({ id: i.id, name: `배우자 연금보험 (${i.insuranceType})` })),
        ]
      : []),
  ];
  const coveredCallAsset = params.coveredCallAsset || 5000;
  const coveredCallRate = params.coveredCallDividendRate || 9.0;

  return (
    <aside style={styles.sidebar} className="dash-sidebar">
      <div style={styles.header}>
        <span style={styles.headerTitle}>⚙️ 입력 옵션</span>
        <button type="button" onClick={props.onToggle} style={styles.collapseButton} title="입력 옵션 접기">
          ◀ 접기
        </button>
      </div>

      <details open style={styles.group}>
        <summary style={styles.summary}>기본</summary>
        {slider("본인 기대수명", params.expectedLifeExpectancy, "세", 75, 105, 1, (v) => setParam({ expectedLifeExpectancy: v }))}
        {hasSpouse && slider("배우자 기대수명", params.spouseLifeExpectancy, "세", 75, 105, 1, (v) => setParam({ spouseLifeExpectancy: v }))}
        {slider("물가상승률", params.inflationRate, "%", 0.5, 6, 0.1, (v) => setParam({ inflationRate: v }))}
        <p style={styles.note}>기본 3% (최근 30년 평균 약 2.7%)</p>
      </details>

      <details open style={styles.group}>
        <summary style={styles.summary}>국민연금</summary>
        {deferSelect(`본인 수령 시작 (${selfBirth}년생 · 법정 ${selfStatutory}세)`, params.nationalPensionDeferYears, selfStatutory, "nationalPensionDeferYears")}
        {hasSpouse &&
          deferSelect(
            `배우자 수령 시작 (${spouseBirth}년생 · 법정 ${spouseStatutory}세)`,
            params.spouseNationalPensionDeferYears,
            spouseStatutory,
            "spouseNationalPensionDeferYears"
          )}
        <p style={styles.note}>
          법정 개시 나이는 출생연도로 정해집니다 (1965~68년생 64세, 1969년생 이후 65세). 최대 {NPS_RULES.maxDeferralYears}년 연기,
          1년마다 +{(NPS_RULES.deferralBonusPerYear * 100).toFixed(1)}%. 시뮬레이션과 모든 시나리오에 같이 적용됩니다.
          {(!params.birthYear || (hasSpouse && !params.spouseBirthYear)) && " 출생연도가 다르면 「정보 재입력」에서 주민번호 앞자리로 나이를 다시 입력하세요."}
        </p>
      </details>

      <details open style={styles.group}>
        <summary style={styles.summary}>퇴직·개인연금 인출</summary>
        <div style={styles.field}>
          <label style={styles.label}>인출 방식</label>
          <select className="premium-input" style={styles.input} value={params.decumulationStrategy}
            onChange={(e) => setParam({ decumulationStrategy: e.target.value as SimulationParamsState["decumulationStrategy"] })}>
            <option value="FLAT">가구 평탄화 · 총액 유지</option>
            <option value="DECREASING">가구 평탄화 · 완만한 체감 (매년 2%↓)</option>
          </select>
        </div>
        {/* 가구 사적연금 소진 나이 (본인 나이 기준). 배우자 칸은 가구 평탄화에서 쓰지 않아 두지 않는다 */}
        <div style={styles.field}>
          <label style={styles.label}>{hasSpouse ? "사적연금 수령 종료 나이 (본인 나이 기준)" : "사적연금 수령 종료 나이"}</label>
          <input type="number" min={0} className="premium-input" style={styles.input} value={params.privatePensionEndAge || ""}
            placeholder={`비우면 ${params.expectedLifeExpectancy}세(기대수명)`}
            onChange={(e) => setParam({ privatePensionEndAge: Number(e.target.value) })} />
        </div>
        <p style={styles.note}>
          {hasSpouse ? "부부의" : ""} 퇴직·개인연금 전체를 수령 종료 나이까지 나눠, 국민연금 위에 부족분만 채워 가구 총액을 고르게(또는 매년 2%씩 줄게)
          받습니다. 국민연금 개시 때 총액이 튀거나 상품 만기 때 끊기지 않습니다. 부부 통합 시뮬레이션과 S0에 적용됩니다.
        </p>
      </details>

      <details open style={styles.group}>
        <summary style={styles.summary}>세금·건보료</summary>
        {slider("연금저축 세액공제 비율", Math.round(props.personalTaxCreditRatio * 100), "%", 0, 100, 5, (v) => props.setPersonalTaxCreditRatio(v / 100))}
        {slider("퇴직소득세율", Math.round(props.retirementLumpSumTaxRate * 100), "%", 1, 25, 1, (v) => props.setRetirementLumpSumTaxRate(v / 100))}
        {number("기타 연 소득", props.otherIncomeAnnual, props.setOtherIncomeAnnual, "(만원/년)")}
        {number("재산세 과세표준", params.propertyTaxBase, (v) => setParam({ propertyTaxBase: v }), "(만원 · 연 1.2% 근사)")}
        {number("금융소득 이자+배당", params.financialIncome, (v) => setParam({ financialIncome: v }), "(만원/년 · 1,000만원 초과분 7.09%)")}
      </details>

      <details style={styles.group}>
        <summary style={styles.summary}>S3 커스텀 · 계좌별 인출</summary>
        <p style={styles.note}>계좌별 개시·기간은 인출전략 S3(사용자 정의 커스텀 전략) 탭에만 적용됩니다.</p>
        {accounts.length === 0 ? (
          <p style={styles.note}>등록된 퇴직·개인연금이 없습니다.</p>
        ) : (
          accounts.map((a) => {
            const start = props.s3StartAges[a.id] || 60;
            const period = props.s3Periods[a.id] || 10;
            return (
              <div key={a.id} style={styles.account}>
                <span style={styles.accountName}>{a.name}</span>
                {slider("개시", start, "세", 55, 80, 1, (v) => props.setS3StartAges({ ...props.s3StartAges, [a.id]: v }))}
                {slider("기간", period, "년", 5, 30, 1, (v) => props.setS3Periods({ ...props.s3Periods, [a.id]: v }))}
              </div>
            );
          })
        )}
      </details>

      <details style={styles.group}>
        <summary style={styles.summary}>S4 하이브리드 · 배당</summary>
        {slider("커버드콜 투자금", coveredCallAsset, "만원", 0, 50000, 500, (v) => setParam({ coveredCallAsset: v }))}
        {slider("예상 연 분배율", coveredCallRate, "%", 2, 15, 0.5, (v) => setParam({ coveredCallDividendRate: v }))}
        <label style={styles.checkbox}>
          <input type="checkbox" checked={params.isCoupleDivided || false} onChange={(e) => setParam({ isCoupleDivided: e.target.checked })} />
          부부 명의 분산 (인당 배당 1,000만원 한도)
        </label>
      </details>
    </aside>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rail: {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "8px 4px",
  },
  railButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "var(--text-accent)",
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  railText: { writingMode: "vertical-rl", fontSize: "0.8rem", letterSpacing: "0.1em" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" },
  collapseButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.72rem",
    padding: "4px 8px",
    cursor: "pointer",
  },
  group: { borderTop: "1px solid var(--border)", paddingTop: "8px" },
  summary: { cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-accent)", marginBottom: "6px" },
  field: { display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" },
  hint: { fontSize: "0.68rem", fontWeight: 400, color: "var(--text-muted)" },
  value: { fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)" },
  range: { width: "100%", cursor: "pointer", accentColor: "var(--primary)" },
  input: { fontSize: "0.8rem", padding: "6px 8px" },
  note: { fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 4px" },
  account: { borderBottom: "1px dashed var(--border)", paddingBottom: "6px", marginBottom: "6px" },
  accountName: { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" },
  checkbox: { display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer" },
};
