import type { DimensionKey, HouseholdReport, ReportInput } from "@/services/householdReport";
import type { PersonData } from "@/store/usePensionStore";
import { privateDrawStartAgeOf } from "@/services/withdrawalCalculator";

// AI 진단 리포트의 서술 부분: AI 응답 형식, AI가 실패했을 때 쓰는 계산 기반 기본 진단, AI에 보내는 계산 결과 요약

export type Level = "높음" | "중간" | "낮음";
export type Timing = "즉시" | "은퇴 전" | "은퇴 시점" | "연금 개시 후";
export const LEVELS: Level[] = ["높음", "중간", "낮음"];
export const TIMINGS: Timing[] = ["즉시", "은퇴 전", "은퇴 시점", "연금 개시 후"];

export type ToolId =
  | "SAVINGS_PLAN"
  | "DIVIDEND_STRATEGY"
  | "NPS_BEP"
  | "NPS_BOOST"
  | "INCOME_BRIDGE"
  | "SURVIVOR_CARE"
  | "ISA_TRANSFER"
  | "REVERSE_MORTGAGE";

export const TOOL_IDS: ToolId[] = [
  "SAVINGS_PLAN",
  "DIVIDEND_STRATEGY",
  "NPS_BEP",
  "NPS_BOOST",
  "INCOME_BRIDGE",
  "SURVIVOR_CARE",
  "ISA_TRANSFER",
  "REVERSE_MORTGAGE",
];

export interface ToolMeta {
  id: ToolId;
  name: string;
  badge: string;
  description: string;
}

export const TOOL_META_MAP: Record<ToolId, ToolMeta> = {
  SAVINGS_PLAN: {
    id: "SAVINGS_PLAN",
    name: "부족액 역산 적립 플랜",
    badge: "🎯 적립 플랜",
    description: "은퇴 후 목표 부족액을 메우기 위한 최적의 월 저축·투자 납입액을 역산합니다.",
  },
  DIVIDEND_STRATEGY: {
    id: "DIVIDEND_STRATEGY",
    name: "배당 투자 전략 추천",
    badge: "💡 배당 포트폴리오",
    description: "국내 상장 ETF 10선, IRP 30% 룰, 격주 배당 캘린더를 활용한 실전 배당 포트폴리오를 설계합니다.",
  },
  NPS_BEP: {
    id: "NPS_BEP",
    name: "조기 vs 정상 vs 연기 손익분기점",
    badge: "⚖️ 손익분기(BEP)",
    description: "A·B값 재평가 반영 실질 손익분기(72세/81세) 및 소득감액 회피 연기연금 치트키를 확인합니다.",
  },
  NPS_BOOST: {
    id: "NPS_BOOST",
    name: "국민연금 증액 로드맵",
    badge: "🪜 연금 증액",
    description: "반납 ➔ 추납 ➔ 임의계속 ➔ 연기 4단계별 월 연금 증액과 원금 회수 기간을 비교합니다.",
  },
  INCOME_BRIDGE: {
    id: "INCOME_BRIDGE",
    name: "소득 공백기 브릿지 플래너",
    badge: "🌉 소득 크레바스",
    description: "퇴직 후 국민연금 개시 전 공백기를 실업급여, IRP 분할인출, 임의계속가입으로 방어합니다.",
  },
  SURVIVOR_CARE: {
    id: "SURVIVOR_CARE",
    name: "홀로 남은 배우자 생애 케어",
    badge: "🕊️ 유족 케어",
    description: "1차 사망 후 배우자 1인 생활비(70%), 국민연금 중복급여 조정 및 주택연금 승계를 점검합니다.",
  },
  ISA_TRANSFER: {
    id: "ISA_TRANSFER",
    name: "ISA 연금 전환 절세 플래너",
    badge: "💎 ISA 전환",
    description: "3년 만기 ISA 전환금 10% 추가 세액공제(최대 300만원) 및 풍차돌리기 누적 절세를 산출합니다.",
  },
  REVERSE_MORTGAGE: {
    id: "REVERSE_MORTGAGE",
    name: "주택연금(역모기지) 결합",
    badge: "🏠 주택연금",
    description: "내 집을 담보로 평생 비과세 종신 월지급금을 수령하여 초고령기 생활비 결손을 방어합니다.",
  },
};

export interface ReportNarrative {
  headline: string; // 한 줄 결론
  summary: string; // 종합 소견
  dimensionComments: Record<DimensionKey, string>;
  strengths: string[];
  risks: { title: string; detail: string; impact: Level; likelihood: Level }[];
  actions: {
    title: string;
    detail: string;
    timing: Timing;
    priority: Level;
    effect: string;
    toolId?: ToolId;
  }[];
  withdrawalOrder: { period: string; source: string; reason: string }[];
  taxTips: string[];
  allocation: { safe: number; income: number; growth: number; rationale: string }; // 연금 적립금·금융자산 배분 (%)
}

const DIMENSION_KEYS: DimensionKey[] = ["sufficiency", "stability", "tax", "diversification", "longevity"];

export const won = (v: number) => (Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}억원` : `${Math.round(v).toLocaleString()}만원`);
const pct = (x: number) => Math.round(x * 100);

const deceasedLabel = (r: HouseholdReport) => (r.firstDeath?.who === "SPOUSE" ? "배우자" : "본인");
const publicStartAge = (r: HouseholdReport) => r.params.retirementAge + r.crevasse.years;

// ── AI에 보내는 계산 결과 요약 ─────────────────────────────────────────────

function productLines(label: string, d: PersonData): string[] {
  const n = d.nationalPension;
  const name = (x: { provider?: string; productName?: string }) => [x.provider, x.productName].filter(Boolean).join(" ");
  return [
    `- ${label} 국민연금: 예상 월 ${n.expectedMonthlyPension.toLocaleString()}만원 (가입 ${n.contributionMonths}개월, 예상 총 ${n.expectedTotalContributionMonths}개월)`,
    ...d.retirementPensions.map((p) =>
      p.pensionType === "DB"
        ? `- ${label} 퇴직연금 DB ${name(p)}: ${p.expectedLumpSum ? `예상 적립금 ${won(p.expectedLumpSum)}` : `평균임금 ${p.avgSalary ?? 0}만원 × 근속 ${p.yearsOfService ?? 0}년`}`
        : `- ${label} 퇴직연금 ${p.pensionType} ${name(p)}: 적립금 ${won(p.totalAccumulated ?? 0)}, 월 납입 ${p.monthlyContribution ?? 0}만원, 기대수익률 ${p.expectedReturnRate ?? 0}%`
    ),
    ...d.personalPensions.map(
      (p) =>
        `- ${label} 연금저축(${p.savingsType === "FUND" ? "펀드" : "보험"}) ${name(p)}: 적립금 ${won(p.totalAccumulated)}, 월 납입 ${p.monthlyAnnualContribution}만원, ${p.desiredStartAge}세부터 ${p.receivingPeriod}년 수령`
    ),
    ...d.pensionInsurances.map(
      (p) =>
        `- ${label} 연금보험 ${name(p) || p.insuranceType}: 적립금 ${won(p.totalAccumulated)}, 월 ${p.monthlyPayment}만원 × ${p.paymentPeriod}년, 공시이율 ${p.expectedDeclaredRate}%`
    ),
  ];
}

export function reportFacts(r: HouseholdReport, input: ReportInput): string {
  const p = r.params;
  const targetBench = r.avgTargetReal || r.targetToday;
  const gap = Math.round(Math.max(0, targetBench - r.avgRetiredReal));
  const lines: string[] = [];
  const add = (...xs: (string | false | null | undefined)[]) => xs.forEach((x) => typeof x === "string" && lines.push(x));

  add(
    `[진단 대상] ${r.hasSpouse ? `부부 가구 (본인 ${p.currentAge}세, 배우자 ${p.spouseAge ?? p.currentAge}세)` : `1인 가구 (본인 ${p.currentAge}세)`}, 기준 연도 ${r.baseYear}년`,
    `- 본인: 은퇴 ${p.retirementAge}세, 국민연금 개시 ${p.nationalPensionStartAge}세${p.nationalPensionDeferYears ? ` + ${p.nationalPensionDeferYears}년 연기` : ""}, 기대수명 ${p.expectedLifeExpectancy}세`,
    r.hasSpouse &&
      `- 배우자: 은퇴 ${p.spouseRetirementAge}세, 국민연금 개시 ${p.spouseNationalPensionStartAge}세${p.spouseNationalPensionDeferYears ? ` + ${p.spouseNationalPensionDeferYears}년 연기` : ""}, 기대수명 ${p.spouseLifeExpectancy}세`,
    `- 목표 생활비 월 ${r.targetToday}만원, 최소 생활비 월 ${r.minToday}만원 (현재가치), 물가상승률 연 ${p.inflationRate}%`,
    `- 노후 지출 곡선 패턴: ${
      r.spendingPattern === "ACTIVE_FOCUSED"
        ? `활동기 집중형 (은퇴 초기 ${r.activePhaseYears}년간 목표 생활비 ${r.targetToday}만원 100% 유지 후 연 ${r.annualDeclineRate}% 완만 체감)`
        : r.spendingPattern === "SMILING_3STAGE"
        ? `3단계 생애주기형 (활동기 100% → 안정기 75% → 간병기 55%)`
        : `고정 균등형 (생애 전 기간 동일 수준 유지)`
    }`,
    `- 사적연금은 ${privateDrawStartAgeOf(p)}세(본인 나이)부터 가구 소득 평탄화(지출 곡선 연계) 방식으로 인출`,
    `- 비연금 금융자산 ${won(p.nonPensionAssets || 0)}, 재산세 과세표준 ${won(p.propertyTaxBase || 0)}, 금융소득 연 ${p.financialIncome || 0}만원`,
    "",
    "[보유 연금]",
    ...productLines("본인", input.self),
    ...(r.hasSpouse ? productLines("배우자", input.spouse) : []),
    (r.nps.selfAdded || r.nps.selfRestored || r.nps.spouseAdded || r.nps.spouseRestored) > 0 &&
      `- 국민연금 추납·반납 반영: 본인 추납 ${r.nps.selfAdded}개월·반납 ${r.nps.selfRestored}개월${r.hasSpouse ? `, 배우자 추납 ${r.nps.spouseAdded}개월·반납 ${r.nps.spouseRestored}개월` : ""}`,
    "",
    "[진단 지표 — 계산 엔진 결과, 월 금액은 현재가치]",
    `- 종합 점수 ${r.total}점 (등급 ${r.grade.letter}, ${r.grade.label})`,
    ...r.dimensions.map((d) => `- ${d.label} ${d.score}점 (가중치 ${d.weight}%): ${d.metric}`),
    `- 은퇴 후 평균 가구 월 연금 ${r.avgRetiredReal}만원 / 지출곡선 평균 목표 ${r.avgTargetReal}만원, 목표 곡선 대비 누적 부족액 ${won(r.shortfallPV)}`,
    r.medicalMonthly > 0 && `- 노후 의료비 연 ${(p.annualMedicalExpense || 0).toLocaleString()}만원(월 ${r.medicalMonthly}만원)을 목표·최소 생활비 곡선에 포함`,
    r.childSupport.total > 0 &&
      `- 자녀 교육·결혼 지원 예정 총액 ${won(r.childSupport.total)}: 비연금 자산으로 충당하고 노후 자금에서 나갈 금액 ${won(r.childSupport.uncovered)}`,
    r.crevasse.years > 0
      ? `- 소득 공백기: 은퇴 후 국민연금 개시 전 ${r.crevasse.years}년, 이 기간 평균 월 ${r.crevasse.avgReal}만원`
      : "- 소득 공백기 없음 (은퇴 시점에 공적연금 수령 중)",
    r.belowMinSpans.length > 0 &&
      `- 최소 생활비 미달 구간: ${r.belowMinSpans.map((s) => `${s.fromYear}~${s.toYear}년(본인 ${s.fromAge}~${s.toAge}세)`).join(", ")}`,
    r.firstDeath &&
      `- ${deceasedLabel(r)} 기대수명 이후(${r.firstDeath.year}년~) 가구 월 연금 ${r.firstDeath.beforeReal}만원 → ${r.firstDeath.afterReal}만원`,
    `- 마지막 5년 평균 가구 월 연금 ${r.lateReal}만원`,
    `- 생애 수령액(명목): 공적연금 ${won(r.layers.public.self + r.layers.public.spouse)}, 퇴직연금 ${won(r.layers.retirement.self + r.layers.retirement.spouse)}, 개인연금 ${won(r.layers.private.self + r.layers.private.spouse)}`,
    ...r.moneyFlow.map((m) => `- ${m.label}: 낸 돈(원금) ${won(m.paid)} → 받는 돈 ${won(m.received)}`),
    "",
    "[인출전략 비교 — 가구 생애 합계, 명목]",
    ...r.scenarios.map(
      (s) =>
        `- ${s.id} ${s.name}: 세전 ${won(s.preTax)}, 세후 ${won(s.postTax)}, 세금·건보료 ${won(s.taxHI)} (부담률 ${(s.effectiveRate * 100).toFixed(1)}%)${s.lostDependencyAge ? `, ${s.lostDependencyAge}세 건보료 피부양자 탈락` : ""}`
    ),
    "- 생애 세후 수령액 최대: " + r.best.id + " " + r.best.name,
    "",
    "[S4 하이브리드(배당+연금) 배당 운용 정책 분석]",
    `- 배당 운용 정책: ${r.s4Analysis.policyLabel} (${r.s4Analysis.policy})`,
    `- 정책 설명: ${r.s4Analysis.policyDescription}`,
    `- 커버드콜/월배당 투자금: ${won(r.s4Analysis.coveredCallAssetInitial)} (연 분배율 ${r.s4Analysis.dividendRate}%)`,
    `- 부부 명의 분산: ${r.s4Analysis.isCoupleDivided ? "적용 (부부 50% 분산)" : "미적용 (본인 단독)"}`,
    `- 연간 배당금: 가구 총 ${won(r.s4Analysis.annualDividendGross)} / 1인당 ${won(r.s4Analysis.annualDividendPerPerson)} (${r.s4Analysis.healthInsuranceProtected ? "건보료 피부양자 안전 1,000만원 이하 방어" : "1,000만원 초과 피부양자 탈락 위험"})`,
    r.s4Analysis.policy === "REINVEST"
      ? `- 스노우볼 재투자 누적: ${won(r.s4Analysis.accumulatedReinvested)}, 최종 커버드콜 잔액: ${won(r.s4Analysis.finalCoveredCallAsset)}`
      : r.s4Analysis.policy === "BUFFER"
      ? `- 비상자금 안전버퍼 누적: ${won(r.s4Analysis.accumulatedBuffered)}, 최종 비상 풀 잔고: ${won(r.s4Analysis.finalEmergencyBuffer)} (연 2.5% MMF 복리 적립)`
      : `- 생활비 직접 충당 배당금 누적: ${won(r.s4Analysis.accumulatedSpent)}`,
    `- 핵심 처방: ${r.s4Analysis.policyEvaluation.strategicPrescription}`,
    "",
    "[활용 가능한 전문 분석 시뮬레이션 도구 (toolId)]",
    `- SAVINGS_PLAN (부족액 역산 적립 플랜): 은퇴 후 목표 대비 월 부족액(${gap > 0 ? `월 ${gap}만원` : "0원"})을 메우기 위해 필요한 월 저축·투자 납입액을 복리 시뮬레이션으로 역산합니다.`,
    `- DIVIDEND_STRATEGY (배당 투자 전략): 국내 상장 ETF 10선, IRP 30% 안전자산 룰, 격주 배당 캘린더를 활용한 맞춤 배당 포트폴리오를 제공합니다.`,
    `- NPS_BEP (조기 vs 정상 vs 연기 손익분기점): A·B값 재평가 반영 실질 BEP(72세/81세) 및 65~69세 소득감액 회피 연기연금 치트키를 분석합니다.`,
    `- NPS_BOOST (국민연금 증액 로드맵): 반납·추납·임의계속·연기 4단계별 월 연금 증액과 회수 기간을 비교합니다.`,
    r.crevasse.years > 0 ? `- INCOME_BRIDGE (소득 공백기 플래너): 국민연금 개시 전 ${r.crevasse.years}년 공백기를 실업급여, IRP 분할인출, 임의계속가입으로 방어합니다.` : "",
    r.hasSpouse ? `- SURVIVOR_CARE (홀로 남은 배우자 생애 케어): 부부 기대수명 차이에 따른 배우자 1인 생활비(70%), 국민연금 중복급여 조정 및 주택연금 종신 승계를 점검합니다.` : "",
    `- ISA_TRANSFER (ISA 연금 전환 플래너): 3년 만기 ISA 전환금 10% 추가 세액공제(최대 300만원) 및 풍차돌리기 절세를 산출합니다.`,
    `- REVERSE_MORTGAGE (주택연금 결합): 내 집을 담보로 평생 비과세 종신 월지급금을 수령하여 초고령기 생활비 결손을 방어합니다.`,
    "",
    "[가구 월 연금 흐름 — 5년 간격, 현재가치 만원/월]"
  );
  const rows = r.couple.rows;
  rows.forEach((row, t) => {
    if (t % 5 !== 0 && t !== rows.length - 1) return;
    const d = Math.pow(1 + r.inflation, t);
    const v = (x: number) => Math.round(x / d);
    const part = (who: string, y: typeof row.self | null) =>
      y && y.alive ? `${who}(${y.age}세) 국민 ${v(y.national)}·기초 ${v(y.basic)}·퇴직 ${v(y.retirement)}·개인 ${v(y.personal + y.insurance)}` : "";
    add(`- ${row.year}년: 가구 ${v(row.household)} = ${[part("본인", row.self), part("배우자", row.spouse)].filter(Boolean).join(" / ")}`);
  });
  return lines.join("\n");
}

// ── AI 응답 정리 ─────────────────────────────────────────────────────────

const str = (x: unknown) => (typeof x === "string" ? x.replace(/\*\*/g, "").trim() : "");
const strList = (x: unknown) => (Array.isArray(x) ? x.map(str).filter(Boolean) : []);
const level = (x: unknown): Level => (LEVELS.includes(x as Level) ? (x as Level) : "중간");
const timing = (x: unknown): Timing => (TIMINGS.includes(x as Timing) ? (x as Timing) : "즉시");
const toolId = (x: unknown): ToolId | undefined => (TOOL_IDS.includes(x as ToolId) ? (x as ToolId) : undefined);
const objects = (x: unknown) => (Array.isArray(x) ? (x.filter((i) => i && typeof i === "object") as Record<string, unknown>[]) : []);

// AI가 돌려준 JSON을 화면 형식으로 다듬는다. 핵심 항목이 비면 null (기본 진단으로 대체)
export function normalizeNarrative(raw: unknown): ReportNarrative | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const headline = str(o.headline);
  const summary = str(o.summary);
  if (!headline || !summary) return null;

  const dc = (o.dimensionComments ?? {}) as Record<string, unknown>;
  const a = (o.allocation ?? {}) as Record<string, unknown>;
  const nums = [a.safe, a.income, a.growth].map((n) => Math.max(0, Number(n) || 0));
  const sum = nums.reduce((s, n) => s + n, 0);
  const [safe, income] = sum > 0 ? nums.map((n) => Math.round((n / sum) * 100)) : [50, 30];

  return {
    headline,
    summary,
    dimensionComments: Object.fromEntries(DIMENSION_KEYS.map((k) => [k, str(dc[k])])) as Record<DimensionKey, string>,
    strengths: strList(o.strengths).slice(0, 5),
    risks: objects(o.risks)
      .map((x) => ({ title: str(x.title), detail: str(x.detail), impact: level(x.impact), likelihood: level(x.likelihood) }))
      .filter((x) => x.title)
      .slice(0, 8),
    actions: objects(o.actions)
      .map((x) => ({
        title: str(x.title),
        detail: str(x.detail),
        timing: timing(x.timing),
        priority: level(x.priority),
        effect: str(x.effect),
        toolId: toolId(x.toolId),
      }))
      .filter((x) => x.title)
      .slice(0, 10),
    withdrawalOrder: objects(o.withdrawalOrder)
      .map((x) => ({ period: str(x.period), source: str(x.source), reason: str(x.reason) }))
      .filter((x) => x.source)
      .slice(0, 6),
    taxTips: strList(o.taxTips).slice(0, 6),
    allocation: { safe, income, growth: 100 - safe - income, rationale: str(a.rationale) },
  };
}

// ── 계산 기반 기본 진단 (AI를 쓸 수 없을 때) ─────────────────────────────────

export function fallbackNarrative(r: HouseholdReport): ReportNarrative {
  const p = r.params;
  const who = r.hasSpouse ? "부부 가구" : "본인";
  const targetBench = r.avgTargetReal || r.targetToday;
  const ratio = r.avgRetiredReal / targetBench;
  const gap = Math.round(Math.max(0, targetBench - r.avgRetiredReal));
  const s0 = r.scenarios.find((s) => s.key === "s0") ?? r.best;
  const fd = r.firstDeath;
  const survivorRatio = fd && fd.beforeReal > 0 ? fd.afterReal / fd.beforeReal : null;
  const pub = r.layers.public.self + r.layers.public.spouse;
  const ret = r.layers.retirement.self + r.layers.retirement.spouse;
  const pri = r.layers.private.self + r.layers.private.spouse;
  const layerTotal = pub + ret + pri || 1;
  const topLayer = [
    { name: "공적연금", share: pub / layerTotal },
    { name: "퇴직연금", share: ret / layerTotal },
    { name: "개인연금", share: pri / layerTotal },
  ].reduce((a, b) => (b.share > a.share ? b : a));
  const diversification = r.dimensions.find((d) => d.key === "diversification");

  const headline =
    ratio >= 1
      ? `${who}의 연금만으로 노후 지출 곡선 목표를 충당할 수 있는 구조입니다`
      : r.avgRetiredReal >= r.minToday
        ? `최소 생활비는 충당되지만 지출 목표까지 월 ${gap}만원이 모자랍니다`
        : "연금만으로는 최소 생활비에도 못 미쳐 추가 준비가 시급합니다";

  const summary = [
    `${who}의 은퇴 후 평균 월 연금은 현재가치 ${r.avgRetiredReal.toLocaleString()}만원으로 지출 곡선 목표(평균 ${targetBench.toLocaleString()}만원)의 ${pct(ratio)}% 수준이며, 종합 진단 점수는 ${r.total}점(${r.grade.letter} · ${r.grade.label})입니다.`,
    r.crevasse.years > 0
      ? `은퇴 후 국민연금이 나오기 전 ${r.crevasse.years}년의 소득 공백기에는 월 ${r.crevasse.avgReal}만원을 받습니다.`
      : "은퇴 시점부터 공적연금이 이어져 소득 공백기는 없습니다.",
    fd && `${deceasedLabel(r)} 기대수명 이후 가구 월 연금은 ${fd.beforeReal}만원에서 ${fd.afterReal}만원으로 바뀝니다.`,
    `인출전략 비교에서는 ${r.best.id}(${r.best.name})의 생애 세후 수령액이 ${won(r.best.postTax)}로 가장 많습니다.`,
  ]
    .filter(Boolean)
    .join(" ");

  const dimensionComments: Record<DimensionKey, string> = {
    sufficiency:
      ratio >= 1
        ? `지출 곡선 목표 생활비의 ${pct(ratio)}%를 연금으로 충당해 기본 생활비 구조가 안정적입니다.`
        : `지출 곡선 목표 대비 평균 월 ${gap}만원이 모자라 은퇴 기간 누적 부족액이 현재가치 ${won(r.shortfallPV)}입니다.`,
    stability:
      r.belowMinSpans.length > 0
        ? `본인 나이 ${r.belowMinSpans.map((s) => `${s.fromAge}~${s.toAge}세`).join(", ")} 구간에 가구 연금이 최소 생활비(${r.minToday}만원)에 못 미칩니다.`
        : "은퇴 기간 내내 최소 생활비 이상의 연금 소득이 유지됩니다.",
    tax: `${r.best.id} 기준 생애 세금·건보료는 ${won(r.best.taxHI)}(부담률 ${(r.best.effectiveRate * 100).toFixed(1)}%)입니다.${r.best.lostDependencyAge ? ` ${r.best.lostDependencyAge}세에 건보료 피부양자 자격을 잃을 수 있습니다.` : ""}`,
    diversification:
      topLayer.share > 0.7
        ? `생애 수령액의 ${pct(topLayer.share)}%가 ${topLayer.name}에 몰려 있어 해당 제도·상품 변화에 민감합니다.`
        : `${diversification?.metric ?? ""}로 3층이 비교적 고르게 나뉘어 있습니다.`,
    longevity:
      survivorRatio !== null
        ? `${deceasedLabel(r)} 사망 후 가구 소득이 이전의 ${pct(survivorRatio)}%로 1인 가구 필요 소득(70%)${survivorRatio >= 0.7 ? "을 지킵니다" : "보다 낮아집니다"}. 마지막 5년 평균 월 연금은 ${r.lateReal}만원입니다.`
        : `마지막 5년 평균 월 연금은 ${r.lateReal}만원으로 최소 생활비의 ${pct(r.lateReal / r.minToday)}%입니다.`,
  };

  const strengths = r.dimensions.filter((d) => d.score >= 80).map((d) => `${d.label}: ${d.metric}`);
  if (r.s4Analysis.coveredCallAssetInitial > 0) {
    strengths.push(`S4 배당 정책(${r.s4Analysis.policyLabel}): ${r.s4Analysis.policyEvaluation.coreBenefit}`);
  }
  if (strengths.length === 0) {
    const top = r.dimensions.reduce((a, b) => (b.score > a.score ? b : a));
    strengths.push(`${top.label}: ${top.metric}`);
  }

  const risks: ReportNarrative["risks"] = [];
  if (r.s4Analysis.coveredCallAssetInitial > 0) {
    if (!r.s4Analysis.healthInsuranceProtected) {
      risks.push({
        title: "배당소득 건보료 위험",
        detail: `1인당 연 배당소득이 ${won(r.s4Analysis.annualDividendPerPerson)}으로 1,000만원을 초과해 건보료 피부양자 자격을 잃을 수 있습니다. 부부 명의 분산 또는 투자금 조절이 필요합니다.`,
        impact: "높음",
        likelihood: "높음",
      });
    }
    risks.push({
      title: "커버드콜 원금 변동성",
      detail: r.s4Analysis.policyEvaluation.keyRisk,
      impact: "중간",
      likelihood: "중간",
    });
  }
  if (ratio < 1)
    risks.push({
      title: "목표 생활비 부족",
      detail: `은퇴 후 평균 월 ${gap}만원, 누적 ${won(r.shortfallPV)}(현재가치)이 모자랍니다.`,
      impact: ratio < 0.7 ? "높음" : "중간",
      likelihood: "높음",
    });
  if (r.childSupport.total > 0)
    risks.push({
      title: "자녀 지원비 부담",
      detail:
        r.childSupport.uncovered > 0
          ? `자녀 교육·결혼 지원 예정 ${won(r.childSupport.total)} 중 비연금 자산으로 못 메우는 ${won(r.childSupport.uncovered)}이 노후 자금에서 나갑니다.`
          : `자녀 교육·결혼 지원 예정 ${won(r.childSupport.total)}은 비연금 자산으로 충당할 수 있지만 그만큼 비상자금이 줄어듭니다.`,
      impact: r.childSupport.uncovered > 0 ? "높음" : "중간",
      likelihood: "높음",
    });
  if (r.crevasse.years > 0 && r.crevasse.avgReal < r.minToday)
    risks.push({
      title: "소득 공백기(크레바스)",
      detail: `국민연금 개시 전 ${r.crevasse.years}년 동안 월 ${r.crevasse.avgReal}만원으로 최소 생활비에 못 미칩니다.`,
      impact: "높음",
      likelihood: "높음",
    });
  if (fd && survivorRatio !== null && survivorRatio < 0.7)
    risks.push({
      title: "사망 후 유족 소득 급감",
      detail: `${deceasedLabel(r)} 사망 후 가구 월 연금이 ${fd.beforeReal}만원에서 ${fd.afterReal}만원으로 줄어듭니다.`,
      impact: "높음",
      likelihood: "중간",
    });
  if (r.best.lostDependencyAge)
    risks.push({ title: "건보료 피부양자 탈락", detail: `${r.best.lostDependencyAge}세부터 지역가입자 건보료가 부과될 수 있습니다.`, impact: "중간", likelihood: "높음" });
  if (topLayer.share > 0.7)
    risks.push({ title: `${topLayer.name} 쏠림`, detail: `생애 수령액의 ${pct(topLayer.share)}%가 한 층에 몰려 있습니다.`, impact: "중간", likelihood: "중간" });
  if (r.lateReal < r.minToday)
    risks.push({
      title: "장수 리스크",
      detail: `말년(마지막 5년) 월 연금 ${r.lateReal}만원이 최소 생활비보다 적어 의료·간병비 대비가 부족합니다.`,
      impact: "높음",
      likelihood: "중간",
    });
  risks.push({
    title: "물가·수익률 변동",
    detail: `물가가 가정(연 ${p.inflationRate}%)보다 높거나 운용수익률이 낮으면 사적연금의 실질 가치가 줄어듭니다.`,
    impact: "중간",
    likelihood: "중간",
  });

  const actions: ReportNarrative["actions"] = [];
  if (ratio < 1)
    actions.push({
      title: "연금저축·IRP 추가 납입 (적립 플랜)",
      detail: `연금저축 연 600만원을 포함해 IRP 합산 연 900만원까지 세액공제를 받으며, 월 ${gap}만원 부족액을 채우는 최적 적립 플랜을 가동합니다.`,
      timing: "즉시",
      priority: "높음",
      effect: `목표 대비 부족액 월 ${gap}만원 축소`,
      toolId: "SAVINGS_PLAN",
    });
  if (r.childSupport.uncovered > 0)
    actions.push({
      title: "자녀 지원 한도 정하기",
      detail: "지원 총액과 시기를 미리 정하고, 연금계좌·퇴직금 같은 노후 자금은 지원 재원에서 분리합니다.",
      timing: "즉시",
      priority: "높음",
      effect: `노후 자금 ${won(r.childSupport.uncovered)} 보전`,
    });
  if (!r.nps.selfAdded && !r.nps.selfRestored)
    actions.push({
      title: "국민연금 증액 로드맵 점검 (추납·반납)",
      detail: "납부예외·반환일시금 기간이 있으면 추납·반납 및 임의계속가입을 통해 평생 종신 연금액을 높이고 원금 회수 기간을 확인합니다.",
      timing: "즉시",
      priority: "중간",
      effect: "물가연동 종신 연금 증액",
      toolId: "NPS_BOOST",
    });
  if (r.crevasse.years > 0)
    actions.push({
      title: "소득 공백기 브릿지 생활비 확보",
      detail: `국민연금 개시 전 ${r.crevasse.years}년은 실업급여(구직급여), 퇴직연금(IRP) 분할 인출, 임의계속가입으로 소득 절벽을 방어합니다.`,
      timing: "은퇴 시점",
      priority: "높음",
      effect: "공백기 소득 안정 및 건보료 절감",
      toolId: "INCOME_BRIDGE",
    });
  actions.push({
    title: "국민연금 수령 시점(BEP) 최적화",
    detail: "조기 vs 정상 vs 연기 손익분기점(A·B값 재평가 반영 72세/81세)을 비교하고, 65~69세 소득 발생 시 연기연금을 통한 감액 방어 전략을 수립합니다.",
    timing: "은퇴 시점",
    priority: "중간",
    effect: "평생 연금 누적액 극대화",
    toolId: "NPS_BEP",
  });
  actions.push(
    r.best.key === "s0"
      ? { title: "현재 인출 계획 유지", detail: "통합 시뮬레이션 기준(S0) 인출의 생애 세후 수령액이 가장 많습니다.", timing: "은퇴 시점", priority: "중간", effect: `생애 세후 ${won(r.best.postTax)}` }
      : {
          title: `${r.best.id} 인출전략 적용`,
          detail: `${r.best.name} 방식으로 인출하면 기준(S0)보다 생애 세후 수령액이 ${won(r.best.postTax - s0.postTax)} 늘어납니다.`,
          timing: "은퇴 시점",
          priority: "높음",
          effect: `생애 세후 +${won(r.best.postTax - s0.postTax)}`,
        }
  );
  if (survivorRatio !== null && survivorRatio < 0.7)
    actions.push({
      title: "홀로 남은 배우자 생애 케어",
      detail: "배우자 1차 사망 후 국민연금 중복급여 조정(본인연금+유족30% vs 유족100%)과 주택연금 100% 종신 승계를 점검해 유족 소득을 지킵니다.",
      timing: "은퇴 전",
      priority: "높음",
      effect: "사망 후 가구 소득 하락 완화",
      toolId: "SURVIVOR_CARE",
    });
  if (r.best.lostDependencyAge)
    actions.push({
      title: "건보료 피부양자 유지",
      detail: "연 소득(공적연금 포함) 2,000만원 이하 기준을 넘지 않도록 사적연금 인출액과 금융소득을 조절합니다.",
      timing: "연금 개시 후",
      priority: "중간",
      effect: "건보료 부담 감소",
    });
  if (r.s4Analysis.coveredCallAssetInitial > 0) {
    if (r.s4Analysis.policy === "BUFFER") {
      actions.push({
        title: "배당 비상 안전버퍼 계좌 분리 관리",
        detail: `잉여 배당금으로 적립 중인 안전버퍼(최종 예상 ${won(r.s4Analysis.finalEmergencyBuffer)})를 파킹형/단기채로 엄격히 분리 운용하여 초고령기 긴급 의료비 전용으로 유지합니다.`,
        timing: "은퇴 시점",
        priority: "높음",
        effect: "초고령기 간병·의료비 안심 자금 확보",
        toolId: "DIVIDEND_STRATEGY",
      });
    } else if (r.s4Analysis.policy === "REINVEST") {
      actions.push({
        title: "배당 스노우볼 재투자 성과 점검",
        detail: `60대 전반에는 잉여 배당금을 커버드콜에 재투자해 자산을 증식(최종 예상 ${won(r.s4Analysis.finalCoveredCallAsset)})하고, 70대 진입 시 안전버퍼형 전환을 검토합니다.`,
        timing: "연금 개시 후",
        priority: "중간",
        effect: "자산 복리 성장 및 원금 리스크 통제",
        toolId: "DIVIDEND_STRATEGY",
      });
    } else {
      actions.push({
        title: "배당 투자 전략 및 건보료 모니터링",
        detail: `매월 배당금으로 생활비를 보당하되, 1인당 연 1,000만원 한도를 넘지 않도록 부부 명의 분산 및 추천 실전 ETF 10선을 활용합니다.`,
        timing: "즉시",
        priority: "중간",
        effect: "공백기 소득 보당 및 피부양자 방어",
        toolId: "DIVIDEND_STRATEGY",
      });
    }
  } else {
    actions.push({
      title: "실전 연금 배당 투자 포트폴리오 설계",
      detail: "월배당 인컴형 및 배당성장형 국내 상장 ETF 10선, IRP 30% 룰, 격주 배당 캘린더를 활용해 추가 현금흐름을 마련합니다.",
      timing: "즉시",
      priority: "중간",
      effect: "월배당 파이프라인 구축",
      toolId: "DIVIDEND_STRATEGY",
    });
  }

  actions.push({
    title: "ISA 만기 자금 연금 전환 세액공제",
    detail: "3년 만기 ISA 자금을 연금저축·IRP로 전환하여 전환금의 10%(최대 300만원)를 추가 세액공제받아 절세 혜택을 극대화합니다.",
    timing: "즉시",
    priority: "중간",
    effect: "연간 최대 1,200만원 한도 환급",
    toolId: "ISA_TRANSFER",
  });

  if (!p.useReverseMortgage) {
    actions.push({
      title: "주택연금(역모기지) 결합 검토",
      detail: "만 55세 이상부터 가입 가능한 주택연금을 결합하여 집값 변동 걱정 없는 평생 비과세 종신 월지급금을 확보합니다.",
      timing: "은퇴 시점",
      priority: ratio < 1 ? "높음" : "낮음",
      effect: "초고령기 종신 현금흐름 보강",
      toolId: "REVERSE_MORTGAGE",
    });
  }

  actions.push({
    title: "매년 연금 정보 갱신",
    detail: "금감원 통합연금포털에서 연 1회 적립금·예상 연금을 내려받아 이 진단을 다시 받아 봅니다.",
    timing: "연금 개시 후",
    priority: "낮음",
    effect: "계획과 실제의 차이 조기 발견",
  });

  const withdrawalOrder: ReportNarrative["withdrawalOrder"] = [];
  if (r.crevasse.years > 0)
    withdrawalOrder.push({
      period: `${p.retirementAge}~${publicStartAge(r) - 1}세 (공백기)`,
      source: "퇴직연금(IRP) 연금 수령 + 비상 현금",
      reason: "퇴직금을 연금으로 받으면 퇴직소득세가 30% 줄고, 국민연금 개시 전 소득을 메웁니다.",
    });
  withdrawalOrder.push(
    {
      period: `${publicStartAge(r)}~79세`,
      source: "국민연금 + 연금저축·IRP(세액공제분)",
      reason: "사적연금 수령액을 연 1,500만원 이하로 나누면 3.3~5.5% 저율 분리과세로 끝납니다.",
    },
    { period: "80세 이후", source: "국민연금·종신형 연금 중심", reason: "연금소득세율이 3.3%로 낮아지고, 남은 적립금은 의료·간병 예비비로 둡니다." }
  );

  const taxTips = [
    "사적연금(세액공제분·운용수익) 수령액이 연 1,500만원 이하면 나이에 따라 3.3~5.5% 분리과세로 끝납니다.",
    "3년 만기된 ISA 자금을 연금저축/IRP로 전환하면 전환금의 10%(최대 300만원)를 추가 세액공제받아 연간 최대 1,200만원까지 환급받을 수 있습니다.",
    "주직장 퇴직 후 국민연금 개시 전 소득 공백기(크레바스)에는 구직급여(최대 9개월, 월 198만원)와 임의계속가입(36개월)을 연계하여 현금흐름 충격을 방어하세요.",
    "퇴직금은 IRP로 받아 연금으로 나눠 받으면 퇴직소득세가 30%(11년차부터 40%) 줄어듭니다.",
    "퇴직 후 지역가입자로 전환 시 임의계속가입(최대 36개월)을 신청하면 종전 직장보험료 수준으로 납부하여 건강보험료 부담을 크게 낮출 수 있습니다.",
  ];
  if (r.hasSpouse) {
    taxTips.push("부부가 각자 명의로 연금을 받으면 사람마다 분리과세 한도와 세율 구간을 따로 써서 세금을 줄일 수 있습니다.");
    taxTips.push("배우자 1인 먼저 사망 시 국민연금법 제56조 중복급여 조정(본인연금+유족30% vs 유족100%) 및 주택연금 100% 승계 제도를 통해 홀로 남은 생애를 보호할 수 있습니다.");
  }
  if (p.useReverseMortgage) {
    taxTips.push(`주택연금(역모기지)이 결합되어 평생 비과세 종신 현금흐름으로 초고령기 생활비 결손을 든든하게 방어하고 있습니다.`);
  } else {
    taxTips.push("은퇴 후 현금흐름 부족 시 만 55세 이상부터 가입 가능한 주택연금(역모기지)을 결합하면 집값 하락 걱정 없이 종신 연금을 확보할 수 있습니다.");
  }
  if (r.s4Analysis.coveredCallAssetInitial > 0) {
    taxTips.push(
      "커버드콜 월배당금은 1인당 연 1,000만원 이하로 통제하면 건보료 피부양자 자격(금융소득 1,000만원 허들)을 안전하게 방어할 수 있습니다."
    );
    if (r.s4Analysis.isCoupleDivided) {
      taxTips.push(
        `부부 명의로 커버드콜 자산을 분산하여 1인당 배당소득을 1,000만원 이하(${won(r.s4Analysis.annualDividendPerPerson)})로 낮추는 절세 전략이 적용되어 있습니다.`
      );
    }
  }

  const safe = Math.max(30, Math.min(70, Math.round(p.currentAge / 10) * 10));
  const income = Math.round(((100 - safe) * 0.6) / 5) * 5;
  return {
    headline,
    summary,
    dimensionComments,
    strengths,
    risks,
    actions,
    withdrawalOrder,
    taxTips,
    allocation: {
      safe,
      income,
      growth: 100 - safe - income,
      rationale: `나이(${p.currentAge}세)를 고려해 원금 보전 자산을 ${safe}%로 두고, 물가 방어를 위해 배당·인컴 ${income}%, 성장 ${100 - safe - income}%를 섞는 기본 배분입니다. 공백기 생활비 2~3년치는 안전자산에 먼저 확보합니다.`,
    },
  };
}
