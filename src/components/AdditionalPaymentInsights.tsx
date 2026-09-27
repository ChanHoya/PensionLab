"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { AdditionalPaymentPlan } from "@/services/additionalPaymentCalculator";

const fmt = (v: number) => Math.round(v).toLocaleString();

interface Props {
  plan: AdditionalPaymentPlan;
  paymentMode: "LUMP" | "INSTALLMENT";
}

export default function AdditionalPaymentInsights({ plan, paymentMode }: Props) {
  // 분납 회차를 연도별로 묶어 요율·금액 표시
  const byYear = new Map<string, { rate: number; count: number; amount: number }>();
  plan.cost.rows.forEach((r) => {
    const y = r.dueYm.slice(0, 4);
    const prev = byYear.get(y) || { rate: r.rate, count: 0, amount: 0 };
    byYear.set(y, { rate: r.rate, count: prev.count + 1, amount: prev.amount + r.principal + r.interest });
  });

  // 순이익이 가장 큰 납부 방식 강조
  const bestGain = Math.max(...plan.paymentOptions.map((o) => o.lifetimeGain));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={styles.box}>
        <h4 style={styles.title}>④ 일시납 vs 분할납부 비교 ({plan.months}개월 추납)</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>납부 방식</th>
                <th style={styles.th}>총 납부액 (이자)</th>
                <th style={styles.th}>회차당 납부액</th>
                <th style={styles.th}>완납 월</th>
                <th style={styles.th}>순비용 (환급 후)</th>
                <th style={styles.th}>연금 증가(월)</th>
                <th style={styles.th}>손익분기</th>
                <th style={styles.th}>기대수명까지 순이익</th>
              </tr>
            </thead>
            <tbody>
              {plan.paymentOptions.map((o) => (
                <tr key={o.label} style={o.lifetimeGain === bestGain ? styles.bestRow : undefined}>
                  <td style={styles.td}>{o.label}</td>
                  <td style={styles.td}>{fmt(o.total)} 만원 ({fmt(o.interest)})</td>
                  <td style={styles.td}>
                    {o.installments === 1 ? "-" : `${o.monthlyMin.toFixed(1)}~${o.monthlyMax.toFixed(1)} 만원`}
                  </td>
                  <td style={styles.td}>{o.lastDueYm}</td>
                  <td style={styles.td}>{fmt(o.netCost)} 만원</td>
                  <td style={styles.td}>+{o.deltaMonthly.toFixed(1)} 만원</td>
                  <td style={styles.td}>{o.breakEvenAge === null ? "회수 불가" : `${o.breakEvenAge}세`}</td>
                  <td style={styles.td}>{fmt(o.lifetimeGain)} 만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          수령액(연금 증가)은 납부 방식과 관계없이 같고, 분납은 해가 바뀐 회차의 인상 요율과 분할납부이자(1년 만기 정기예금 이자율, 1년 단위 복리)만큼 더 냅니다.
          실제 이자율은 해마다 바뀌므로 정확한 금액은 공단이 발급하는 분할납부계획서로 확인하세요.
        </p>
      </div>

      <div style={styles.box}>
        <h4 style={styles.title}>기준소득월액별 비교 ({plan.months}개월 추납, 세전)</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>기준소득월액</th>
              <th style={styles.th}>추납액</th>
              <th style={styles.th}>연금 증가(월)</th>
              <th style={styles.th}>회수 기간</th>
            </tr>
          </thead>
          <tbody>
            {plan.comparisons.map((o) => (
              <tr key={o.label}>
                <td style={styles.td}>{o.label} · {fmt(o.baseIncome)}만원</td>
                <td style={styles.td}>{fmt(o.cost)} 만원</td>
                <td style={styles.td}>+{o.deltaMonthly.toFixed(1)} 만원</td>
                <td style={styles.td}>{o.yearsToBreakEven === null ? "회수 불가" : `${o.yearsToBreakEven}년`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={styles.note}>
          국민연금은 소득이 낮을수록 낸 돈 대비 많이 받도록 설계되어 있어, 금액을 높이기보다 <strong>적은 금액으로 가능한 한 긴 기간</strong>을 채우는 편이 회수가 빠릅니다.
        </p>
      </div>

      <div style={styles.box}>
        <h4 style={styles.title}>누적 추가 수령액 vs 순비용 (현재가치)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={plan.breakEven.cumulative} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="age" tickFormatter={(v) => `${v}세`} stroke="var(--text-muted)" fontSize={12} />
            <YAxis tickFormatter={(v) => `${fmt(v)}`} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip formatter={(v) => `${fmt(Number(v))} 만원`} labelFormatter={(l) => `${l}세`} />
            <Legend />
            <Line type="monotone" dataKey="received" name="누적 추가 수령액" stroke="var(--primary)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cost" name="순비용" stroke="#f59e0b" strokeDasharray="6 4" dot={false} />
            {plan.breakEven.breakEvenAge !== null && (
              <ReferenceLine
                x={plan.breakEven.breakEvenAge}
                stroke="var(--success-light)"
                label={{ value: "손익분기", fill: "var(--success-light)", fontSize: 12 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {paymentMode === "INSTALLMENT" && (
        <div style={styles.box}>
          <h4 style={styles.title}>분납 연도별 보험료율</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>연도</th>
                <th style={styles.th}>적용 요율</th>
                <th style={styles.th}>회차</th>
                <th style={styles.th}>납부액(이자 포함)</th>
              </tr>
            </thead>
            <tbody>
              {[...byYear.entries()].map(([year, v]) => (
                <tr key={year}>
                  <td style={styles.td}>{year}년</td>
                  <td style={styles.td}>{v.rate.toFixed(1)}%</td>
                  <td style={styles.td}>{v.count}회</td>
                  <td style={styles.td}>{fmt(v.amount)} 만원</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={styles.note}>
            2025.11.25 개정 국민연금법에 따라 추납 보험료율은 납부기한이 속하는 달 기준입니다. 해가 바뀐 회차부터 오른 요율이 적용된다고 가정했습니다(정확한 적용 방식은 공단 확인).
          </p>
        </div>
      )}

      <div style={styles.box}>
        <h4 style={styles.title}>추납 의사결정 가이드 (현행법 기준)</h4>
        <ol style={styles.guide}>
          <li><strong>목돈이 있다면</strong> 같은 해 안에 일시납으로 끝내세요. 보험료율은 매년 1월 0.5%p씩 올라 2033년 13%가 됩니다. 첫 납부기한은 신청 다음 달이므로 <strong>12월 신청은 다음 해 요율</strong>이 적용됩니다.</li>
          <li><strong>목돈이 없다면</strong> 분납(최대 60회)이 가능하지만, 해가 바뀐 회차부터 오른 요율과 분납이자(1년 정기예금 이자율)가 붙습니다. 횟수를 줄이거나 연내에 끝내는 편이 유리합니다.</li>
          <li><strong>종합소득세율이 높은 직장인·사업자</strong>는 여러 해에 나눠 내면 해마다 소득공제를 받아 환급이 커질 수 있습니다. 소득이 없는 임의가입자(전업주부 등)에게는 해당되지 않습니다.</li>
          <li><strong>가입기간이 10년 미만</strong>이면 추납으로 10년을 채우는 것이 가장 큰 효과입니다(노령연금 수급권 확보).</li>
          <li>반환일시금을 받은 적이 있다면 <strong>반납</strong>이 먼저입니다. 신청 후 <strong>연금 수급이 시작되면 납부할 수 없고</strong>, 납부기한을 넘기면 가산이자가 붙습니다.</li>
          <li>신청 시 <strong>혼인관계증명서</strong>(상세, 주민등록번호 표시)를 제출해야 합니다. 문의: 국민연금 고객센터 1355.</li>
        </ol>
        <a href="/NPS_Additional_Payment_Plan.pdf" target="_blank" rel="noopener noreferrer" style={styles.link}>
          📄 연금 정보창고: 국민연금 추가납부 플랜 자료 보기 ↗
        </a>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    backgroundColor: "var(--background)",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
  },
  title: { fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginBottom: "10px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "var(--text-secondary)" },
  th: { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600 },
  td: { padding: "6px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  bestRow: { backgroundColor: "rgba(16, 185, 129, 0.08)", fontWeight: 600 },
  note: { fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 },
  guide: { fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: "18px", margin: 0 },
  link: { display: "inline-block", marginTop: "10px", fontSize: "0.8rem", color: "var(--primary-light)", textDecoration: "underline" },
};
