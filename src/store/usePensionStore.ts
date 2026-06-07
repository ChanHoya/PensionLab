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
}

export interface PersonalPensionSavingsState {
  id: string;
  savingsType: "FUND" | "INSURANCE";
  totalAccumulated: number;
  monthlyAnnualContribution: number;
  desiredStartAge: number;
  receivingPeriod: number;
}

export interface PensionInsuranceState {
  id: string;
  insuranceType: string;
  totalAccumulated: number;
  monthlyPayment: number;
  paymentPeriod: number;
  expectedDeclaredRate: number; // (%)
}

export interface SimulationParamsState {
  currentAge: number;
  retirementAge: number;
  expectedLifeExpectancy: number;
  inflationRate: number; // (%)
  nationalPensionStartAge: number;
  hasSpouse: boolean;
  spouseAge?: number;
  childrenCount: number;
  childrenAges: string;
  targetMonthlySpending: number;
  minMonthlySpending: number;
  childSupportExpense: number;
  annualMedicalExpense: number;
  nonPensionAssets: number;
  decumulationStrategy: "DECREASING" | "FLAT";
}

interface PensionStore {
  // States
  nationalPension: NationalPensionState;
  basicPension: BasicPensionState;
  retirementPensions: RetirementPensionState[];
  personalPensions: PersonalPensionSavingsState[];
  pensionInsurances: PensionInsuranceState[];
  simulationParams: SimulationParamsState;
  
  // Actions
  setNationalPension: (data: Partial<NationalPensionState>) => void;
  setBasicPension: (data: Partial<BasicPensionState>) => void;
  addRetirementPension: (pension: Omit<RetirementPensionState, "id">) => void;
  updateRetirementPension: (id: string, data: Partial<RetirementPensionState>) => void;
  deleteRetirementPension: (id: string) => void;
  addPersonalPension: (pension: Omit<PersonalPensionSavingsState, "id">) => void;
  updatePersonalPension: (id: string, data: Partial<PersonalPensionSavingsState>) => void;
  deletePersonalPension: (id: string) => void;
  addPensionInsurance: (insurance: Omit<PensionInsuranceState, "id">) => void;
  updatePensionInsurance: (id: string, data: Partial<PensionInsuranceState>) => void;
  deletePensionInsurance: (id: string) => void;
  setRetirementPensions: (pensions: RetirementPensionState[]) => void;
  setPersonalPensions: (pensions: PersonalPensionSavingsState[]) => void;
  setPensionInsurances: (insurances: PensionInsuranceState[]) => void;
  setSimulationParams: (data: Partial<SimulationParamsState>) => void;
  importStoreData: (data: {
    nationalPension: NationalPensionState;
    basicPension: BasicPensionState;
    retirementPensions: RetirementPensionState[];
    personalPensions: PersonalPensionSavingsState[];
    pensionInsurances: PensionInsuranceState[];
    simulationParams: SimulationParamsState;
  }) => void;
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
};

const initialSimulationParams: SimulationParamsState = {
  currentAge: 35,
  retirementAge: 60,
  expectedLifeExpectancy: 85,
  inflationRate: 2.0,
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
  decumulationStrategy: "DECREASING",
};

export const usePensionStore = create<PensionStore>()(
  persist(
    (set) => ({
      // Initial States
      nationalPension: initialNationalPension,
      basicPension: initialBasicPension,
      retirementPensions: [],
      personalPensions: [],
      pensionInsurances: [],
      simulationParams: initialSimulationParams,

      // Actions
      setNationalPension: (data) =>
        set((state) => ({
          nationalPension: { ...state.nationalPension, ...data },
        })),

      setBasicPension: (data) =>
        set((state) => ({
          basicPension: { ...state.basicPension, ...data },
        })),

      addRetirementPension: (pension) =>
        set((state) => ({
          retirementPensions: [
            ...state.retirementPensions,
            { ...pension, id: crypto.randomUUID() },
          ],
        })),

      updateRetirementPension: (id, data) =>
        set((state) => ({
          retirementPensions: state.retirementPensions.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deleteRetirementPension: (id) =>
        set((state) => ({
          retirementPensions: state.retirementPensions.filter((p) => p.id !== id),
        })),

      addPersonalPension: (pension) =>
        set((state) => ({
          personalPensions: [
            ...state.personalPensions,
            { ...pension, id: crypto.randomUUID() },
          ],
        })),

      updatePersonalPension: (id, data) =>
        set((state) => ({
          personalPensions: state.personalPensions.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deletePersonalPension: (id) =>
        set((state) => ({
          personalPensions: state.personalPensions.filter((p) => p.id !== id),
        })),

      addPensionInsurance: (insurance) =>
        set((state) => ({
          pensionInsurances: [
            ...state.pensionInsurances,
            { ...insurance, id: crypto.randomUUID() },
          ],
        })),

      updatePensionInsurance: (id, data) =>
        set((state) => ({
          pensionInsurances: state.pensionInsurances.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deletePensionInsurance: (id) =>
        set((state) => ({
          pensionInsurances: state.pensionInsurances.filter((p) => p.id !== id),
        })),
      
      setRetirementPensions: (pensions) =>
        set(() => ({
          retirementPensions: pensions,
        })),

      setPersonalPensions: (pensions) =>
        set(() => ({
          personalPensions: pensions,
        })),

      setPensionInsurances: (insurances) =>
        set(() => ({
          pensionInsurances: insurances,
        })),

      setSimulationParams: (data) =>
        set((state) => ({
          simulationParams: { ...state.simulationParams, ...data },
        })),

      importStoreData: (data) =>
        set({
          nationalPension: data.nationalPension || initialNationalPension,
          basicPension: data.basicPension || initialBasicPension,
          retirementPensions: data.retirementPensions || [],
          personalPensions: data.personalPensions || [],
          pensionInsurances: data.pensionInsurances || [],
          simulationParams: data.simulationParams
            ? { ...initialSimulationParams, ...data.simulationParams }
            : initialSimulationParams,
        }),

      resetStore: () =>
        set({
          nationalPension: initialNationalPension,
          basicPension: initialBasicPension,
          retirementPensions: [],
          personalPensions: [],
          pensionInsurances: [],
          simulationParams: initialSimulationParams,
        }),
    }),
    {
      name: "pensionlab-store",
      version: 2,
    }
  )
);
