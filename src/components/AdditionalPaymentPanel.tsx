"use client";

import React from "react";
import { usePensionStore, pensionsOf, AdditionalPaymentState, type Who } from "@/store/usePensionStore";
import { runAdditionalPaymentPlan, monthsBetween, firstDueYmOf, effectiveBaseIncome, isVoluntary } from "@/services/additionalPaymentCalculator";
import { personParams } from "@/services/coupleSimulation";
import { NPS_RULES } from "@/config/npsRules";
import AdditionalPaymentInsights from "@/components/AdditionalPaymentInsights";
import ReturnRepaymentSection, { RefundScenarioComparison } from "@/components/ReturnRepaymentSection";
import NpsHistoryUpload from "@/components/NpsHistoryUpload";

const fmt = (v: number) => Math.round(v).toLocaleString();
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

// 공단 안내 기준 추납 가능 기간의 시작일
const GAP_REASON_HINT: Record<AdditionalPaymentState["gapReason"], string> = {
  EXEMPT: "사업중단·실직 등으로 납부예외를 신청한 기간",
  EXCLUDED: "'99.4.1 이후 무소득배우자, '01.4.1 이후 기초수급자, '08.1.1 이후 1년 이상 행방불명자, '15.7.29 이후 18세 미만 사업장가입자",
  MILITARY: "'88.1.1 이후 군복무 (군인연금·타 공적연금 가입기간 제외)",
  ARREARS: "보험료를 내야 했는데 내지 않은 기간 — 추납 대상 아님",
};

export default function AdditionalPaymentPanel({ who = "SELF" }: { who?: Who }) {
  const store = usePensionStore();
  const person = pensionsOf(store, who);
  const national = person.nationalPension;
  const params = personParams(store.simulationParams, who);
  const ap = person.additionalPayment;
  const set = (data: Partial<AdditionalPaymentState>) => store.setAdditionalPayment(data, who);
  const plan = runAdditionalPaymentPlan(ap, national, params);
  const span = ap.firstEnrollYm && ap.resumeYm ? monthsBetween(ap.firstEnrollYm, ap.resumeYm) : 0;
  const hasNpsData = national.expectedTotalContributionMonths > 0;
  const voluntary = isVoluntary(ap);
  const effectiveIncome = voluntary
    ? ap.baseIncome
    : effectiveBaseIncome({ ...ap, baseIncome: national.currentStandardMonthlyIncome || ap.baseIncome });
  // 반환일시금을 받은 적 있으면 ② 반환일시금 반납이 끼어들어 이후 번호가 하나씩 밀린다
  const hasRefund = ap.receivedLumpSumRefund;
  const showInsights = plan.months > 0 && !!ap.applyYm;
  const no = (i: number) => CIRCLED[i + (hasRefund ? 1 : 0)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animate-fade-in">
      <div style={styles.infoAlert}>
        💡 소득이 없어 보험료를 못 낸 기간(납부예외·적용제외·군복무)을 나중에 채워 넣어 <strong>가입기간을 늘리는 제도</strong>입니다.
        최대 {NPS_RULES.maxAdditionalMonths}개월까지 가능하며, 적은 금액으로 긴 기간을 채울수록 효율이 좋습니다.
      </div>
      <NpsHistoryUpload who={who} />
      {!hasNpsData && (
        <div style={styles.warnAlert}>
          ⚠ 「NPS 공단고서 상세 입력」 또는 「금융감독원 통합연금 자료 등록」 탭에서 총 예상 가입월수를 입력하지 않으면
          추가 연금액을 계산할 수 없습니다. 예상 가입기간·예상 연금액을 먼저 입력하세요.
        </div>
      )}

      <h4 style={styles.sectionTitle}>① 가입 이력</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>최초 가입년월</label>
          <input type="month" className="premium-input" value={ap.firstEnrollYm}
            onChange={(e) => set({ firstEnrollYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>지속 가입개시 년월 <span style={styles.labelHint}>(중단 후 다시 내기 시작한 달)</span></label>
          <input type="month" className="premium-input" value={ap.resumeYm}
            onChange={(e) => set({ resumeYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            중단 기간 (개월) {span > 0 && <span style={styles.labelHint}>(두 년월 사이 최대 {span}개월)</span>}
          </label>
          <input type="number" className="premium-input" min={0} placeholder="예: 84" value={ap.gapMonths || ""}
            onChange={(e) => set({ gapMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>중단 사유</label>
          <select className="premium-input" value={ap.gapReason}
            onChange={(e) => set({ gapReason: e.target.value as AdditionalPaymentState["gapReason"] })}>
            <option value="EXEMPT">납부예외 (실직·휴직·사업중단)</option>
            <option value="EXCLUDED">적용제외 (무소득 배우자 등)</option>
            <option value="MILITARY">군복무</option>
            <option value="ARREARS">체납 (미납)</option>
          </select>
          <span style={styles.labelHint}>{GAP_REASON_HINT[ap.gapReason]}</span>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>현재 가입 상태</label>
          <select className="premium-input" value={ap.enrollStatus}
            onChange={(e) => set({ enrollStatus: e.target.value as AdditionalPaymentState["enrollStatus"] })}>
            <option value="WORKPLACE">사업장가입자 (직장)</option>
            <option value="REGIONAL">지역가입자</option>
            <option value="VOLUNTARY">임의가입자</option>
            <option value="VOLUNTARY_CONT">임의계속가입자 (60세 이후)</option>
            <option value="NONE">미가입</option>
          </select>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 수령 여부</label>
          <select className="premium-input" value={ap.receivedLumpSumRefund ? "Y" : "N"}
            onChange={(e) => set({ receivedLumpSumRefund: e.target.value === "Y" })}>
            <option value="N">받은 적 없음</option>
            <option value="Y">받은 적 있음</option>
          </select>
        </div>
      </div>

      {hasRefund && <ReturnRepaymentSection who={who} title="② 일시금 납부" />}

      <h4 style={styles.sectionTitle}>{no(1)} 추납 조건</h4>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>추납 희망 개월수 <span style={styles.labelHint}>(가능: {plan.eligibility.maxMonths}개월)</span></label>
          <input type="number" className="premium-input" min={0} value={ap.requestedMonths || ""}
            onChange={(e) => set({ requestedMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            추납 기준소득월액 (만원)
            <span style={styles.labelHint}>
              {voluntary
                ? ` (임의가입: ${NPS_RULES.voluntaryIncomeFloor}~${Math.floor(NPS_RULES.aValue)}만원, 신청일 기준 A값 상한)`
                : " (현재 기준소득월액 자동 적용)"}
            </span>
          </label>
          <input type="number" className="premium-input" min={0}
            readOnly={!voluntary}
            value={voluntary ? (ap.baseIncome || "") : Math.round(effectiveIncome)}
            onChange={(e) => voluntary && set({ baseIncome: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            신청 년월 {ap.applyYm && <span style={styles.labelHint}>(첫 납부기한: {firstDueYmOf(ap.applyYm)} 말일)</span>}
          </label>
          <input type="month" className="premium-input" value={ap.applyYm}
            onChange={(e) => set({ applyYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>납부 방식</label>
          <select className="premium-input" value={ap.paymentMode}
            onChange={(e) => set({ paymentMode: e.target.value as AdditionalPaymentState["paymentMode"] })}>
            <option value="LUMP">일시납</option>
            <option value="INSTALLMENT">분납</option>
          </select>
        </div>
        {ap.paymentMode === "INSTALLMENT" && (
          <>
            <div style={styles.fieldRow}>
              <label style={styles.label}>분납 횟수 <span style={styles.labelHint}>(최대 {NPS_RULES.maxInstallments}회)</span></label>
              <input type="number" className="premium-input" min={1} step={1} value={ap.installments || ""}
                onChange={(e) => set({ installments: Number(e.target.value) })} />
            </div>
            <div style={styles.fieldRow}>
              <label style={styles.label}>분납이자율 (%/년) <span style={styles.labelHint}>(1년 만기 정기예금 이자율)</span></label>
              <input type="number" step="0.1" min={0} className="premium-input" value={ap.installmentInterestRate}
                onChange={(e) => set({ installmentInterestRate: Number(e.target.value) })} />
            </div>
          </>
        )}
        <div style={styles.fieldRow}>
          <label style={styles.label}>한계세율 (%) <span style={styles.labelHint}>(소득공제 환급 추정, 소득 없으면 0)</span></label>
          <input type="number" step="0.1" min={0} className="premium-input" value={ap.marginalTaxRate}
            onChange={(e) => set({ marginalTaxRate: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>대시보드 시뮬레이션에 반영</label>
          <select className="premium-input" value={ap.applyToSimulation ? "Y" : "N"}
            onChange={(e) => set({ applyToSimulation: e.target.value === "Y" })}>
            <option value="N">반영 안 함</option>
            <option value="Y">추납 후 연금액으로 반영</option>
          </select>
        </div>
      </div>

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>{no(2)} 추납 결과 요약</h4>
        {plan.eligibility.issues.map((msg) => (
          <div key={msg} style={{ ...styles.warnAlert, marginBottom: "8px" }}>⚠ {msg}</div>
        ))}
        {plan.months > 0 && ap.applyYm ? (
          <div style={styles.previewGrid}>
            <div>추납 개월수: <strong>{plan.months}개월</strong> ({plan.increase.totalMonthsBefore} → {plan.increase.totalMonthsAfter}개월)</div>
            <div>추납 보험료: <strong>{fmt(plan.cost.total)} 만원</strong> {ap.paymentMode === "INSTALLMENT" && `(일시납 ${fmt(plan.cost.lumpSumTotal)} 만원)`}</div>
            <div>소득공제 환급 추정: <strong>{fmt(plan.taxRefund)} 만원</strong> → 순비용 <strong>{fmt(plan.netCost)} 만원</strong></div>
            <div>
              예상 연금 월액: <strong>{plan.increase.beforeMonthly.toFixed(1)} → {plan.increase.afterMonthly.toFixed(1)} 만원</strong>{" "}
              <strong style={{ color: "var(--text-accent)" }}>(+{plan.increase.deltaMonthly.toFixed(1)})</strong>
            </div>
            <div>
              손익분기: <strong style={{ color: "var(--text-accent)" }}>
                {plan.breakEven.breakEvenAge === null ? "기대수명 내 회수 불가" : `${plan.breakEven.breakEvenAge}세 (수령 ${plan.breakEven.yearsToBreakEven}년차)`}
              </strong>
            </div>
            <div>기대수명({params.expectedLifeExpectancy}세)까지 순이익: <strong>{fmt(plan.breakEven.lifetimeGain)} 만원</strong></div>
          </div>
        ) : (
          plan.eligibility.eligible && <div style={styles.labelHint}>추납 희망 개월수와 신청 년월을 입력하면 결과가 계산됩니다.</div>
        )}
        {plan.warnings.map((msg) => (
          <div key={msg} style={{ ...styles.warnAlert, marginTop: "8px" }}>⚠ {msg}</div>
        ))}
        <p style={{ ...styles.labelHint, marginTop: "10px" }}>
          ※ 현재가치 기준 추정치입니다. 정확한 추납 보험료와 연금 증가액은 국민연금공단(☎1355, 내곁에국민연금 앱) 추납 예상액 조회로 확인하세요.
        </p>
      </div>
      {showInsights && <AdditionalPaymentInsights plan={plan} paymentMode={ap.paymentMode} isVoluntary={voluntary} sectionNo={no(3)} />}
      <RefundScenarioComparison who={who} title={`${no(showInsights ? 4 : 3)} 대안별 비교`} />
    </div>
  );
}

// onboarding/page.tsx의 스타일 값과 동일하게 맞춤 (warnAlert·sectionTitle만 신규)
const styles: { [key: string]: React.CSSProperties } = {
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
  warnAlert: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    borderLeft: "3px solid rgba(245, 158, 11, 0.7)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0" },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" },
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
};
