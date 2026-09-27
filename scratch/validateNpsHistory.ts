import assert from "node:assert/strict";
import { parseNpsHistoryText, deriveFromNpsHistory } from "../src/services/npsHistoryParser";

// 가상의 가입내역조회 화면 출력 PDF 텍스트 (pdfjs 추출 형식을 본뜸, 실제 개인정보 아님)
const FOOTER =
  "26. 9. 27. 오전 10:00 전자민원 > 개인 > 조회 > 가입내역 · 예상연금 > 가입내역조회 - 국민을 튼튼하게 연금을 튼튼하게 https://www.nps.or.kr/elctcvlcpt/inquiry/getOHAC0001M0.do?menuId=MN24001035 2/4";
const HEADER =
  "정렬 역순 조회년월 연금보험료 상세내역 1988-01 ~ 2026-09 기간 기준소득월액 납부한 보험료 납부하지 않은 보험료 가입자의 종류 비고 월수 금액 월수 금액";

// A: 사업장 → 납부예외(경계 겹침) → 지역가입 중, 반환일시금 없음, 예상연금 있음
const sampleA = [
  "가입내역조회 홍길동 고객님의 예상연금액, 보험료 총 납부내역 및 기간별 상세내역입니다. 2026년 09월 27일 (10:00) 조회일",
  "총 가입기간 월수 308개월 금액 90,000,000원 총 가입기간은 연금보험료, 추납보험료, 반납금 … 합산기간입니다.",
  "총 납부내역 납부한 연금보험료 (반환일시금 지급내역 포함) 90,000,000원 (308개월) 납부하지 않은 연금보험료 475,000원 (1개월)",
  "반납금 납부액 0원 추납보험료 납부액 (개월) 0원 (0) 반환일시금 지급내역 반환일시금 총 지급기간 0개월 반환일시금 총 지급액 0원",
  FOOTER,
  HEADER,
  "2000-01 ~ 2000-12 1,000,000원 12개월 1,080,000원 0개월 0원 사업장 (주)가나다",
  "2001-01 ~ 2001-06 1,000,000원 0개월 0원 0개월 0원 사업장 납부예외",
  "2001-06 ~ 2001-12 1,000,000원 0개월 0원 0개월 0원 사업장 납부예외",
  FOOTER,
  "2002-01 ~ 2026-08 5,000,000원 296개월 88,800,000 원 0개월 0원 지역 지역",
  "2026-09 ~ 2026-09 5,000,000원 0개월 0원 1개월 475,000원 지역 지역",
  "예상연금월액(노령연금) 수급자는 ［ 월별지급내역 ］ 을 조회하시기 바랍니다. ※ 예상연금액(현재가치 기준) 2033년 01월부터 매월 1,500,000원 (연 18,000,000원) 수령예상",
  "총 예상가입기간(납부월수) 2000년 01월 ~ 2030년 12월(총360개월 ) 총 예상납부보험료 120,000,000원 (현재가치로 산정된 연금액 계산내역입니다.)",
  "연금계산내역(노령연금) 총 가입개월 360개월 총 납부보험료 120,000,000원 지급률 100% 기본연금액 18,000,000원 A값 3,193,511원 B값 4,500,000원 ? ?",
  FOOTER,
].join("\n");

const a = parseNpsHistoryText(sampleA);
assert.equal(a.inquiryYm, "2026-09");
assert.equal(a.rows.length, 5);
assert.equal(a.rows[3].paidAmount, 8880); // 줄바꿈으로 갈라진 "88,800,000 원"
assert.equal(a.rows[3].kind, "REGIONAL");
assert.equal(a.rows[1].note, "납부예외");
assert.equal(a.totalMonths, 308);
assert.equal(a.totalAmount, 9000);
assert.equal(a.refundMonths, 0);
assert.deepEqual(a.expected, { startYm: "2033-01", monthlyPension: 150, totalMonths: 360, totalPremium: 12000, aValue: 319.3511, bValue: 450 });

const da = deriveFromNpsHistory(a);
assert.deepEqual(da.additionalPayment, {
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  firstEnrollYm: "2000-01",
  resumeYm: "2002-01",
  baseIncome: 500,
  gapMonths: 12, // 2001-01~2001-12 (경계 2001-06 중복 제거)
  gapReason: "EXEMPT",
  requestedMonths: 12,
});
assert.deepEqual(da.returnRepayment, {});
assert.deepEqual(da.national, {
  contributionMonths: 308,
  totalPaidAmount: 9000,
  currentStandardMonthlyIncome: 500,
  expectedMonthlyPension: 150,
  expectedTotalContributionMonths: 360,
  totalExpectedPremium: 12000,
  aValue: 319.3511,
  bValue: 450,
});
assert.ok(!da.notes.some((n) => n.includes("체납"))); // 조회월 미납은 체납 아님

// B: 반환일시금(앞 24개월) → 긴 미가입 → 임의가입 중, 중간 체납 1개월, 추납 10개월 이미 납부, 예상연금 없음
const sampleB = [
  "가입내역조회 김영희 고객님의 … 2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 127개월 금액 12,000,000원",
  "납부한 연금보험료 (반환일시금 지급내역 포함) 12,800,000원 (151개월) 반납금 납부액 0원 추납보험료 납부액 (개월) 1,000,000원 (10)",
  "반환일시금 지급내역 반환일시금 총 지급기간 24개월 반환일시금 총 지급액 800,000원",
  HEADER,
  "1990-01 ~ 1991-12 400,000원 24개월 800,000원 0개월 0원 사업장 (주)라마바",
  "1992-01 ~ 1992-06 400,000원 6개월 200,000원 0개월 0원 사업장 (주)라마바",
  "2016-01 ~ 2020-04 1,000,000원 52개월 4,680,000원 0개월 0원 임의 임의",
  "2020-05 ~ 2020-05 1,000,000원 0개월 0원 1개월 90,000원 임의 임의",
  "2020-06 ~ 2026-08 1,000,000원 75개월 6,750,000원 0개월 0원 임의 임의",
  "2026-09 ~ 2026-09 1,000,000원 0개월 0원 1개월 95,000원 임의 임의",
].join("\n");

const b = parseNpsHistoryText(sampleB);
assert.equal(b.rows.length, 6);
assert.equal(b.refundMonths, 24);
assert.equal(b.refundAmount, 80);
assert.equal(b.additionalPaidMonths, 10);
assert.equal(b.expected, null);

const db = deriveFromNpsHistory(b);
assert.equal(db.additionalPayment.enrollStatus, "VOLUNTARY");
assert.equal(db.additionalPayment.firstEnrollYm, "1990-01");
assert.equal(db.additionalPayment.resumeYm, "2016-01");
assert.equal(db.additionalPayment.gapMonths, 191); // 1999-04~2015-12 = 201개월 − 이미 추납 10개월
assert.equal(db.additionalPayment.gapReason, "EXCLUDED");
assert.equal(db.additionalPayment.requestedMonths, 119);
assert.equal(db.additionalPayment.receivedLumpSumRefund, true);
assert.deepEqual(db.returnRepayment, { refundAmount: 80, restoredMonths: 24, periodStartYm: "1990-01", refundYm: "1992-01" });
assert.equal(db.national.expectedMonthlyPension, undefined);
assert.ok(db.notes.some((n) => n.includes("미납(체납) 1개월")));
assert.ok(db.notes.some((n) => n.includes("이미 추납한 10개월")));

// 가입이 끝난(상실) 경우: 가입 중이 아님 → NONE
const dc = deriveFromNpsHistory(
  parseNpsHistoryText(`2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 12개월 금액 1,000,000원 ${HEADER} 2010-01 ~ 2010-12 1,000,000원 12개월 1,000,000원 0개월 0원 지역 지역`)
);
assert.equal(dc.additionalPayment.enrollStatus, "NONE");
assert.equal(dc.additionalPayment.resumeYm, undefined);
assert.ok(dc.notes.some((n) => n.includes("현재 가입 중인 기록이 없습니다")));

// 가입내역조회가 아닌 PDF
const none = parseNpsHistoryText("금융감독원 통합연금포털 연금 조회 결과");
assert.equal(none.rows.length, 0);
assert.equal(none.totalMonths, null);

// F2: 비고(마지막 컬럼)가 빈 행 다음에 오는 행도 정상 분리되어야 한다 (row 끼워먹기 방지)
const sampleEmptyNote = [
  `2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 30개월 금액 1,000,000원 ${HEADER}`,
  "2000-01 ~ 2000-12 1,000,000원 12개월 1,080,000원 0개월 0원 사업장",
  "2001-01 ~ 2001-06 1,000,000원 6개월 540,000원 0개월 0원 지역 지역가입",
].join("\n");
const parsedEmptyNote = parseNpsHistoryText(sampleEmptyNote);
assert.equal(parsedEmptyNote.rows.length, 2);
assert.equal(parsedEmptyNote.rows[0].note, "");
assert.equal(parsedEmptyNote.rows[0].endYm, "2000-12");
assert.equal(parsedEmptyNote.rows[1].startYm, "2001-01");
assert.equal(parsedEmptyNote.rows[1].note, "지역가입");

// F4: 반환 개월수가 한 행의 중간에서 끝나는 경우 refundYm/기간은 실제 반환된 달까지만 잡아야 한다
const sampleMidRowRefund = [
  "2026년 09월 27일 (10:00) 조회일 총 가입기간 월수 30개월 금액 3,000,000원",
  "납부한 연금보험료 (반환일시금 지급내역 포함) 3,000,000원 (30개월) 반납금 납부액 0원 추납보험료 납부액 (개월) 0원 (0)",
  "반환일시금 지급내역 반환일시금 총 지급기간 24개월 반환일시금 총 지급액 2,400,000원",
  HEADER,
  "1990-01 ~ 1992-06 100,000원 30개월 3,000,000원 0개월 0원 사업장 (주)단일행",
].join("\n");
const midRowRefund = deriveFromNpsHistory(parseNpsHistoryText(sampleMidRowRefund));
assert.deepEqual(midRowRefund.returnRepayment, {
  refundAmount: 240,
  restoredMonths: 24,
  periodStartYm: "1990-01",
  refundYm: "1992-01",
});

console.log("NPS history validation success!");
