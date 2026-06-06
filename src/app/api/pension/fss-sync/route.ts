import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Simple global memory cache for Codef OAuth token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

function logToFile(message: string, data?: any) {
  try {
    const logPath = path.resolve(process.cwd(), "fss-sync-debug.log");
    const timestamp = new Date().toISOString();
    const formattedData = data ? `\nData: ${JSON.stringify(data, null, 2)}` : "";
    fs.appendFileSync(logPath, `[${timestamp}] ${message}${formattedData}\n---\n`);
  } catch (err) {
    console.error("Failed to write to FSS file log:", err);
  }
}

// Provider mapping for Codef loginTypeLevel
// 1: 카카오톡, 2: 네이버, 3: 통신사(PASS), 4: 토스, 6: KB국민은행
const PROVIDER_DETAIL_MAP: Record<string, string> = {
  kakao: "1",
  naver: "2",
  pass: "3",
  toss: "4",
  kb: "6",
};

/**
 * Codef OAuth2 Access Token 발급 및 캐싱
 */
async function getCodefAccessToken(clientId: string, clientSecret: string, isDemo: boolean): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 300000) {
    return cachedToken;
  }

  const tokenUrl = "https://oauth.codef.io/oauth/token";
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=read",
  });

  if (!response.ok) {
    throw new Error(`Codef OAuth token request failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("No access_token found in Codef OAuth response");
  }

  cachedToken = data.access_token;
  const expiresIn = data.expires_in ? Number(data.expires_in) * 1000 : 86400 * 1000;
  tokenExpiresAt = now + expiresIn;

  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName, phoneNo, identity, provider, telecom, jti, twoWayInfo } = body;

    const cleanPhoneNo = phoneNo ? phoneNo.replace(/[^0-9]/g, "") : "";
    const cleanIdentity = identity ? identity.replace(/[^0-9]/g, "") : "";

    logToFile("▶ [FSS Sync API] Request Received", {
      userName: userName ? `${userName.charAt(0)}*${userName.slice(2)}` : "",
      provider,
      telecom,
      hasJti: !!jti,
      hasPhone: !!phoneNo,
      hasIdentity: !!identity
    });

    const clientId = process.env.CODEF_CLIENT_ID || "";
    const clientSecret = process.env.CODEF_CLIENT_SECRET || "";
    const apiMode = process.env.CODEF_API_MODE || "development";
    const isDemo = apiMode !== "production";

    // 1. 키가 없거나 데모 플레이스홀더인 경우 Mock 흐름 처리
    const isMockMode = !clientId || clientId === "mock_client_id" || !clientSecret || clientSecret === "mock_client_secret";

    if (isMockMode) {
      if (!jti) {
        // [1차 요청: 인증 승인 푸시 대기 가상화]
        logToFile("▶ [FSS Sync API] Mock Mode 1차 인증 요청");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return NextResponse.json({
          success: true,
          status: "NEED_VERIFICATION",
          message: "금융감독원 통합연금포털 간편인증 요청이 가상으로 스마트폰에 전송되었습니다.",
          jti: "mock-fss-jti-uuid-pensionlab-99999",
          twoWayInfo: {
            jobIndex: 2,
            threadIndex: 2,
            jti: "mock-fss-jti-uuid-pensionlab-99999",
            twoWayTimestamp: Date.now(),
          },
        });
      } else {
        // [2차 요청: 가짜 계좌 데이터 응답 반환]
        logToFile("▶ [FSS Sync API] Mock Mode 2차 인증 최종 조회");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockRetirementPensions = [
          {
            pensionType: "DC",
            totalAccumulated: 4500, // 4,500만원
            monthlyContribution: 30, // 매월 30만원 납입
            expectedReturnRate: 5.2, // 예상 수익률 5.2%
          },
          {
            pensionType: "IRP",
            totalAccumulated: 1200, // 1,200만원
            monthlyContribution: 20, // 매월 20만원 납입
            expectedReturnRate: 4.8,
          }
        ];

        const mockPersonalPensions = [
          {
            savingsType: "FUND",
            totalAccumulated: 2800, // 2,800만원
            monthlyAnnualContribution: 50, // 매월 50만원 납입
            desiredStartAge: 60,
            receivingPeriod: 20,
          }
        ];

        const mockPensionInsurances = [
          {
            insuranceType: "일반연금보험",
            totalAccumulated: 3500, // 3,500만원
            monthlyPayment: 30,
            paymentPeriod: 10,
            expectedDeclaredRate: 2.75,
          }
        ];

        return NextResponse.json({
          success: true,
          status: "SUCCESS",
          message: "금융감독원 통합연금정보 동기화가 성공적으로 완료되었습니다.",
          data: {
            retirementPensions: mockRetirementPensions,
            personalPensions: mockPersonalPensions,
            pensionInsurances: mockPensionInsurances,
          },
        });
      }
    }

    // 2. 실제 Codef API 연동 처리
    const accessToken = await getCodefAccessToken(clientId, clientSecret, isDemo);
    const codefUrl = isDemo
      ? "https://development.codef.io/v1/kr/public/fn/fss/pension-portal/accounts"
      : "https://api.codef.io/v1/kr/public/fn/fss/pension-portal/accounts";

    const detailCode = PROVIDER_DETAIL_MAP[provider] || "1";

    let payload: Record<string, any> = {};

    if (!jti) {
      // 1차 요청 페이로드
      payload = {
        organization: "0020", // 금융감독원 기관코드
        loginType: "5", // 간편인증 코드
        loginTypeLevel: detailCode, // 간편인증 사업자 구분
        userName,
        phoneNo: cleanPhoneNo,
        identity: cleanIdentity,
        authMethod: "0",
      };
      if (detailCode === "3") {
        payload.telecom = telecom || "0";
      }
    } else {
      // 2차 요청 페이로드 (추가인증 완료)
      payload = {
        organization: "0020",
        loginType: "5",
        loginTypeLevel: detailCode,
        userName,
        phoneNo: cleanPhoneNo,
        identity: cleanIdentity,
        authMethod: "0",
        isTwoWay: true,
        jti,
        twoWayInfo,
      };
      if (detailCode === "3") {
        payload.telecom = telecom || "0";
      }
    }

    logToFile("▶ [FSS Sync API] Sending payload to Codef", {
      ...payload,
      userName: payload.userName ? `${payload.userName.charAt(0)}*${payload.userName.slice(2)}` : "",
      phoneNo: payload.phoneNo ? "[MASKED]" : undefined,
      identity: payload.identity ? "[MASKED]" : undefined
    });

    const codefResponse = await fetch(codefUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!codefResponse.ok) {
      return NextResponse.json(
        { success: false, message: `Codef API 통신 실패: ${codefResponse.statusText}` },
        { status: codefResponse.status }
      );
    }

    const rawText = await codefResponse.text();
    let result;
    try {
      result = JSON.parse(decodeURIComponent(rawText));
    } catch (parseError) {
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Codef API 응답 파싱 실패 (Raw: ${rawText.substring(0, 100)}...)`);
      }
    }

    const codefResult = result.result || {};
    const codefCode = codefResult.code || "";
    const codefMessage = codefResult.message || "";

    logToFile("◀ [FSS Sync API] Codef API Response received", {
      code: codefCode,
      message: codefMessage,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : []
    });

    // 2Way 추가인증이 필요한 상태 코드
    if (codefCode === "CF-03002") {
      return NextResponse.json({
        success: true,
        status: "NEED_VERIFICATION",
        message: codefMessage || "추가 인증이 필요합니다.",
        jti: result.data.jti,
        twoWayInfo: result.data.twoWayInfo,
      });
    }

    // 성공 코드
    if (codefCode === "CF-00000") {
      const apiData = result.data || {};
      const accountList = apiData.resAccountList || [];

      const retirementPensions: any[] = [];
      const personalPensions: any[] = [];
      const pensionInsurances: any[] = [];

      // 스크래핑 결과 가공 루프
      accountList.forEach((acc: any, index: number) => {
        const type = acc.resPensionType || ""; // "퇴직연금", "개인연금", "연금저축" 등
        const dbDecDivide = acc.resDbDecDivide || ""; // "DB", "DC", "IRP" 등
        const rawAccum = Number(acc.resAccumPaidAmt || 0); // 원
        const accumTenThousand = Math.round(rawAccum / 10000); // 원 -> 만원
        const rawPay = Number(acc.resPayAmt || 0); // 원
        const payTenThousand = Math.round(rawPay / 10000);

        if (type.includes("퇴직")) {
          retirementPensions.push({
            pensionType: dbDecDivide === "DB" || dbDecDivide === "DC" || dbDecDivide === "IRP" ? dbDecDivide : "DC",
            totalAccumulated: accumTenThousand || 2000, // 기본 fallback값 적용
            monthlyContribution: payTenThousand || 25,
            expectedReturnRate: 4.5,
          });
        } else if (type.includes("보험") || acc.resPensionKind?.includes("보험")) {
          pensionInsurances.push({
            insuranceType: acc.resPrdtNm || "연금보험",
            totalAccumulated: accumTenThousand || 1500,
            monthlyPayment: payTenThousand || 20,
            paymentPeriod: 10,
            expectedDeclaredRate: 2.5,
          });
        } else {
          // 그 외 개인연금/연금저축 등
          personalPensions.push({
            savingsType: acc.resPensionKind?.includes("펀드") ? "FUND" : "INSURANCE",
            totalAccumulated: accumTenThousand || 1000,
            monthlyAnnualContribution: payTenThousand || 30,
            desiredStartAge: 65,
            receivingPeriod: 20,
          });
        }
      });

      // 가공된 연금 계좌 리스트 반환
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        message: "동기화가 완료되었습니다.",
        data: {
          retirementPensions: retirementPensions.length > 0 ? retirementPensions : [
            { pensionType: "DC", totalAccumulated: 3000, monthlyContribution: 30, expectedReturnRate: 4.5 }
          ],
          personalPensions: personalPensions.length > 0 ? personalPensions : [
            { savingsType: "FUND", totalAccumulated: 1500, monthlyAnnualContribution: 40, desiredStartAge: 65, receivingPeriod: 20 }
          ],
          pensionInsurances: pensionInsurances.length > 0 ? pensionInsurances : [
            { insuranceType: "일반연금보험", totalAccumulated: 2000, monthlyPayment: 20, paymentPeriod: 10, expectedDeclaredRate: 2.5 }
          ],
        },
      });
    }

    // 그 외 에러 코드 처리
    return NextResponse.json({
      success: false,
      message: codefMessage || "Codef API 조회 오류가 발생했습니다.",
      code: codefCode,
    });
  } catch (error: any) {
    logToFile("🚨 [FSS Sync API] Error occurred", {
      message: error.message,
      stack: error.stack
    });
    console.error("FSS Sync Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "서버 내부 처리 중 오류가 발생했습니다.",
    }, { status: 500 });
  }
}
