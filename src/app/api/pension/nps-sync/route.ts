import { NextResponse } from "next/server";

// Simple global memory cache for Codef OAuth token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

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
  // 토큰 캐시 유효 기간 확인 (유효시간 마진 5분 적용)
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
  // expires_in이 없는 경우 1일(86400초)을 기본 유효기간으로 적용
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

    const clientId = process.env.CODEF_CLIENT_ID || "";
    const clientSecret = process.env.CODEF_CLIENT_SECRET || "";
    const apiMode = process.env.CODEF_API_MODE || "development";
    const isDemo = apiMode !== "production";

    // 1. 키가 유효하지 않거나 데모 플레이스홀더인 경우 Mock 흐름 처리
    const isMockMode = !clientId || clientId === "mock_client_id" || !clientSecret || clientSecret === "mock_client_secret";

    if (isMockMode) {
      if (!jti) {
        // [1차 요청: 인증 수단 푸시 대기 가상화]
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return NextResponse.json({
          success: true,
          status: "NEED_VERIFICATION",
          message: "간편인증 요청이 스마트폰으로 전송되었습니다.",
          jti: "mock-jti-uuid-pensionlab-12345",
          twoWayInfo: {
            jobIndex: 1,
            threadIndex: 1,
            jti: "mock-jti-uuid-pensionlab-12345",
            twoWayTimestamp: Date.now(),
          },
        });
      } else {
        // [2차 요청: 인증 완료 후 데이터 스크래핑 가상화]
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Mock 데이터 반환 (실제 입력 이름 등에 비례해 약간 가변적으로 계산되도록 구성 가능)
        const mockNpsData = {
          contributionMonths: 184, // 15년 4개월 납부
          totalPaidAmount: 4140, // 4,140만원 납부함
          currentStandardMonthlyIncome: 450, // 기준 소득 월액 450만원
          expectedTotalContributionMonths: 360, // 총 30년 예상 가입
          expectedMonthlyPension: 98, // 월 98만원 수령 예상
          totalExpectedPremium: 8100, // 총 예상 납부 보험료 8,100만원
          basicPensionAmount: 93, // 기본 연금액 93만원
          aValue: 300, // A값 (전체 평균 소득) 300만원
          bValue: 430, // B값 (본인 평균 소득) 430만원
        };

        return NextResponse.json({
          success: true,
          status: "SUCCESS",
          message: "국민연금 정보 동기화가 성공적으로 완료되었습니다.",
          data: mockNpsData,
        });
      }
    }

    // 2. 실제 Codef API 연동 처리
    const accessToken = await getCodefAccessToken(clientId, clientSecret, isDemo);
    const codefUrl = isDemo
      ? "https://development.codef.io/v1/kr/public/pp/nps-minwon/my-pension"
      : "https://api.codef.io/v1/kr/public/pp/nps-minwon/my-pension";

    const detailCode = PROVIDER_DETAIL_MAP[provider] || "1";

    let payload: Record<string, any> = {};

    if (!jti) {
      // 1차 요청 페이로드
      payload = {
        organization: "0001", // 국민연금공단 (nps-minwon 기관코드)
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
        organization: "0001",
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

    // Codef 2Way 추가인증이 필요한 상태 코드
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
      const apiData = result.data;

      // 실제 응답 필드 파싱 및 국민연금 9대 필수 정보 매핑 가공
      // Note: 실제 Codef API 응답 규격 명세에 매핑
      const contributionMonths = Number(apiData.resContributionMonths || 0);
      const totalPaidAmount = Math.round(Number(apiData.resTotalPaidAmount || 0) / 10000); // 원 -> 만원
      const currentStandardMonthlyIncome = Math.round(Number(apiData.resStandardMonthlyIncome || 0) / 10000); // 원 -> 만원
      const expectedTotalContributionMonths = Number(apiData.resExpectedTotalContributionMonths || 360);
      const expectedMonthlyPension = Math.round(Number(apiData.resExpectedMonthlyPension || 0) / 10000); // 원 -> 만원
      const totalExpectedPremium = Math.round(Number(apiData.resTotalExpectedPremium || 0) / 10000);
      const basicPensionAmount = Math.round(Number(apiData.resBasicPensionAmount || 0) / 10000);
      const aValue = Math.round(Number(apiData.resAValue || 0) / 10000);
      const bValue = Math.round(Number(apiData.resBValue || 0) / 10000);

      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        message: "동기화가 완료되었습니다.",
        data: {
          contributionMonths,
          totalPaidAmount,
          currentStandardMonthlyIncome,
          expectedTotalContributionMonths,
          expectedMonthlyPension,
          totalExpectedPremium,
          basicPensionAmount,
          aValue,
          bValue,
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
    console.error("NPS Sync Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "서버 내부 처리 중 오류가 발생했습니다.",
    }, { status: 500 });
  }
}
