import { monthsBetween } from "@/services/additionalPaymentCalculator";
import type {
  AdditionalPaymentState,
  EnrollStatus,
  NationalPensionState,
  ReturnRepaymentState,
} from "@/store/usePensionStore";

// 국민연금공단 「전자민원 > 조회 > 가입내역조회」 화면을 인쇄 → PDF로 저장한 파일의 텍스트를 읽는다.
// (증명서 발급 PDF는 암호화되어 텍스트를 읽을 수 없다)

export type NpsHistoryKind = "WORKPLACE" | "REGIONAL" | "VOLUNTARY" | "VOLUNTARY_CONT" | "OTHER";

export interface NpsHistoryRow {
  startYm: string; // "YYYY-MM"
  endYm: string;
  standardIncome: number; // 기준소득월액 (만원)
  paidMonths: number; // 납부한 보험료 월수
  paidAmount: number; // 납부한 보험료 (만원)
  unpaidMonths: number; // 납부하지 않은 보험료 월수
  kind: NpsHistoryKind; // 가입자의 종류
  note: string; // 비고 (사업장명, "납부예외" 등)
}

export interface NpsHistoryParsed {
  inquiryYm: string | null; // 조회일 년월
  rows: NpsHistoryRow[];
  totalMonths: number | null; // 총 가입기간 월수
  totalAmount: number | null; // 총 가입기간 금액 (만원)
  refundMonths: number; // 반환일시금 총 지급기간
  refundAmount: number; // 반환일시금 총 지급액 (만원)
  repaidAmount: number; // 반납금 납부액 (만원)
  additionalPaidMonths: number; // 이미 낸 추납 월수
  expected: {
    startYm: string; // 예상연금 수령 개시 년월
    monthlyPension: number; // 예상연금월액 (만원, 현재가치)
    totalMonths: number; // 총 예상가입기간
    totalPremium: number; // 총 예상납부보험료 (만원)
    aValue: number;
    bValue: number;
  } | null;
}

const won = (s: string) => Number(s.replace(/,/g, "")) / 10000; // 원 → 만원
const KIND: Record<string, NpsHistoryKind> = { 사업장: "WORKPLACE", 지역: "REGIONAL", 임의: "VOLUNTARY", 임의계속: "VOLUNTARY_CONT" };

export function parseNpsHistoryText(raw: string): NpsHistoryParsed {
  const text = raw
    .replace(/\s+/g, " ")
    // 페이지 머리·꼬리 (예: "26. 9. 27. 오후 7:55 전자민원 > … 3/5")
    .replace(/\d{2}\. ?\d{1,2}\. ?\d{1,2}\. 오[전후] \d{1,2}:\d{2} 전자민원 .*?\d+\/\d+/g, " ")
    // 줄바꿈으로 갈라진 금액 (예: "34,020,000 원")
    .replace(/(\d) 원/g, "$1원")
    .replace(/\s+/g, " ");

  const inquiry = text.match(/(\d{4})년 (\d{2})월 \d{2}일/);
  const total = text.match(/총 가입기간 월수 ([\d,]+)개월 금액 ([\d,]+)원/);
  const refund = text.match(/반환일시금 총 지급기간 (\d+)개월 반환일시금 총 지급액 ([\d,]+)원/);
  const repaid = text.match(/반납금 납부액 ([\d,]+)원/);
  const added = text.match(/추납보험료 납부액 \(개월\) [\d,]+원 \((\d+)\)/);
  const start = text.match(/(\d{4})년 (\d{2})월부터 매월 ([\d,]+)원/);
  const expTotal = text.match(/총 예상가입기간\(납부월수\) .*?\(총 ?(\d+)개월/);
  const expPremium = text.match(/총 예상납부보험료 ([\d,]+)원/);
  const ab = text.match(/A값 ([\d,]+)원 B값 ([\d,]+)원/);

  const rows: NpsHistoryRow[] = [];
  const rowRe =
    /(\d{4}-\d{2}) ~ (\d{4}-\d{2}) ([\d,]+)원 (\d+)개월 ([\d,]+)원 (\d+)개월 [\d,]+원 (\S+) (.*?)(?= \d{4}-\d{2} ~ \d{4}-\d{2} [\d,]+원| 예상연금월액|$)/g;
  for (const m of text.matchAll(rowRe)) {
    rows.push({
      startYm: m[1],
      endYm: m[2],
      standardIncome: won(m[3]),
      paidMonths: Number(m[4]),
      paidAmount: won(m[5]),
      unpaidMonths: Number(m[6]),
      kind: KIND[m[7]] ?? "OTHER",
      note: m[8].trim(),
    });
  }

  return {
    inquiryYm: inquiry ? `${inquiry[1]}-${inquiry[2]}` : null,
    rows,
    totalMonths: total ? Number(total[1].replace(/,/g, "")) : null,
    totalAmount: total ? won(total[2]) : null,
    refundMonths: refund ? Number(refund[1]) : 0,
    refundAmount: refund ? won(refund[2]) : 0,
    repaidAmount: repaid ? won(repaid[1]) : 0,
    additionalPaidMonths: added ? Number(added[1]) : 0,
    expected:
      start && expTotal && expPremium && ab
        ? {
            startYm: `${start[1]}-${start[2]}`,
            monthlyPension: won(start[3]),
            totalMonths: Number(expTotal[1]),
            totalPremium: won(expPremium[1]),
            aValue: won(ab[1]),
            bValue: won(ab[2]),
          }
        : null,
  };
}

export interface NpsHistoryDerived {
  additionalPayment: Partial<AdditionalPaymentState>;
  returnRepayment: Partial<ReturnRepaymentState>;
  national: Partial<NationalPensionState>;
  notes: string[];
}

// 무소득배우자 등 적용제외 기간은 1999-04 이후만 추납 대상
const EXCLUDED_ALLOWED_FROM = "1999-04";

function addMonth(ym: string, n = 1): string {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

// 기간 행들이 덮는 년월 집합 (행 경계가 겹쳐도 한 번만 센다)
function monthSet(rows: NpsHistoryRow[]): Set<string> {
  const set = new Set<string>();
  rows.forEach((r) => {
    for (let ym = r.startYm; ym <= r.endYm; ym = addMonth(ym)) set.add(ym);
  });
  return set;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const round4 = (v: number) => Math.round(v * 10000) / 10000;

// 가입내역에서 추납·반납·국민연금 입력값을 만든다
export function deriveFromNpsHistory(p: NpsHistoryParsed): NpsHistoryDerived {
  const notes: string[] = [];
  const rows = [...p.rows].sort((a, b) => (a.startYm < b.startYm ? -1 : 1));
  const isExempt = (r: NpsHistoryRow) => r.paidMonths === 0 && r.note.includes("납부예외");
  const paying = rows.filter((r) => !isExempt(r));

  // 현재 가입 상태: 마지막 행이 조회월(또는 전월)까지 이어지면 가입 중
  const last = rows[rows.length - 1];
  const ongoing = !!last && !!p.inquiryYm && last.endYm >= addMonth(p.inquiryYm, -1);
  const enrollStatus: EnrollStatus = ongoing && !isExempt(last) ? (last.kind === "OTHER" ? "REGIONAL" : last.kind) : "NONE";

  // 지속 가입개시: 마지막 행에서 거꾸로, 끊김 없이 이어진 납부 구간의 시작
  let resumeYm: string | undefined;
  if (ongoing && paying.length > 0) {
    let i = rows.length - 1;
    while (i > 0 && !isExempt(rows[i - 1]) && addMonth(rows[i - 1].endYm) >= rows[i].startYm) i--;
    resumeYm = rows[i].startYm;
  }

  // 추납 공백: 납부예외 행 + 행 사이 빈 기간(적용제외로 보고 1999-04 이후만)
  const exemptMonths = monthSet(rows.filter(isExempt)).size;
  let excludedMonths = 0;
  if (rows.length > 0) {
    const covered = monthSet(rows);
    for (let ym = rows[0].startYm; ym <= last.endYm; ym = addMonth(ym)) {
      if (!covered.has(ym) && ym >= EXCLUDED_ALLOWED_FROM) excludedMonths++;
    }
  }
  const gapMonths = Math.max(0, exemptMonths + excludedMonths - p.additionalPaidMonths);

  const additionalPayment: Partial<AdditionalPaymentState> = {
    enrollStatus,
    receivedLumpSumRefund: p.refundMonths > 0 && p.repaidAmount === 0,
  };
  if (rows.length > 0) additionalPayment.firstEnrollYm = rows[0].startYm;
  if (resumeYm) additionalPayment.resumeYm = resumeYm;
  if (last) additionalPayment.baseIncome = last.standardIncome;
  if (gapMonths > 0) {
    additionalPayment.gapMonths = gapMonths;
    additionalPayment.gapReason = exemptMonths >= excludedMonths ? "EXEMPT" : "EXCLUDED";
    additionalPayment.requestedMonths = Math.min(gapMonths, 119);
    notes.push(`추납 가능 공백 ${gapMonths}개월 (납부예외 ${exemptMonths}개월, 가입 기록 없는 기간 ${excludedMonths}개월 — 1999년 4월 이후만)`);
    if (excludedMonths > 0) notes.push("가입 기록이 없는 기간은 무소득배우자 등 적용제외로 가정했습니다. 실제 사유를 확인하세요.");
    if (p.additionalPaidMonths > 0) notes.push(`이미 추납한 ${p.additionalPaidMonths}개월을 뺐습니다.`);
  } else {
    notes.push("추납할 수 있는 공백 기간이 없습니다.");
  }
  if (!ongoing) notes.push("현재 가입 중인 기록이 없습니다. 추납은 가입 중(소득신고·임의가입)에만 신청할 수 있습니다.");
  const overdue = rows.filter((r) => r.unpaidMonths > 0 && r.endYm !== p.inquiryYm).reduce((s, r) => s + r.unpaidMonths, 0);
  if (overdue > 0) notes.push(`미납(체납) ${overdue}개월은 추납 대상이 아니며 연체 납부로 처리해야 합니다.`);

  // 반환일시금: 금액·개월수만 표시되므로 가장 이른 납부 기간부터 그 개월수만큼을 반환 기간으로 본다
  const returnRepayment: Partial<ReturnRepaymentState> = {};
  if (p.refundMonths > 0 && p.repaidAmount === 0) {
    let acc = 0;
    let endYm = "";
    for (const r of paying) {
      acc += r.paidMonths;
      endYm = r.endYm;
      if (acc >= p.refundMonths) break;
    }
    returnRepayment.refundAmount = round1(p.refundAmount);
    returnRepayment.restoredMonths = p.refundMonths;
    if (paying.length > 0) {
      returnRepayment.periodStartYm = paying[0].startYm;
      returnRepayment.refundYm = addMonth(endYm);
    }
    notes.push(
      `반환일시금 ${round1(p.refundAmount).toLocaleString()}만원 (${p.refundMonths}개월, ${paying[0]?.startYm ?? "?"} ~ ${endYm || "?"} 추정) — 반납하면 이 기간이 복원됩니다.`
    );
    notes.push("반환일시금 수령년월은 PDF에 없어 반환 기간 다음 달로 넣었습니다. 실제 수령년월(또는 공단 반납 고지액)을 확인하세요.");
  } else if (p.refundMonths > 0) {
    notes.push("반납금 납부 기록이 있어 반환일시금은 이미 반납한 것으로 보고 반납 입력을 채우지 않았습니다.");
  }

  const national: Partial<NationalPensionState> = {};
  if (p.totalMonths !== null) national.contributionMonths = p.totalMonths;
  if (p.totalAmount !== null) national.totalPaidAmount = round1(p.totalAmount);
  if (last) national.currentStandardMonthlyIncome = last.standardIncome;
  if (p.expected) {
    national.expectedMonthlyPension = round1(p.expected.monthlyPension);
    national.expectedTotalContributionMonths = p.expected.totalMonths;
    national.totalExpectedPremium = round1(p.expected.totalPremium);
    national.aValue = round4(p.expected.aValue);
    national.bValue = round4(p.expected.bValue);
    notes.push(`예상연금 ${p.expected.startYm}부터 월 ${round1(p.expected.monthlyPension)}만원 (총 ${p.expected.totalMonths}개월)을 국민연금 상세 입력에 반영했습니다.`);
  }
  return { additionalPayment, returnRepayment, national, notes };
}

export { monthsBetween };
