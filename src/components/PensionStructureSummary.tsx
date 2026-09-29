"use client";

import React from "react";
import type { BasicPensionState, PersonData } from "@/store/usePensionStore";

interface Props {
  self: PersonData;
  spouse: PersonData | null; // 배우자 없음이면 null
  basic: BasicPensionState;
}

interface Card {
  title: string;
  sub?: string; // 금융회사·상품명
  lines: string[];
}

const fmt = (v?: number) => Math.round(v || 0).toLocaleString();
const nameOf = (provider?: string, productName?: string) => [provider, productName].filter(Boolean).join(" · ") || undefined;
const SAVINGS_LABEL = { FUND: "연금저축펀드", INSURANCE: "연금저축보험" } as const;

function nationalCards(p: PersonData): Card[] {
  const n = p.nationalPension;
  if (!n.expectedMonthlyPension && !n.contributionMonths) return [];
  return [
    {
      title: "국민연금",
      lines: [
        `예상 월 ${fmt(n.expectedMonthlyPension)}만원`,
        `가입 ${fmt(n.contributionMonths)}개월 → 예상 ${fmt(n.expectedTotalContributionMonths)}개월`,
        `납부 ${fmt(n.totalPaidAmount)}만원`,
      ],
    },
  ];
}

function retirementCards(p: PersonData): Card[] {
  return p.retirementPensions.map((r) => ({
    title: `퇴직연금 ${r.pensionType}형`,
    sub: nameOf(r.provider, r.productName),
    lines:
      r.pensionType === "DB"
        ? [`근속 ${fmt(r.yearsOfService)}년`, `평균급여 ${fmt(r.avgSalary)}만원`]
        : [`적립금 ${fmt(r.totalAccumulated)}만원`, `월 납입 ${fmt(r.monthlyContribution)}만원 · 수익률 ${r.expectedReturnRate ?? 0}%`],
  }));
}

function personalCards(p: PersonData): Card[] {
  return [
    ...p.personalPensions.map((s) => ({
      title: SAVINGS_LABEL[s.savingsType] ?? "연금저축",
      sub: nameOf(s.provider, s.productName),
      lines: [
        `적립금 ${fmt(s.totalAccumulated)}만원 · 납입 ${fmt(s.monthlyAnnualContribution)}만원`,
        `${s.desiredStartAge}세부터 ${s.receivingPeriod}년 수령`,
      ],
    })),
    ...p.pensionInsurances.map((i) => ({
      title: "연금보험",
      sub: nameOf(i.provider, i.productName) ?? i.insuranceType,
      lines: [
        `적립금 ${fmt(i.totalAccumulated)}만원 · 월 ${fmt(i.monthlyPayment)}만원`,
        `납입 ${i.paymentPeriod}년 · 공시이율 ${i.expectedDeclaredRate}%`,
      ],
    })),
  ];
}

// 입력 내용을 3층 연금 구조로 그린다: 위에서부터 3층(개인)·2층(퇴직)·1층(공적), 아래층일수록 넓게
export default function PensionStructureSummary({ self, spouse, basic }: Props) {
  const people = spouse ? [{ label: "본인", data: self }, { label: "배우자", data: spouse }] : [{ label: "본인", data: self }];
  const layers = [
    { badge: "3층", title: "개인연금", color: "#0ea5e9", width: "84%", cards: personalCards },
    { badge: "2층", title: "퇴직연금", color: "#10b981", width: "92%", cards: retirementCards },
    { badge: "1층", title: "국민연금", color: "#6366f1", width: "100%", cards: nationalCards },
  ];

  return (
    <div style={styles.wrap} className="animate-fade-in">
      <div style={styles.infoAlert}>
        🏛 1~3단계에서 입력한 계약을 3층 연금 구조로 정리했습니다. 고칠 내용이 있으면 왼쪽 메뉴에서 해당 단계로 돌아가 수정한 뒤,
        아래 「종합 분석하기」를 누르세요.
      </div>

      {layers.map((layer) => (
        <div key={layer.badge} style={{ ...styles.layer, width: layer.width, borderColor: layer.color }}>
          <div style={{ ...styles.layerHead, color: layer.color }}>
            <span style={{ ...styles.badge, backgroundColor: layer.color }}>{layer.badge}</span>
            {layer.title}
          </div>
          <div style={{ ...styles.people, gridTemplateColumns: `repeat(${people.length}, minmax(0, 1fr))` }}>
            {people.map((person) => {
              const cards = layer.cards(person.data);
              return (
                <div key={person.label} style={styles.personCol}>
                  <div style={styles.personLabel}>{person.label}</div>
                  {cards.length === 0 ? (
                    <div style={styles.empty}>등록된 계약 없음</div>
                  ) : (
                    cards.map((c, i) => (
                      <div key={i} style={{ ...styles.card, borderLeftColor: layer.color }}>
                        <div style={styles.cardTitle}>{c.title}</div>
                        {c.sub && <div style={styles.cardSub}>{c.sub}</div>}
                        {c.lines.map((l) => (
                          <div key={l} style={styles.cardLine}>
                            {l}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
          {layer.badge === "1층" && (
            <div style={{ ...styles.card, borderLeftColor: "#f59e0b", marginTop: 8 }}>
              <div style={styles.cardTitle}>기초연금 (가구)</div>
              <div style={styles.cardLine}>
                {basic.applyToSimulation
                  ? `시뮬레이션 반영 · 65세 이후 해마다 소득인정액으로 판정`
                  : "시뮬레이션 미반영 (1층 「기초연금」 탭에서 반영 여부 선택)"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  infoAlert: {
    alignSelf: "stretch",
    backgroundColor: "rgba(99, 102, 241, 0.07)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderLeft: "3px solid rgba(99, 102, 241, 0.6)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.88rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  layer: {
    border: "1px solid",
    borderRadius: "var(--radius-md, 12px)",
    padding: "12px 14px",
    backgroundColor: "var(--background)",
    boxSizing: "border-box",
    minWidth: 0,
  },
  layerHead: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "0.95rem", marginBottom: "10px" },
  badge: { color: "#ffffff", borderRadius: "999px", padding: "2px 10px", fontSize: "0.75rem" },
  people: { display: "grid", gap: "12px" },
  personCol: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 },
  personLabel: { fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" },
  empty: { fontSize: "0.8rem", color: "var(--text-muted)", padding: "8px 0" },
  card: {
    border: "1px solid var(--border)",
    borderLeft: "3px solid",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    backgroundColor: "var(--surface)",
  },
  cardTitle: { fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" },
  cardSub: { fontSize: "0.75rem", color: "var(--text-accent)", marginTop: 2 },
  cardLine: { fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 },
};
