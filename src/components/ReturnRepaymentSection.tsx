"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";
import { usePensionStore, pensionsOf, type ReturnRepaymentState, type Who } from "@/store/usePensionStore";
import {
  calcRepaymentCost,
  compareRefundScenarios,
  isRepaymentReady,
  type ScenarioId,
} from "@/services/returnRepaymentCalculator";
import { personParams } from "@/services/coupleSimulation";
import { maxRefundInstallments } from "@/config/npsRules";
import ChartTooltip from "@/components/ChartTooltip";

const fmt = (v: number) => Math.round(v).toLocaleString();
const SCENARIO_COLORS: Record<ScenarioId, string> = { D: "#94a3b8", B: "#f59e0b", C: "#a855f7", A: "#6366f1" };

// 반환일시금 반납 입력 (반환일시금 「받은 적 있음」일 때만 표시)
export default function ReturnRepaymentSection({ who, title }: { who: Who; title: string }) {
  const store = usePensionStore();
  const person = pensionsOf(store, who);
  const rr = person.returnRepayment;
  const params = personParams(store.simulationParams, who);
  const set = (data: Partial<ReturnRepaymentState>) => store.setReturnRepayment(data, who);
  const cost = isRepaymentReady(rr) ? calcRepaymentCost(rr) : null;
  const maxInstallments = maxRefundInstallments(rr.restoredMonths);
  // 결과 요약은 대안 비교의 D(현행)·B(반납)를 그대로 쓴다
  const [D, B] = compareRefundScenarios(person.nationalPension, rr, person.additionalPayment, params);
  const hasNpsData = person.nationalPension.expectedTotalContributionMonths > 0;
  const lifeYears = Math.max(0, params.expectedLifeExpectancy - params.nationalPensionStartAge + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      <div style={styles.infoAlert}>
        💡 예전에 받은 반환일시금을 이자와 함께 돌려주면 그 가입기간이 <strong>당시 소득대체율 그대로</strong> 되살아납니다
        (1988~1998년 가입분은 70%). 공단 반납 고지액을 입력하면 그 금액을, 비워 두면 공단 고시 연도별 정기예금 이자율로 추정합니다.
      </div>
      <div style={styles.fieldGrid}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 원금 (만원)</label>
          <input type="number" min={0} className="premium-input" value={rr.refundAmount || ""}
            onChange={(e) => set({ refundAmount: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반환일시금 수령년월</label>
          <input type="month" className="premium-input" value={rr.refundYm}
            onChange={(e) => set({ refundYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>복원 가입기간 (개월)</label>
          <input type="number" min={0} className="premium-input" value={rr.restoredMonths || ""}
            onChange={(e) => set({ restoredMonths: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>복원 기간 시작년월 <span style={styles.labelHint}>(당시 가입 시작, 소득대체율 판정)</span></label>
          <input type="month" className="premium-input" value={rr.periodStartYm}
            onChange={(e) => set({ periodStartYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>공단 반납 고지액 (만원) <span style={styles.labelHint}>(모르면 비워 두세요 · ☎1355 조회)</span></label>
          <input type="number" min={0} className="premium-input" value={rr.noticeAmount || ""}
            onChange={(e) => set({ noticeAmount: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>반납 신청년월</label>
          <input type="month" className="premium-input" value={rr.applyYm}
            onChange={(e) => set({ applyYm: e.target.value })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>분할 횟수 <span style={styles.labelHint}>(1 = 일시납, 최대 {maxInstallments}회)</span></label>
          <input type="number" min={1} step={1} className="premium-input" value={rr.installments || ""}
            onChange={(e) => set({ installments: Number(e.target.value) })} />
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>대시보드 시뮬레이션에 반영</label>
          <select className="premium-input" value={rr.applyToSimulation ? "Y" : "N"}
            onChange={(e) => set({ applyToSimulation: e.target.value === "Y" })}>
            <option value="N">반영 안 함</option>
            <option value="Y">반납 후 연금액으로 반영</option>
          </select>
        </div>
      </div>

      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>일시금 납부 결과 요약</h4>
        {cost ? (
          <div style={styles.previewGrid}>
            <div>반납금: <strong>{fmt(cost.lumpSum)} 만원</strong> ({cost.source === "NOTICE" ? "공단 고지액" : `원금 ${fmt(cost.principal)}만원 + 이자 추정`})</div>
            <div>분할 {cost.installments}회 추가 이자: <strong>{fmt(cost.installmentInterest)} 만원</strong> → 총 <strong>{fmt(cost.total)} 만원</strong></div>
            {hasNpsData && (
              <>
                <div>복원 개월수: <strong>{rr.restoredMonths}개월</strong> ({D.totalMonths} → {B.totalMonths}개월)</div>
                <div>
                  예상 연금 월액: <strong>{D.monthly.toFixed(1)} → {B.monthly.toFixed(1)} 만원</strong>{" "}
                  <strong style={{ color: "var(--text-accent)" }}>(+{B.delta.toFixed(1)})</strong>
                </div>
                <div>
                  손익분기: <strong style={{ color: "var(--text-accent)" }}>
                    {B.recoverAgeExtra === null || B.recoverAgeExtra > params.expectedLifeExpectancy
                      ? "기대수명 내 회수 불가"
                      : `${B.recoverAgeExtra}세 (수령 ${Math.ceil(B.recoverAgeExtra - params.nationalPensionStartAge)}년차)`}
                  </strong>
                </div>
                <div>기대수명({params.expectedLifeExpectancy}세)까지 순이익: <strong>{fmt(B.delta * 12 * lifeYears - cost.total)} 만원</strong></div>
              </>
            )}
          </div>
        ) : (
          <div style={styles.labelHint}>반납 원금·수령년월·복원 개월수·복원 시작년월·신청년월을 입력하면 결과가 계산됩니다.</div>
        )}
        {cost && !hasNpsData && (
          <div style={styles.labelHint}>「NPS 공단고서 상세 입력」에 총 예상 가입월수와 예상 연금 월액을 넣으면 늘어나는 연금액이 계산됩니다.</div>
        )}
        <p style={styles.note}>
          ※ 복원 기간의 소득은 본인 평균소득(B값)과 같다고 가정한 현재가치 추정치입니다. 정확한 반납금과 연금 증가액은 국민연금공단(☎1355)에서 확인하세요.
        </p>
      </div>
    </div>
  );
}

// 대안별 비교: 반환일시금이 있으면 D 현행·B 반납·C 추납·A 반납+추납, 없으면 D·C만
export function RefundScenarioComparison({ who, title }: { who: Who; title: string }) {
  const store = usePensionStore();
  const person = pensionsOf(store, who);
  const rr = person.returnRepayment;
  const params = personParams(store.simulationParams, who);
  const hasRefund = person.additionalPayment.receivedLumpSumRefund;
  const ready = isRepaymentReady(rr);
  const scenarios = compareRefundScenarios(person.nationalPension, rr, person.additionalPayment, params).filter(
    (s) => hasRefund || s.id === "D" || s.id === "C"
  );
  const best = Math.max(...scenarios.map((s) => s.gainAtLifeExpectancy));
  // 총원금 회수 나이는 현행(D) 총 예상 납부보험료를 현행 연금으로 회수하는 나이로, 모든 대안이 같다
  const baseRecoverAge = scenarios[0].recoverAgeTotal;
  // 나이와 연금 개시부터 걸리는 기간을 함께 표시: 69.3세 (4.3년)
  const ageWithYears = (age: number | null) =>
    age === null ? "-" : `${age.toFixed(1)}세 (${(age - params.nationalPensionStartAge).toFixed(1)}년)`;
  // 나이별 누적 순이익 = 그 나이까지 누적 수령액 − 총 납부보험료 (표의 순이익과 같은 기준)
  const start = params.nationalPensionStartAge;
  const chartData: Record<string, number>[] = [];
  for (let age = start; age <= params.expectedLifeExpectancy; age++) {
    const row: Record<string, number> = { age };
    scenarios.forEach((s) => (row[s.id] = s.monthly * 12 * (age - start + 1) - s.lifetimePremium));
    chartData.push(row);
  }
  const showChart = scenarios[0].monthly > 0 && chartData.length > 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={styles.previewBox}>
        <h4 style={styles.previewTitle}>
          {title} ({hasRefund ? "D 현행 · B 반납 · C 추납 · A 반납+추납" : "D 현행 · C 추납"})
        </h4>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>대안</th>
                <th style={styles.th}>가입기간</th>
                <th style={styles.th}>추가 납부액</th>
                <th style={styles.th}>총 납부보험료</th>
                <th style={styles.th}>예상 월 연금</th>
                <th style={styles.th}>총원금 회수 나이</th>
                <th style={styles.th}>추가분 합산 회수 나이</th>
                <th style={styles.th}>기대수명({params.expectedLifeExpectancy}세)까지 순이익</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} style={s.gainAtLifeExpectancy === best ? styles.bestRow : undefined}>
                  <td style={styles.td}>{s.id} · {s.label}</td>
                  <td style={styles.td}>{s.totalMonths}개월 {s.addedMonths > 0 && `(+${s.addedMonths})`}</td>
                  <td style={styles.td}>{fmt(s.extraCost)} 만원</td>
                  <td style={styles.td}>{fmt(s.lifetimePremium)} 만원</td>
                  <td style={styles.td}>{s.monthly.toFixed(1)} 만원 {s.delta > 0 && `(+${s.delta.toFixed(1)})`}</td>
                  <td style={styles.td}>{ageWithYears(baseRecoverAge)}</td>
                  <td style={styles.td}>{ageWithYears(s.recoverAgeTotal)}</td>
                  <td style={styles.td}>
                    {fmt(s.gainAtLifeExpectancy)} 만원 {s.annualReturn !== null && `(${s.annualReturn.toFixed(1)}%)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          총 납부보험료 = 「NPS 공단고서 상세 입력」의 총 예상 납부보험료 + 추가 납부액. 추납 대안은 위 추납 조건 입력을 그대로 씁니다.
          ( ) 기간은 연금 개시({params.nationalPensionStartAge}세)부터 걸리는 기간입니다. 총원금 회수 나이 = 현행(D) 총 예상 납부보험료를 현행 연금으로 회수하는 나이(모든 대안 동일),
          추가분 합산 회수 나이 = 총 납부보험료(총원금 + 추가 납부액)를 해당 대안 연금으로 회수하는 나이.
          순이익 옆 %는 총 납부보험료를 연금 개시부터 기대수명까지 연복리로 굴려 총 수령액이 되는 연 이자율입니다.
          반납 복원 기간의 소득은 본인 평균소득(B값)과 같다고 가정한 현재가치 추정치이며, 정확한 금액은 국민연금공단(☎1355)에서 확인하세요.
        </p>
        {hasRefund && !ready && <p style={styles.note}>반납 원금·수령년월·복원 개월수·복원 시작년월·신청년월을 모두 입력하면 B·A 대안이 계산됩니다.</p>}

        {showChart && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={styles.previewTitle}>대안별 나이별 누적 순이익 (누적 수령액 − 총 납부보험료)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="age" tickFormatter={(v) => `${v}세`} stroke="var(--text-muted)" fontSize={12} />
                <YAxis tickFormatter={(v) => fmt(v)} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<ChartTooltip labelSuffix="세" />} />
                <Legend />
                <ReferenceLine y={0} stroke="var(--text-muted)" label={{ value: "원금 회수선", position: "insideBottomRight", fill: "var(--text-muted)", fontSize: 11 }} />
                {scenarios.map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    name={`${s.id} · ${s.label}`}
                    stroke={SCENARIO_COLORS[s.id]}
                    strokeWidth={s.gainAtLifeExpectancy === best ? 3 : 2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p style={styles.note}>
              선이 0(원금 회수선)을 넘는 나이가 총 납부보험료를 모두 돌려받는 시점이고, 선이 가파를수록 월 연금이 많으며,
              오른쪽 끝 높이가 기대수명({params.expectedLifeExpectancy}세)까지 순이익입니다. 굵은 선이 순이익 1위 대안입니다.
            </p>
          </div>
        )}
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
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  bestRow: { backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: 600 },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
};
