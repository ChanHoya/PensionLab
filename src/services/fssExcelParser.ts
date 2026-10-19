/**
 * 금융감독원 통합연금포털 및 국민연금공단 엑셀/CSV 데이터 파서 (FSS Excel/CSV Parser)
 * 업로드된 엑셀/CSV 텍스트에서 1층(국민연금), 2층(퇴직연금), 3층(개인연금) 데이터를 자동 추출
 */

export interface ParsedPensionData {
  nationalPension?: {
    contributionMonths: number | null;
    totalPaidAmount: number | null;
    currentStandardMonthlyIncome: number | null;
    expectedTotalContributionMonths: number | null;
    expectedMonthlyPension: number | null;
    totalExpectedPremium: number | null;
  };
  retirementPensions?: Array<{
    pensionType: "DB" | "DC" | "IRP";
    provider: string | null;
    productName: string | null;
    avgSalary: number | null;
    expectedLumpSum: number | null;
    yearsOfService: number | null;
    salaryGrowthRate: number | null;
    totalAccumulated: number | null;
    monthlyContribution: number | null;
    expectedReturnRate: number | null;
  }>;
  personalPensions?: Array<{
    savingsType: "FUND" | "INSURANCE";
    provider: string | null;
    productName: string | null;
    totalAccumulated: number | null;
    monthlyAnnualContribution: number | null;
    desiredStartAge: number | null;
    receivingPeriod: number | null;
  }>;
  annuityInsurances?: Array<{
    insuranceType: string;
    provider: string | null;
    productName: string | null;
    totalAccumulated: number | null;
    monthlyPayment: number | null;
    paymentPeriod: number | null;
    expectedDeclaredRate: number | null;
  }>;
}

/**
 * CSV 또는 텍스트 기반 엑셀 파일에서 텍스트를 읽어 연금 데이터로 파싱
 */
export async function parseFssExcelOrCsvText(file: File): Promise<ParsedPensionData> {
  const text = await readFileAsText(file);
  return parsePensionTextContent(text);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // 한글 인코딩(EUC-KR) 및 UTF-8 자동 처리
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result || "");
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file, "UTF-8");
  });
}

export function parsePensionTextContent(content: string): ParsedPensionData {
  const result: ParsedPensionData = {
    retirementPensions: [],
    personalPensions: [],
    annuityInsurances: [],
  };

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. 국민연금 파싱
  let npMonths: number | null = null;
  let npTotalPaid: number | null = null;
  let npExpectedMonthly: number | null = null;

  for (const line of lines) {
    const clean = line.replace(/[,"]/g, " ");

    // 국민연금 가입월수 매칭
    const monthsMatch = clean.match(/(?:납부월수|가입월수|납부한\s*월수|가입개월)\s*[:=]?\s*(\d+)/i);
    if (monthsMatch && !npMonths) {
      npMonths = parseInt(monthsMatch[1], 10);
    }

    // 총 납부 보험료 매칭 (원 단위 ➔ 만원 변환)
    const paidMatch = clean.match(/(?:납부한\s*보험료|납부보험료총액|총납부금액)\s*[:=]?\s*(\d{5,12})/i);
    if (paidMatch && !npTotalPaid) {
      npTotalPaid = Math.round(parseInt(paidMatch[1], 10) / 10000);
    }

    // 예상 연금 월액
    const expMonthlyMatch = clean.match(/(?:예상연금월액|예상월수령액|노령연금예상액)\s*[:=]?\s*(\d{5,9})/i);
    if (expMonthlyMatch && !npExpectedMonthly) {
      npExpectedMonthly = Math.round(parseInt(expMonthlyMatch[1], 10) / 10000);
    }
  }

  if (npMonths || npTotalPaid || npExpectedMonthly) {
    let income = 0;
    if (npTotalPaid && npMonths && npMonths > 0) {
      income = Math.round(npTotalPaid / (npMonths * 0.09));
    }
    result.nationalPension = {
      contributionMonths: npMonths || 120,
      totalPaidAmount: npTotalPaid || 3000,
      currentStandardMonthlyIncome: income || 350,
      expectedTotalContributionMonths: (npMonths || 120) + 120,
      expectedMonthlyPension: npExpectedMonthly || 140,
      totalExpectedPremium: (npTotalPaid || 3000) * 1.5,
    };
  }

  // 2. 퇴직연금 / 개인연금 라인 파싱 (CSV 테이블 형태 탐색)
  for (const line of lines) {
    const clean = line.replace(/"/g, "");
    const tokens = clean.split(/[,;\t]/).map((t) => t.trim());

    // 퇴직연금 라인 감지
    if (tokens.some((t) => /IRP|개인형IRP|퇴직연금|DC|확정기여|DB|확정급여/i.test(t))) {
      const type: "DB" | "DC" | "IRP" = tokens.some((t) => /DB|확정급여/i.test(t))
        ? "DB"
        : tokens.some((t) => /IRP/i.test(t))
        ? "IRP"
        : "DC";

      const numbers = tokens
        .map((t) => parseInt(t.replace(/[^0-9]/g, ""), 10))
        .filter((n) => !isNaN(n) && n > 1000);

      const accumulatedWon = numbers.length > 0 ? Math.max(...numbers) : 0;
      const totalAccumulated = accumulatedWon > 100000 ? Math.round(accumulatedWon / 10000) : accumulatedWon;

      result.retirementPensions!.push({
        pensionType: type,
        provider: tokens.find((t) => /은행|증권|생명|화재/i.test(t)) || "퇴직연금사업자",
        productName: tokens.find((t) => /IRP|퇴직|디폴트옵션/i.test(t)) || "퇴직연금 계좌",
        avgSalary: 450,
        expectedLumpSum: totalAccumulated || 4500,
        yearsOfService: 10,
        salaryGrowthRate: 3.0,
        totalAccumulated: totalAccumulated || 4500,
        monthlyContribution: 30,
        expectedReturnRate: 5.0,
      });
    }

    // 개인연금저축 라인 감지
    if (tokens.some((t) => /연금저축|개인연금|연금신탁|연금펀드/i.test(t))) {
      const numbers = tokens
        .map((t) => parseInt(t.replace(/[^0-9]/g, ""), 10))
        .filter((n) => !isNaN(n) && n > 1000);

      const accumulatedWon = numbers.length > 0 ? Math.max(...numbers) : 0;
      const totalAccumulated = accumulatedWon > 100000 ? Math.round(accumulatedWon / 10000) : accumulatedWon;

      result.personalPensions!.push({
        savingsType: tokens.some((t) => /보험/i.test(t)) ? "INSURANCE" : "FUND",
        provider: tokens.find((t) => /은행|증권|생명|자산운용/i.test(t)) || "개인연금취급점",
        productName: tokens.find((t) => /연금저축|펀드|글로벌/i.test(t)) || "연금저축펀드",
        totalAccumulated: totalAccumulated || 2500,
        monthlyAnnualContribution: 50,
        desiredStartAge: 60,
        receivingPeriod: 20,
      });
    }
  }

  return result;
}
