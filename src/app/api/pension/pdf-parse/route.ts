import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function POST(request: Request) {
  try {
    const { pdfText } = await request.json();

    if (!pdfText) {
      return NextResponse.json(
        { error: "PDF 텍스트가 전달되지 않았습니다." },
        { status: 400 }
      );
    }

    if (!genAI) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const prompt = `
당신은 대한민국 금융감독원 통합연금포털의 연금 정보 조회 PDF 보고서에서 텍스트를 추출한 데이터를 정밀 분석하는 전문 파서(Parser) AI입니다.
주어진 PDF 텍스트에서 1층(국민연금), 2층(퇴직연금 DB/DC/IRP), 3층(개인연금저축/연금보험) 데이터를 찾아서 아래 명시된 정확한 JSON 스키마로 가공하여 반환해 주십시오.

[분석할 PDF 텍스트 데이터]
"""
${pdfText}
"""

[반환할 JSON 구조 규칙]
- 반드시 아래의 스키마와 일치하는 JSON 형식의 데이터만 반환하고, 부연 설명이나 마크다운 코드 블록(\`\`\`json 등)은 완전히 배제하여 순수한 JSON 문자열만 출력해 주십시오.
- 텍스트 내에서 해당하는 연금 항목을 찾지 못한 경우, null 또는 빈 배열(\`[]\`)로 처리하십시오.
- 모든 금액 단위는 반드시 **만원**으로 통일하십시오. (예: 1억 원 ➔ 10000, 350만 원 ➔ 350, 45만 원 ➔ 45)
- 숫자가 아닌 기호(%p, %, 개월, 세 등)는 제외하고 순수 숫자만 담아주십시오.

[JSON Schema]
{
  "nationalPension": {
    "contributionMonths": number or null, // 현재 누적 가입 개월수 (예: 120개월 ➔ 120)
    "currentStandardMonthlyIncome": number or null, // 현재 기준소득월액 (만원 단위)
    "expectedMonthlyPension": number or null // 예상 국민연금 월액 (만원 단위, 예: 213만 원 ➔ 213)
  },
  "retirementPensions": [
    // 2층 퇴직연금 목록 (DB, DC, IRP 유형 구분)
    {
      "pensionType": "DB" or "DC" or "IRP",
      "avgSalary": number or null, // DB형일 때 평균급여 (만원 단위)
      "yearsOfService": number or null, // DB형일 때 현재 근속연수 (년 단위)
      "salaryGrowthRate": number or null, // DB형일 때 임금상승률 (%, 기본값 3.0)
      "totalAccumulated": number or null, // DC/IRP형일 때 누적적립금 (만원 단위)
      "monthlyContribution": number or null, // DC/IRP형일 때 월 납입액 (만원 단위)
      "expectedReturnRate": number or null // DC/IRP형일 때 투자 예상수익률 (%, 기본값 3.0)
    }
  ],
  "personalPensions": [
    // 3층 개인연금저축 목록 (연금저축 신탁/펀드/보험 등)
    {
      "savingsType": "TRUST" or "FUND" or "INSURANCE", // 신탁 ➔ TRUST, 펀드 ➔ FUND, 생명/손해보험 ➔ INSURANCE
      "totalAccumulated": number or null, // 누적적립금 (만원 단위)
      "monthlyAnnualContribution": number or null, // 월 납입액 (만원 단위)
      "desiredStartAge": number or null, // 수령 희망나이 (세 단위, 기본값 65)
      "receivingPeriod": number or null // 수령기간 (년 단위, 기본값 20)
    }
  ],
  "pensionInsurances": [
    // 3층 일반 세제비적격 연금보험 목록
    {
      "insuranceType": "SAVING" or "VARIABLE", // 일반저축성연금 ➔ SAVING, 변액연금 ➔ VARIABLE
      "totalAccumulated": number or null, // 누적적립금 (만원 단위)
      "monthlyPayment": number or null, // 월 납입액 (만원 단위)
      "paymentPeriod": number or null, // 납입기간 (년 단위, 기본값 10)
      "expectedDeclaredRate": number or null // 공시이율 또는 예상 수익률 (%, 기본값 2.5)
    }
  ]
}

오직 위의 JSON 양식에 맞춰 완벽한 유효 JSON만 반환하십시오.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const resultText = result.response.text().trim();

    // Parse the AI output to verify validity
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("PDF Parse API Error:", error);
    return NextResponse.json(
      { error: "PDF 데이터를 분석하는 과정에서 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
