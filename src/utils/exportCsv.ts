import type { CoupleYear } from "@/services/coupleSimulation";
import type { SimulationYearFlow } from "@/services/withdrawalCalculator";

/**
 * UTF-8 BOM(\uFEFF)을 포함한 CSV 다운로드 유틸리티
 * 엑셀(Excel)에서 한글이 깨지지 않고 바로 열립니다.
 */
export function downloadCsv(
  headers: string[],
  rows: (string | number | undefined | null)[][],
  filename: string
): void {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCell).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 부부 연금 시뮬레이션 연도별 테이블 CSV 내보내기
 */
export function exportCoupleSimulationCsv(
  rows: CoupleYear[],
  options: {
    isRealValue: boolean;
    inflationRate: number;
    hasSpouse: boolean;
    remarksMap?: (r: CoupleYear) => string;
  }
): void {
  const { isRealValue, inflationRate, hasSpouse, remarksMap } = options;
  const dateStr = new Date().toISOString().slice(0, 10);
  const valType = isRealValue ? "현재가치(실질)" : "명목금액";

  const headers = [
    "연도",
    "본인 나이",
    ...(hasSpouse ? ["배우자 나이"] : []),
    "가구 월 연금 합계(만원/월)",
    "가구 연 환산액(만원/년)",
    `화폐가치 기준(${valType})`,
    "본인 국민연금(월)",
    "본인 기초연금(월)",
    "본인 퇴직연금(월)",
    "본인 개인연금(월)",
    "주택연금(월)",
    "본인 총합(월)",
    ...(hasSpouse
      ? [
          "배우자 국민연금(월)",
          "배우자 기초연금(월)",
          "배우자 퇴직연금(월)",
          "배우자 개인연금(월)",
          "배우자 총합(월)",
        ]
      : []),
    "주요 이벤트(비고)",
  ];

  const dataRows = rows.map((r, idx) => {
    const div = isRealValue ? Math.pow(1 + inflationRate / 100, idx) : 1;
    const householdMonthly = Math.round(r.household / div);
    const householdAnnual = Math.round((r.household / div) * 12);
    const remark = remarksMap ? remarksMap(r) : "";

    return [
      r.year,
      `${r.self.age}세`,
      ...(hasSpouse ? [r.spouse ? `${r.spouse.age}세` : "-"] : []),
      householdMonthly,
      householdAnnual,
      valType,
      Math.round(r.self.national / div),
      Math.round(r.self.basic / div),
      Math.round(r.self.retirement / div),
      Math.round((r.self.personal + r.self.insurance) / div),
      Math.round(((r.self.housing || 0) + (r.spouse?.housing || 0)) / div),
      Math.round(r.self.total / div),
      ...(hasSpouse
        ? [
            r.spouse ? Math.round(r.spouse.national / div) : 0,
            r.spouse ? Math.round(r.spouse.basic / div) : 0,
            r.spouse ? Math.round(r.spouse.retirement / div) : 0,
            r.spouse ? Math.round((r.spouse.personal + r.spouse.insurance) / div) : 0,
            r.spouse ? Math.round(r.spouse.total / div) : 0,
          ]
        : []),
      remark,
    ];
  });

  downloadCsv(headers, dataRows, `부부통합_연금시뮬레이션_${dateStr}`);
}

/**
 * 인출전략 연도별 상세 현금흐름 및 세후 시뮬레이션 표 CSV 내보내기
 */
export function exportWithdrawalFlowsCsv(
  flows: SimulationYearFlow[],
  options: {
    strategyId: string;
    strategyName: string;
    hasSpouse: boolean;
    isRealValue?: boolean;
    inflationRate?: number;
  }
): void {
  const { strategyId, strategyName, hasSpouse, isRealValue = false, inflationRate = 3 } = options;
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseYear = flows[0]?.year ?? 2026;
  const unitLabel = isRealValue ? "만원/현재가치" : "만원/명목";

  const headers = [
    hasSpouse ? "본인 나이" : "나이",
    ...(hasSpouse ? ["배우자 나이"] : []),
    "연도",
    `세전 총수령액(${unitLabel})`,
    `국민연금(${unitLabel})`,
    `퇴직연금(${unitLabel})`,
    `개인연금(${unitLabel})`,
    `연금보험(${unitLabel})`,
    ...(strategyId === "S4" ? [`배당소득(커버드콜, ${unitLabel})`, `비상자금누적(${unitLabel})`] : []),
    `퇴직소득세(${unitLabel})`,
    `사적연금세(${unitLabel})`,
    `건강보험료(${unitLabel})`,
    `총 공제액(세금+건보, ${unitLabel})`,
    `세후 실수령액(${unitLabel})`,
    `세후 월 실수령액(${unitLabel})`,
    `기말 자산 잔고(${unitLabel})`,
    `목표대비 부족액(${unitLabel})`,
  ];

  const dataRows = flows.map((f) => {
    const t = Math.max(0, f.year - baseYear);
    const div = isRealValue ? Math.pow(1 + inflationRate / 100, t) : 1;
    const r = (val: number) => Math.round(val / div);

    const preTax = r(f.totalPreTax);
    const nat = r(f.nationalPreTax);
    const ret = r(f.retirementPreTax);
    const per = r(f.personalPreTax);
    const ins = r(f.insurancePreTax);
    const taxRet = r(f.taxOnRetirement);
    const taxPer = r(f.taxOnPersonal);
    const hi = r(f.healthInsurance);
    const totalDeductions = taxRet + taxPer + hi;
    const postTax = r(f.totalPostTax);
    const monthlyNet = Math.round((postTax / 12) * 10) / 10;
    const endingBal = r(f.endingBalance);
    const deficit = f.deficit > 0 ? r(f.deficit) : 0;

    return [
      `${f.age}세`,
      ...(hasSpouse ? [f.spouseAge ? `${f.spouseAge}세` : "-"] : []),
      `${f.year}년`,
      preTax,
      nat,
      ret,
      per,
      ins,
      ...(strategyId === "S4"
        ? [r(f.dividendPreTax || 0), r(f.accumulatedDividendBuffer || 0)]
        : []),
      taxRet,
      taxPer,
      hi,
      totalDeductions,
      postTax,
      monthlyNet,
      endingBal,
      deficit,
    ];
  });

  const valueModeName = isRealValue ? "현재가치실질" : "명목금액";
  downloadCsv(
    headers,
    dataRows,
    `인출전략_${strategyId}_${strategyName.replace(/[\s\(\)\/]+/g, "_")}_${valueModeName}_${dateStr}`
  );
}
