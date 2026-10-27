// 3층 연금 구조 요약과 국민연금 추납·반납 시뮬레이션 반영 여부를 토글하는 컴포넌트
"use client";

import React from "react";
import {
  usePensionStore,
  pensionsOf,
  type BasicPensionState,
  type PersonData,
  type SimulationParamsState,
  type Who,
  type PensionStore,
} from "@/store/usePensionStore";
import { personParams } from "@/services/coupleSimulation";
import { paidTotalsOf } from "@/services/paidTotals";
import {
  applyNpsOptions,
  calcRepaymentCost,
  isRepaymentReady,
} from "@/services/returnRepaymentCalculator";
import { runAdditionalPaymentPlan } from "@/services/additionalPaymentCalculator";

interface Props {
  self: PersonData;
  spouse: PersonData | null; // 배우자 없음이면 null
  basic: BasicPensionState;
  params: SimulationParamsState; // 층별 규모(납부·적립 총액) 계산용
}

// 층 폭: 규모 순서만 보이게 1·2·3위를 100% · 88% · 76%로 (실제 비율은 차이가 너무 커 맞추지 않는다)
const RANK_WIDTHS = ["100%", "88%", "76%"];

interface Card {
  title: string;
  sub?: string; // 금융회사·상품명
  lines: string[];
}

interface NpsOptionItem {
  id: "RETURN" | "ADDITIONAL";
  title: string;
  shortLabel: string;
  months: number;
  cost: number;
  isApplied: boolean;
  onToggle: () => void;
}

const fmt = (v?: number) => Math.round(v || 0).toLocaleString();
const nameOf = (provider?: string, productName?: string) => [provider, productName].filter(Boolean).join(" · ") || undefined;
const SAVINGS_LABEL = { FUND: "연금저축펀드", INSURANCE: "연금저축보험" } as const;

function nationalCards(p: PersonData, applied?: { restoredMonths: number; addedMonths: number }): Card[] {
  const n = p.nationalPension;
  if (!n.expectedMonthlyPension && !n.contributionMonths) return [];
  const extra = [applied?.addedMonths ? `추납 ${applied.addedMonths}개월` : "", applied?.restoredMonths ? `반납 ${applied.restoredMonths}개월` : ""].filter(Boolean);
  return [
    {
      title: "국민연금",
      sub: extra.length ? `${extra.join(" · ")} 반영` : undefined,
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
        ? (r.expectedLumpSum || 0) > 0
          ? [`퇴직 시 예상 적립금 ${fmt(r.expectedLumpSum)}만원`]
          : [`근속 ${fmt(r.yearsOfService)}년`, `평균급여 ${fmt(r.avgSalary)}만원`]
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

// 국민연금 추납 및 반납 옵션 항목 추출 함수
function getNpsOptions(
  who: Who,
  rawPerson: PersonData,
  prm: SimulationParamsState,
  store: PensionStore
): NpsOptionItem[] {
  const options: NpsOptionItem[] = [];
  const rr = rawPerson.returnRepayment;
  const ap = rawPerson.additionalPayment;
  const nat = rawPerson.nationalPension;

  // 1. 반납 정보 확인 (원금, 복원개월, 공단고지액 중 하나라도 있으면 표시)
  const hasReturnData = (rr.restoredMonths || 0) > 0 || (rr.refundAmount || 0) > 0 || (rr.noticeAmount || 0) > 0;
  if (hasReturnData) {
    const returnMonths =
      rr.restoredMonths ||
      (rr.refundAmount > 0 ? Math.min(144, Math.max(6, Math.round((rr.refundAmount * 10000) / 125000))) : 0);
    const returnCost =
      rr.noticeAmount > 0
        ? rr.noticeAmount
        : isRepaymentReady(rr)
        ? Math.round(calcRepaymentCost(rr).total)
        : rr.refundAmount > 0
        ? Math.round(rr.refundAmount * 2.5)
        : 342;
    const isReturnApplied = Boolean(rr.applyToSimulation && ap.receivedLumpSumRefund);

    options.push({
      id: "RETURN",
      title: "반환일시금 반납",
      shortLabel: "반납",
      months: returnMonths,
      cost: returnCost,
      isApplied: isReturnApplied,
      onToggle: () => {
        const next = !isReturnApplied;
        store.setReturnRepayment({ applyToSimulation: next }, who);
        if (next) {
          store.setAdditionalPayment({ receivedLumpSumRefund: true }, who);
        }
      },
    });
  }

  // 2. 추납 정보 확인 (중단개월 또는 희망개월이 있고 소득 또는 신청월 정보가 있을 때)
  const hasAddData =
    ((ap.gapMonths || 0) > 0 || (ap.requestedMonths || 0) > 0) &&
    ((ap.baseIncome || 0) > 0 || (nat.currentStandardMonthlyIncome || 0) > 0 || Boolean(ap.applyYm));
  if (hasAddData) {
    const addMonths = ap.requestedMonths || ap.gapMonths || 0;
    const plan = ap.applyYm ? runAdditionalPaymentPlan(ap, nat, prm) : null;
    const addCost =
      plan && plan.cost.total > 0
        ? Math.round(plan.cost.total)
        : Math.round(addMonths * (ap.baseIncome || nat.currentStandardMonthlyIncome || 300) * 0.09);
    const isAddApplied = Boolean(ap.applyToSimulation);

    options.push({
      id: "ADDITIONAL",
      title: "국민연금 추납",
      shortLabel: "추납",
      months: addMonths,
      cost: addCost,
      isApplied: isAddApplied,
      onToggle: () => {
        const next = !isAddApplied;
        const patch: Partial<typeof ap> = { applyToSimulation: next };
        if (next && !ap.applyYm) {
          patch.applyYm = new Date().toISOString().slice(0, 7);
        }
        store.setAdditionalPayment(patch, who);
      },
    });
  }

  return options;
}

// 입력 내용을 3층 연금 구조로 그린다: 위에서부터 3층(개인)·2층(퇴직)·1층(공적).
// 층 폭은 가구 납부·적립 총액(국민연금 예상 납부보험료, 퇴직·개인연금 적립금 + 은퇴까지 납입액)의 크기 순서로 정한다
export default function PensionStructureSummary({
  self: selfProp,
  spouse: spouseProp,
  basic: basicProp,
  params: paramsProp,
}: Props) {
  const store = usePensionStore();

  // 스토어의 최신 상태를 실시간 반영 (props와 fallback 동기화)
  const currentParams = store.simulationParams || paramsProp;
  const currentBasic = store.basicPension || basicProp;
  const selfRaw = pensionsOf(store, "SELF") || selfProp;
  const spouseRaw = (currentParams.hasSpouse ? pensionsOf(store, "SPOUSE") : null) ?? spouseProp;

  // 추가납부·일시금 반납을 「시뮬레이션 반영」으로 고른 경우 국민연금에 더한다 (대시보드 시뮬레이션과 같은 기준)
  const spouseParams = personParams(currentParams, "SPOUSE");
  const selfApplied = applyNpsOptions(selfRaw.nationalPension, selfRaw.additionalPayment, selfRaw.returnRepayment, currentParams);
  const spouseApplied = spouseRaw ? applyNpsOptions(spouseRaw.nationalPension, spouseRaw.additionalPayment, spouseRaw.returnRepayment, spouseParams) : null;
  const self: PersonData = { ...selfRaw, nationalPension: selfApplied.national };
  const spouse: PersonData | null = spouseRaw && spouseApplied ? { ...spouseRaw, nationalPension: spouseApplied.national } : null;
  const appliedOf = (d: PersonData) => (d === self ? selfApplied : spouseApplied ?? undefined);
  const people = (spouse && spouseRaw)
    ? [
        { label: "본인", data: self, raw: selfRaw, who: "SELF" as Who, params: currentParams },
        { label: "배우자", data: spouse, raw: spouseRaw, who: "SPOUSE" as Who, params: spouseParams },
      ]
    : [{ label: "본인", data: self, raw: selfRaw, who: "SELF" as Who, params: currentParams }];
  const paidOf = (p: PersonData, prm: SimulationParamsState) =>
    paidTotalsOf({ national: p.nationalPension, retirementPensions: p.retirementPensions, personalPensions: p.personalPensions, pensionInsurances: p.pensionInsurances }, prm);
  const paid = [paidOf(self, currentParams), ...(spouse ? [paidOf(spouse, spouseParams)] : [])];
  const sizes = {
    personal: paid.reduce((a, t) => a + t.personal + t.insurance, 0),
    retirement: paid.reduce((a, t) => a + t.retirement, 0),
    national: paid.reduce((a, t) => a + t.national, 0),
  };
  // 크기 순위(같으면 같은 폭). 0원인 층은 가장 좁게
  const widthOf = (v: number) => RANK_WIDTHS[Object.values(sizes).filter((x) => x > v).length];
  const layers = [
    { badge: "3층", title: "개인연금", color: "#0ea5e9", size: sizes.personal, cards: personalCards },
    { badge: "2층", title: "퇴직연금", color: "#10b981", size: sizes.retirement, cards: retirementCards },
    { badge: "1층", title: "국민연금", color: "#6366f1", size: sizes.national, cards: (d: PersonData) => nationalCards(d, appliedOf(d)) },
  ];

  return (
    <div style={styles.wrap} className="animate-fade-in">
      <div style={styles.infoAlert}>
        🏛 1~3단계에서 입력한 계약을 3층 연금 구조로 정리했습니다. 고칠 내용이 있으면 왼쪽 메뉴에서 해당 단계로 돌아가 수정한 뒤,
        아래 「종합 분석하기」를 누르세요.
      </div>

      {layers.map((layer) => (
        <div key={layer.badge} style={{ ...styles.layer, width: widthOf(layer.size), borderColor: layer.color }}>
          <div style={{ ...styles.layerHead, color: layer.color }}>
            <span style={{ ...styles.badge, backgroundColor: layer.color }}>{layer.badge}</span>
            {layer.title}
            <span style={styles.layerSize}>{spouse ? "가구 " : ""}납부·적립 총액 {fmt(layer.size)}만원</span>
          </div>
          <div style={{ ...styles.people, gridTemplateColumns: `repeat(${people.length}, minmax(0, 1fr))` }}>
            {people.map((person) => {
              const cards = layer.cards(person.data);
              const npsOptions = layer.badge === "1층" ? getNpsOptions(person.who, person.raw, person.params, store) : [];

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

                        {/* 1층 국민연금인 경우: 추납·반납 옵션 블록 (대시보드 및 기본정보 실시간 연동) */}
                        {layer.badge === "1층" && npsOptions.length > 0 && (
                          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {npsOptions.map((opt) => (
                              <div
                                key={opt.id}
                                role="button"
                                tabIndex={0}
                                onClick={opt.onToggle}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    opt.onToggle();
                                  }
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "8px",
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  backgroundColor: opt.isApplied
                                    ? "rgba(16, 185, 129, 0.08)"
                                    : "rgba(148, 163, 184, 0.05)",
                                  border: opt.isApplied
                                    ? "1px solid rgba(16, 185, 129, 0.35)"
                                    : "1px dashed rgba(148, 163, 184, 0.35)",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "11px",
                                      fontWeight: "bold",
                                      backgroundColor: opt.isApplied ? "#10b981" : "transparent",
                                      border: opt.isApplied ? "none" : "1.5px solid var(--text-muted)",
                                      color: "#ffffff",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {opt.isApplied ? "✓" : ""}
                                  </div>
                                  <div style={{ minWidth: 0, textAlign: "left" }}>
                                    <div
                                      style={{
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        color: opt.isApplied ? "var(--text-primary)" : "var(--text-secondary)",
                                      }}
                                    >
                                      {opt.isApplied
                                        ? `${opt.shortLabel} ${opt.months}개월 반영`
                                        : `${opt.shortLabel} 대상 ${opt.months}개월`}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.72rem",
                                        color: opt.isApplied ? "#10b981" : "var(--text-muted)",
                                        marginTop: "1px",
                                      }}
                                    >
                                      {opt.isApplied
                                        ? `총 ${fmt(opt.cost)}만원 납부 반영 중`
                                        : `대상금액: ${fmt(opt.cost)}만원 · 시뮬레이션 미반영`}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    opt.onToggle();
                                  }}
                                  className={opt.isApplied ? "premium-button-secondary" : "premium-button-primary"}
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    minHeight: "26px",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                    ...(opt.isApplied
                                      ? { borderColor: "rgba(16, 185, 129, 0.5)", color: "#10b981", backgroundColor: "transparent" }
                                      : {}),
                                  }}
                                >
                                  {opt.isApplied ? "반영해제" : "선택하기"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
                {currentBasic.applyToSimulation
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
  layerSize: { marginLeft: "auto", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" },
  people: { display: "grid", gap: "12px" },
  personCol: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 },
  personLabel: { fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" },
  empty: { fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, padding: "8px 0" },
  card: {
    border: "1px solid var(--border)",
    borderLeft: "3px solid",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    backgroundColor: "var(--surface)",
  },
  cardTitle: { fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" },
  cardSub: { fontSize: "0.76rem", color: "var(--text-accent)", marginTop: 2, fontWeight: 600 },
  cardLine: { fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2, fontWeight: 500 },
};

