import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NationalPensionState {
  contributionMonths: number;
  totalPaidAmount: number;
  currentStandardMonthlyIncome: number;
  expectedTotalContributionMonths: number;
  expectedMonthlyPension: number;
  totalExpectedPremium: number;
  basicPensionAmount: number;
  aValue: number;
  bValue: number;
}

export interface BasicPensionState {
  householdType: "SINGLE" | "COUPLE";
  recognizedIncome: number;
  expectedEligibility: boolean;
  expectedMonthlyAmount: number;
  region: "METRO" | "CITY" | "RURAL"; // 거주지역 (기본재산 공제 구분)
  generalProperty: number; // 일반재산: 주택 공시가격 등 (만원)
  financialAssets: number; // 금융재산 (만원)
  debts: number; // 부채: 주택담보대출·임대보증금 (만원)
  luxuryAssets: number; // 고급 차량(4,000만원 이상)·회원권 가액 (만원)
  selfEarnedIncome: number; // 본인 65세 이후 상시근로소득 (만원/월)
  selfOtherIncome: number; // 본인 사업·임대·이자·배당·사적연금 소득 (만원/월)
  selfOccupational: boolean; // 본인 직역연금 수급권자
  spouseEarnedIncome: number;
  spouseOtherIncome: number;
  spouseOccupational: boolean;
  applyToSimulation: boolean; // 대시보드 시뮬레이션에 기초연금 반영 (재산 미입력 시 0원으로 계산되므로 기본 반영 안 함)
}

export interface RetirementPensionState {
  id: string;
  pensionType: "DB" | "DC" | "IRP";
  avgSalary?: number; // DB
  yearsOfService?: number; // DB
  salaryGrowthRate?: number; // DB (%)
  totalAccumulated?: number; // DC/IRP
  monthlyContribution?: number; // DC/IRP
  companyMatchRate?: number; // DC/IRP
  expectedReturnRate?: number; // DC/IRP (%)
  provider?: string; // 금융회사 (금감원 자료에서 읽음)
  productName?: string; // 상품명
}

export interface PersonalPensionSavingsState {
  id: string;
  savingsType: "FUND" | "INSURANCE";
  totalAccumulated: number;
  monthlyAnnualContribution: number;
  desiredStartAge: number;
  receivingPeriod: number;
  provider?: string; // 금융회사 (금감원 자료에서 읽음)
  productName?: string; // 상품명
}

export interface PensionInsuranceState {
  id: string;
  insuranceType: string;
  totalAccumulated: number;
  monthlyPayment: number;
  paymentPeriod: number;
  expectedDeclaredRate: number; // (%)
  provider?: string; // 금융회사 (금감원 자료에서 읽음)
  productName?: string; // 상품명
}

export interface SimulationParamsState {
  currentAge: number;
  retirementAge: number;
  expectedLifeExpectancy: number;
  inflationRate: number; // (%)
  nationalPensionStartAge: number;
  hasSpouse: boolean;
  spouseAge?: number;
  birthYear?: number; // 출생연도 (국민연금 법정 개시 나이 판정, 없으면 현재연도 − 나이)
  spouseBirthYear?: number;
  childrenCount: number;
  childrenAges: string;
  targetMonthlySpending: number;
  minMonthlySpending: number;
  childSupportExpense: number;
  annualMedicalExpense: number;
  nonPensionAssets: number;
  propertyTaxBase: number;  // 재산세 과세표준 (만원)
  financialIncome: number;  // 금융소득 이자+배당 (만원/년)
  decumulationStrategy: "DECREASING" | "FLAT";
  // S4 하이브리드(배당+연금) 전략 매개변수
  coveredCallAsset: number;        // 커버드콜/월배당 투자금 (만원, 기본 5000)
  coveredCallDividendRate: number;  // 예상 연 분배율 (%, 기본 9.0)
  isCoupleDivided: boolean;         // 부부 명의 분산 여부 (기본 false)
  spouseRetirementAge: number;      // 배우자 은퇴 예상 나이
  spouseLifeExpectancy: number;     // 배우자 기대수명
  spouseNationalPensionStartAge: number; // 배우자 국민연금 개시 나이
  // 부부 통합 시뮬레이션 옵션
  nationalPensionDeferYears: number; // 본인 국민연금 연기 (0~5년, 1년당 7.2% 가산)
  spouseNationalPensionDeferYears: number; // 배우자 국민연금 연기
  privateDrawStartAge: number; // 퇴직·개인연금 인출 시작 나이 (본인 나이 기준, 0 = 조회 시점 익년 = 현재 나이 + 1)
  privatePensionEndAge: number; // 가구 사적연금 소진 나이 (본인 나이 기준, 0 = 본인 기대수명)
  spousePrivatePensionEndAge: number; // 배우자 사적연금 수령 종료 나이 (가구 평탄화에서는 쓰지 않음, S1~S4 인출 엔진용)
}

export type GapReason = "EXEMPT" | "EXCLUDED" | "MILITARY" | "ARREARS";
export type EnrollStatus = "WORKPLACE" | "REGIONAL" | "VOLUNTARY" | "VOLUNTARY_CONT" | "NONE";

export interface AdditionalPaymentState {
  firstEnrollYm: string;          // 최초 가입년월 "YYYY-MM"
  resumeYm: string;               // 지속 가입개시 년월 "YYYY-MM"
  gapMonths: number;              // 중단 기간 (개월)
  gapReason: GapReason;           // 중단 사유
  enrollStatus: EnrollStatus;     // 현재 가입 상태
  receivedLumpSumRefund: boolean; // 반환일시금 수령 여부
  requestedMonths: number;        // 추납 희망 개월수
  baseIncome: number;             // 추납 기준소득월액 (만원)
  paymentMode: "LUMP" | "INSTALLMENT";
  installments: number;           // 분납 횟수 (최대 60)
  installmentInterestRate: number; // 분납이자율 (%/년, 1년 정기예금)
  applyYm: string;                // 신청 년월 "YYYY-MM" (첫 납부기한은 다음 달)
  marginalTaxRate: number;        // 한계세율 (%, 지방세 포함)
  applyToSimulation: boolean;     // 대시보드 시뮬레이션에 추납 반영
}

export interface ReturnRepaymentState {
  refundAmount: number;       // 반환일시금 원금 (만원)
  refundYm: string;           // 반환일시금 수령년월 "YYYY-MM"
  restoredMonths: number;     // 반납 시 복원되는 가입기간 (개월)
  periodStartYm: string;      // 복원 기간의 가입 시작년월 (소득대체율 판정)
  noticeAmount: number;       // 공단 반납 고지액 (만원, 0이면 추정)
  applyYm: string;            // 반납 신청년월 "YYYY-MM"
  installments: number;       // 분할 횟수 (1 = 일시납)
  applyToSimulation: boolean; // 대시보드 시뮬레이션에 반납 반영
}

// 본인·배우자 구분. 기존 액션은 who를 생략하면 본인(SELF)에 쓴다
export type Who = "SELF" | "SPOUSE";

export interface SpouseState {
  nationalPension: NationalPensionState;
  additionalPayment: AdditionalPaymentState;
  returnRepayment: ReturnRepaymentState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
}

export type PersonData = SpouseState;

interface StoreData {
  nationalPension: NationalPensionState;
  basicPension: BasicPensionState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
  simulationParams: SimulationParamsState;
  additionalPayment: AdditionalPaymentState;
  returnRepayment: ReturnRepaymentState;
  spouse: SpouseState;
}

interface PensionStore extends StoreData {
  // Actions — who를 생략하면 본인(SELF)
  setNationalPension: (data: Partial<NationalPensionState>, who?: Who) => void;
  setBasicPension: (data: Partial<BasicPensionState>) => void;
  addRetirementPension: (pension: Omit<RetirementPensionState, "id">, who?: Who) => void;
  updateRetirementPension: (id: string, data: Partial<RetirementPensionState>, who?: Who) => void;
  deleteRetirementPension: (id: string, who?: Who) => void;
  addPersonalPension: (pension: Omit<PersonalPensionSavingsState, "id">, who?: Who) => void;
  updatePersonalPension: (id: string, data: Partial<PersonalPensionSavingsState>, who?: Who) => void;
  deletePersonalPension: (id: string, who?: Who) => void;
  addPensionInsurance: (insurance: Omit<PensionInsuranceState, "id">, who?: Who) => void;
  updatePensionInsurance: (id: string, data: Partial<PensionInsuranceState>, who?: Who) => void;
  deletePensionInsurance: (id: string, who?: Who) => void;
  setRetirementPensions: (pensions: RetirementPensionState[], who?: Who) => void;
  setPersonalPensions: (pensions: PersonalPensionSavingsState[], who?: Who) => void;
  setPensionInsurances: (insurances: PensionInsuranceState[], who?: Who) => void;
  setSimulationParams: (data: Partial<SimulationParamsState>) => void;
  setAdditionalPayment: (data: Partial<AdditionalPaymentState>, who?: Who) => void;
  setReturnRepayment: (data: Partial<ReturnRepaymentState>, who?: Who) => void;
  importStoreData: (data: Partial<StoreData>) => void;
  resetStore: () => void;
}

const initialNationalPension: NationalPensionState = {
  contributionMonths: 0,
  totalPaidAmount: 0,
  currentStandardMonthlyIncome: 0,
  expectedTotalContributionMonths: 0,
  expectedMonthlyPension: 0,
  totalExpectedPremium: 0,
  basicPensionAmount: 0,
  aValue: 0,
  bValue: 0,
};

const initialBasicPension: BasicPensionState = {
  householdType: "SINGLE",
  recognizedIncome: 0,
  expectedEligibility: false,
  expectedMonthlyAmount: 0,
  region: "METRO",
  generalProperty: 0,
  financialAssets: 0,
  debts: 0,
  luxuryAssets: 0,
  selfEarnedIncome: 0,
  selfOtherIncome: 0,
  selfOccupational: false,
  spouseEarnedIncome: 0,
  spouseOtherIncome: 0,
  spouseOccupational: false,
  applyToSimulation: false,
};

const initialSimulationParams: SimulationParamsState = {
  currentAge: 35,
  retirementAge: 60,
  expectedLifeExpectancy: 85,
  inflationRate: 3.0, // 최근 30년(1996~2025) 소비자물가 연평균 약 2.7%를 반올림
  nationalPensionStartAge: 65,
  hasSpouse: false,
  spouseAge: 35,
  childrenCount: 0,
  childrenAges: "",
  targetMonthlySpending: 300,
  minMonthlySpending: 200,
  childSupportExpense: 0,
  annualMedicalExpense: 0,
  nonPensionAssets: 0,
  propertyTaxBase: 0,
  financialIncome: 0,
  decumulationStrategy: "DECREASING",
  coveredCallAsset: 5000,
  coveredCallDividendRate: 9.0,
  isCoupleDivided: false,
  spouseRetirementAge: 60,
  spouseLifeExpectancy: 85,
  spouseNationalPensionStartAge: 65,
  nationalPensionDeferYears: 0,
  spouseNationalPensionDeferYears: 0,
  privateDrawStartAge: 0,
  privatePensionEndAge: 0,
  spousePrivatePensionEndAge: 0,
};

const initialAdditionalPayment: AdditionalPaymentState = {
  firstEnrollYm: "",
  resumeYm: "",
  gapMonths: 0,
  gapReason: "EXEMPT",
  enrollStatus: "REGIONAL",
  receivedLumpSumRefund: false,
  requestedMonths: 0,
  baseIncome: 100,
  paymentMode: "LUMP",
  installments: 12,
  installmentInterestRate: 2.5,
  applyYm: "",
  marginalTaxRate: 0,
  applyToSimulation: false,
};

const initialReturnRepayment: ReturnRepaymentState = {
  refundAmount: 0,
  refundYm: "",
  restoredMonths: 0,
  periodStartYm: "",
  noticeAmount: 0,
  applyYm: "",
  installments: 1,
  applyToSimulation: false,
};

const initialSpouse: SpouseState = {
  nationalPension: initialNationalPension,
  additionalPayment: initialAdditionalPayment,
  returnRepayment: initialReturnRepayment,
  retirementPensions: [],
  personalPensions: [],
  pensionInsurances: [],
};

const initialData: StoreData = {
  nationalPension: initialNationalPension,
  basicPension: initialBasicPension,
  retirementPensions: [],
  personalPensions: [],
  pensionInsurances: [],
  simulationParams: initialSimulationParams,
  additionalPayment: initialAdditionalPayment,
  returnRepayment: initialReturnRepayment,
  spouse: initialSpouse,
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// 저장본·백업을 불러올 때 새로 생긴 필드가 초기값으로 채워지도록 객체는 재귀 병합, 배열·값은 덮어쓴다.
// defaults에 없는 키(백업 파일의 알 수 없는 필드, 액션 이름과 같은 키 등)는 무시한다.
export function mergeWithDefaults<T>(saved: unknown, defaults: T): T {
  if (!isPlainObject(saved) || !isPlainObject(defaults)) return defaults;
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(defaults as Record<string, unknown>)) {
    const value = (saved as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const base = (defaults as Record<string, unknown>)[key];
    out[key] = isPlainObject(value) && isPlainObject(base) ? mergeWithDefaults(value, base) : value;
  }
  return out as T;
}

// 대시보드 엔진에 넘길 기초연금: 「반영 안 함」이면 수급액 0
export function basicForSimulation(b: BasicPensionState): BasicPensionState {
  return b.applyToSimulation ? b : { ...b, expectedMonthlyAmount: 0, expectedEligibility: false };
}

// 본인/배우자 연금 데이터를 같은 모양으로 꺼낸다
export function pensionsOf(state: StoreData, who: Who): PersonData {
  if (who === "SPOUSE") return state.spouse;
  return {
    nationalPension: state.nationalPension,
    additionalPayment: state.additionalPayment,
    returnRepayment: state.returnRepayment,
    retirementPensions: state.retirementPensions,
    personalPensions: state.personalPensions,
    pensionInsurances: state.pensionInsurances,
  };
}

// who에 해당하는 사람의 필드만 바꾼 부분 상태를 만든다
function patchPerson(state: StoreData, who: Who, patch: Partial<PersonData>): Partial<StoreData> {
  if (who === "SPOUSE") return { spouse: { ...state.spouse, ...patch } };
  return patch;
}

export const usePensionStore = create<PensionStore>()(
  persist(
    (set) => ({
      ...initialData,

      setNationalPension: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { nationalPension: { ...pensionsOf(state, who).nationalPension, ...data } })),

      setBasicPension: (data) =>
        set((state) => ({ basicPension: { ...state.basicPension, ...data } })),

      addRetirementPension: (pension, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: [...pensionsOf(state, who).retirementPensions, { ...pension, id: crypto.randomUUID() }],
          })
        ),

      updateRetirementPension: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: pensionsOf(state, who).retirementPensions.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deleteRetirementPension: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            retirementPensions: pensionsOf(state, who).retirementPensions.filter((p) => p.id !== id),
          })
        ),

      addPersonalPension: (pension, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: [...pensionsOf(state, who).personalPensions, { ...pension, id: crypto.randomUUID() }],
          })
        ),

      updatePersonalPension: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: pensionsOf(state, who).personalPensions.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deletePersonalPension: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            personalPensions: pensionsOf(state, who).personalPensions.filter((p) => p.id !== id),
          })
        ),

      addPensionInsurance: (insurance, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: [...pensionsOf(state, who).pensionInsurances, { ...insurance, id: crypto.randomUUID() }],
          })
        ),

      updatePensionInsurance: (id, data, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: pensionsOf(state, who).pensionInsurances.map((p) => (p.id === id ? { ...p, ...data } : p)),
          })
        ),

      deletePensionInsurance: (id, who = "SELF") =>
        set((state) =>
          patchPerson(state, who, {
            pensionInsurances: pensionsOf(state, who).pensionInsurances.filter((p) => p.id !== id),
          })
        ),

      setRetirementPensions: (pensions, who = "SELF") =>
        set((state) => patchPerson(state, who, { retirementPensions: pensions })),

      setPersonalPensions: (pensions, who = "SELF") =>
        set((state) => patchPerson(state, who, { personalPensions: pensions })),

      setPensionInsurances: (insurances, who = "SELF") =>
        set((state) => patchPerson(state, who, { pensionInsurances: insurances })),

      setSimulationParams: (data) =>
        set((state) => ({ simulationParams: { ...state.simulationParams, ...data } })),

      setAdditionalPayment: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { additionalPayment: { ...pensionsOf(state, who).additionalPayment, ...data } })),

      setReturnRepayment: (data, who = "SELF") =>
        set((state) => patchPerson(state, who, { returnRepayment: { ...pensionsOf(state, who).returnRepayment, ...data } })),

      // 백업 파일은 이전 버전일 수 있으므로 빠진 필드를 초기값으로 채운다
      importStoreData: (data) => set(mergeWithDefaults(data, initialData)),

      resetStore: () => set(initialData),
    }),
    {
      name: "pensionlab-store",
      version: 2,
      // 이전 저장본에 없는 필드(배우자·반납·기초연금 입력 등)를 초기값으로 채운다
      merge: (persisted, current) => mergeWithDefaults(persisted, current),
    }
  )
);
