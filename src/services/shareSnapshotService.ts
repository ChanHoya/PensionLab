/**
 * 은퇴 시뮬레이션 부부·가족 공유 스냅샷 서비스
 * 시뮬레이션 핵심 파라미터를 URL-safe Base64로 압축/인코딩 및 복원(Hydration)
 */

export interface ShareableSnapshotData {
  v: number; // schema version (1)
  ts: number; // timestamp
  // 기본 정보
  ca: number; // currentAge
  ra: number; // retirementAge
  le: number; // expectedLifeExpectancy
  hs: boolean; // hasSpouse
  sa?: number; // spouseAge
  // 생활비
  ms: number; // targetMonthlySpending (만원)
  // 3층 연금 자산
  np: number; // monthlyNationalPension (만원)
  rp: number; // retirementPensionSavings (만원)
  pp: number; // personalPensionSavings (만원)
  // 비연금 & 부동산
  na: number; // nonPensionAssets (만원)
  re: number; // propertyTaxBase (만원)
  // S4 배당
  cca?: number; // coveredCallAsset (만원)
  ccr?: number; // coveredCallDividendRate (%)
}

/**
 * 시뮬레이션 파라미터를 Base64 문자열로 인코딩
 */
export function encodeSnapshot(data: ShareableSnapshotData): string {
  try {
    const jsonStr = JSON.stringify(data);
    // Unicode 지원 base64 인코딩
    if (typeof window !== "undefined") {
      return btoa(encodeURIComponent(jsonStr));
    }
    return Buffer.from(encodeURIComponent(jsonStr)).toString("base64");
  } catch (err) {
    console.error("Failed to encode snapshot:", err);
    return "";
  }
}

/**
 * Base64 문자열을 파라미터 객체로 디코딩
 */
export function decodeSnapshot(encoded: string): ShareableSnapshotData | null {
  try {
    let jsonStr = "";
    if (typeof window !== "undefined") {
      jsonStr = decodeURIComponent(atob(encoded));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(encoded, "base64").toString("utf-8"));
    }
    const data = JSON.parse(jsonStr) as ShareableSnapshotData;
    if (data && data.v === 1 && data.ca && data.ra) {
      return data;
    }
    return null;
  } catch (err) {
    console.error("Failed to decode snapshot:", err);
    return null;
  }
}

/**
 * 현재 브라우저 URL 기반 전체 공유 링크 생성
 */
export function generateShareUrl(data: ShareableSnapshotData, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://pension-lab.vercel.app");
  const encoded = encodeSnapshot(data);
  return `${base}/dashboard?snapshot=${encoded}`;
}

/**
 * 카카오톡/문자 전송용 요약 문구 생성
 */
export function generateShareMessage(data: ShareableSnapshotData, shareUrl: string): string {
  const spouseText = data.hs ? ` (배우자 만 ${data.sa ?? data.ca - 2}세)` : "";
  return `[PensionLab] 우리 부부 은퇴 설계 스냅샷 📊
- 은퇴 예정: 만 ${data.ra}세${spouseText}
- 목표 생활비: 월 ${data.ms.toLocaleString()}만 원
- 예상 월 국민연금: ${data.np.toLocaleString()}만 원
- 사적/퇴직 자산: ${(data.rp + data.pp).toLocaleString()}만 원

지금 링크를 열어 함께 시뮬레이션 결과를 확인해보세요:
${shareUrl}`;
}
