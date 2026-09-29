/**
 * 나이 입력값 해석: 실제 나이(숫자) 또는 주민번호 앞 6~7자리(생년월일)를 받아 만 나이를 계산한다.
 * - 1~3자리 숫자: 입력된 값을 그대로 나이로 사용
 * - 6자리(YYMMDD) 또는 7자리(YYMMDD+성별코드): 생년월일로 해석해 기준일 기준 만 나이 계산
 */
// 주민번호 앞 6~7자리 → 출생 연·월·일 (형식이 아니면 null)
function parseBirthDate(digits: string, referenceDate: Date): { year: number; month: number; day: number } | null {
  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  let century: number | null = null;
  if (digits.length >= 7) {
    const genderDigit = parseInt(digits[6], 10);
    if (genderDigit === 1 || genderDigit === 2 || genderDigit === 5 || genderDigit === 6) {
      century = 1900;
    } else if (genderDigit === 3 || genderDigit === 4 || genderDigit === 7 || genderDigit === 8) {
      century = 2000;
    }
  }
  if (century === null) {
    const currentYY = referenceDate.getFullYear() % 100;
    century = yy <= currentYY ? 2000 : 1900;
  }
  return { year: century + yy, month: mm, day: dd };
}

/**
 * 출생연도 해석: 주민번호 앞자리면 정확한 출생연도, 숫자 나이면 기준 연도 − 나이(생일이 지났다고 가정한 근사)
 * 국민연금 법정 개시 나이 판정에 쓴다
 */
export function resolveBirthYear(input: string, referenceDate: Date = new Date()): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length >= 6) return parseBirthDate(digits, referenceDate)?.year ?? null;
  const age = parseInt(digits, 10);
  return Number.isNaN(age) ? null : referenceDate.getFullYear() - age;
}

export function resolveAge(input: string, referenceDate: Date = new Date()): number | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 6) {
    const birth = parseBirthDate(digits, referenceDate);
    if (!birth) return null;
    const { year: birthYear, month: mm, day: dd } = birth;
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth() + 1;
    const refDay = referenceDate.getDate();

    let age = refYear - birthYear;
    if (refMonth < mm || (refMonth === mm && refDay < dd)) age -= 1;
    return age;
  }

  const age = parseInt(digits, 10);
  return Number.isNaN(age) ? null : age;
}
