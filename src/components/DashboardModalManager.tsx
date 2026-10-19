"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { DashboardModalType } from "./DashboardToolbar";
import { usePensionStore } from "@/store/usePensionStore";
import type { UserPensionContextBrief } from "@/services/interactiveAdvisorService";
import type { ShareableSnapshotData } from "@/services/shareSnapshotService";

// Dynamic imports with ssr: false for optimal bundle splitting & performance
const QuickDiagnosisModal = dynamic(() => import("./QuickDiagnosisModal"), { ssr: false });
const PersonaPresetModal = dynamic(() => import("./PersonaPresetModal"), { ssr: false });
const NpsEarlyDeferralModal = dynamic(() => import("./NpsEarlyDeferralModal"), { ssr: false });
const PrivatePensionTaxModal = dynamic(() => import("./PrivatePensionTaxModal").then(m => m.PrivatePensionTaxModal), { ssr: false });
const HealthInsuranceBillModal = dynamic(() => import("./HealthInsuranceBillModal").then(m => m.HealthInsuranceBillModal), { ssr: false });
const ReverseMortgageModal = dynamic(() => import("./ReverseMortgageModal").then(m => m.ReverseMortgageModal), { ssr: false });
const IncomeBridgeModal = dynamic(() => import("./IncomeBridgeModal").then(m => m.IncomeBridgeModal), { ssr: false });
const NpsBoostRoadmapModal = dynamic(() => import("./NpsBoostRoadmapModal").then(m => m.NpsBoostRoadmapModal), { ssr: false });
const SavingsPlanModal = dynamic(() => import("./SavingsPlanModal").then(m => m.SavingsPlanModal), { ssr: false });
const SurvivorCareModal = dynamic(() => import("./SurvivorCareModal").then(m => m.SurvivorCareModal), { ssr: false });
const IsaPensionTransferModal = dynamic(() => import("./IsaPensionTransferModal").then(m => m.IsaPensionTransferModal), { ssr: false });
const DividendStrategyModal = dynamic(() => import("./DividendStrategyModal").then(m => m.DividendStrategyModal), { ssr: false });
const PortfolioBacktestModal = dynamic(() => import("./PortfolioBacktestModal"), { ssr: false });
const DbDcTransitionModal = dynamic(() => import("./DbDcTransitionModal"), { ssr: false });
const ThreeBucketPlanModal = dynamic(() => import("./ThreeBucketPlanModal"), { ssr: false });
const PensionTransferBenefitModal = dynamic(() => import("./PensionTransferBenefitModal"), { ssr: false });
const RetirementRoadmapModal = dynamic(() => import("./RetirementRoadmapModal"), { ssr: false });
const ScenarioComparisonModal = dynamic(() => import("./ScenarioComparisonModal"), { ssr: false });
const AccountTaxMatrixModal = dynamic(() => import("./AccountTaxMatrixModal"), { ssr: false });

// Sprint 43: 실전 은퇴 가계부 & 1:1 대화형 AI 어드바이저
const CashflowTrackerModal = dynamic(() => import("./CashflowTrackerModal"), { ssr: false });
const InteractiveChatAdvisorModal = dynamic(() => import("./InteractiveChatAdvisorModal"), { ssr: false });

// Sprint 44: 세무/건보 고지서, 배당 캘린더, 가족 공유, 스트레스 테스트
const TaxAndHealthStatementModal = dynamic(() => import("./TaxAndHealthStatementModal"), { ssr: false });
const DividendCalendarModal = dynamic(() => import("./DividendCalendarModal"), { ssr: false });
const ShareSnapshotModal = dynamic(() => import("./ShareSnapshotModal"), { ssr: false });
const StressTestModal = dynamic(() => import("./StressTestModal"), { ssr: false });

interface DashboardModalManagerProps {
  activeModal: DashboardModalType;
  onClose: () => void;
  onOpenModal?: (modal: DashboardModalType) => void;
  coveredCallAsset: number;
  coveredCallDividendRate: number;
  onApplyDividendRate: (rate: number) => void;
  totalRetirementAssets?: number;
  targetMonthlySpending?: number;
  guaranteedMonthlyPension?: number;
}

export default function DashboardModalManager({
  activeModal,
  onClose,
  onOpenModal,
  coveredCallAsset,
  coveredCallDividendRate,
  onApplyDividendRate,
  totalRetirementAssets = 40000,
  targetMonthlySpending = 300,
  guaranteedMonthlyPension = 120,
}: DashboardModalManagerProps) {
  const store = usePensionStore();

  const userContext: UserPensionContextBrief = {
    currentAge: store.simulationParams.currentAge || 55,
    retirementAge: store.simulationParams.retirementAge || 60,
    yearsToRetirement: Math.max(0, (store.simulationParams.retirementAge || 60) - (store.simulationParams.currentAge || 55)),
    targetMonthlySpending: targetMonthlySpending,
    minMonthlySpending: Math.round(targetMonthlySpending * 0.7),
    monthlyNationalPension: guaranteedMonthlyPension,
    retirementPensionSavings: Math.round(totalRetirementAssets * 0.6),
    personalPensionSavings: Math.round(totalRetirementAssets * 0.4),
    liquidAssets: store.simulationParams.nonPensionAssets || 15000,
    realEstateAssets: store.simulationParams.propertyTaxBase || 50000,
    hasSpouse: store.simulationParams.hasSpouse ?? true,
    selectedStrategy: "S4 하이브리드 배당",
  };

  const handleToolNavigation = (toolId: string) => {
    if (!onOpenModal) return;
    if (toolId === "DB_DC_TRANSITION") onOpenModal("dbDcTransition");
    else if (toolId === "THREE_BUCKET_PLAN" || toolId === "THREE_BUCKET") onOpenModal("threeBucket");
    else if (toolId === "PENSION_TRANSFER") onOpenModal("pensionTransfer");
    else if (toolId === "NPS_BEP") onOpenModal("bep");
    else if (toolId === "NPS_BOOST") onOpenModal("npsBoost");
    else if (toolId === "SAVINGS_PLAN") onOpenModal("tax15");
    else if (toolId === "HEALTH_BILL" || toolId === "HEALTH_INSURANCE") onOpenModal("healthBill");
    else if (toolId === "REVERSE_MORTGAGE") onOpenModal("reverseMortgage");
    else if (toolId === "INCOME_BRIDGE") onOpenModal("incomeBridge");
    else if (toolId === "SURVIVOR_CARE") onOpenModal("survivorCare");
    else if (toolId === "ISA_TRANSFER") onOpenModal("isaTransfer");
    else if (toolId === "DIVIDEND_STRATEGY") onOpenModal("dividendStrategy");
    else if (toolId === "RETIREMENT_ROADMAP") onOpenModal("retirementRoadmap");
    else if (toolId === "SCENARIO_COMPARISON") onOpenModal("scenarioComparison");
    else if (toolId === "ACCOUNT_TAX_MATRIX") onOpenModal("accountTaxMatrix");
    else if (toolId === "CASHFLOW_TRACKER") onOpenModal("cashflowTracker");
  };

  return (
    <>
      <QuickDiagnosisModal
        isOpen={activeModal === "quickDiagnosis"}
        onClose={onClose}
      />
      <DbDcTransitionModal
        isOpen={activeModal === "dbDcTransition"}
        onClose={onClose}
      />
      <ThreeBucketPlanModal
        isOpen={activeModal === "threeBucket"}
        onClose={onClose}
        initialTotalAssets={totalRetirementAssets}
        initialTargetSpending={targetMonthlySpending}
        initialPension={guaranteedMonthlyPension}
      />
      <PensionTransferBenefitModal
        isOpen={activeModal === "pensionTransfer"}
        onClose={onClose}
      />
      <PersonaPresetModal
        isOpen={activeModal === "persona"}
        onClose={onClose}
      />
      <NpsEarlyDeferralModal
        isOpen={activeModal === "bep"}
        onClose={onClose}
      />
      <PrivatePensionTaxModal
        isOpen={activeModal === "tax15"}
        onClose={onClose}
      />
      <HealthInsuranceBillModal
        isOpen={activeModal === "healthBill"}
        onClose={onClose}
      />
      <ReverseMortgageModal
        isOpen={activeModal === "reverseMortgage"}
        onClose={onClose}
      />
      <IncomeBridgeModal
        isOpen={activeModal === "incomeBridge"}
        onClose={onClose}
      />
      <NpsBoostRoadmapModal
        isOpen={activeModal === "npsBoost"}
        onClose={onClose}
      />
      <SavingsPlanModal
        isOpen={activeModal === "savingsPlan"}
        onClose={onClose}
      />
      <SurvivorCareModal
        isOpen={activeModal === "survivorCare"}
        onClose={onClose}
      />
      <IsaPensionTransferModal
        isOpen={activeModal === "isaTransfer"}
        onClose={onClose}
      />
      <DividendStrategyModal
        isOpen={activeModal === "dividendStrategy"}
        onClose={onClose}
        currentInvestmentManwon={coveredCallAsset}
        currentDividendRate={coveredCallDividendRate}
        onApplyRate={onApplyDividendRate}
      />
      <PortfolioBacktestModal
        isOpen={activeModal === "portfolioBacktest"}
        onClose={onClose}
        defaultCapital={coveredCallAsset}
      />
      <RetirementRoadmapModal
        isOpen={activeModal === "retirementRoadmap"}
        onClose={onClose}
        onOpenTool={handleToolNavigation}
      />
      <ScenarioComparisonModal
        isOpen={activeModal === "scenarioComparison"}
        onClose={onClose}
      />
      <AccountTaxMatrixModal
        isOpen={activeModal === "accountTaxMatrix"}
        onClose={onClose}
      />

      {/* Sprint 43: 신규 모달 2종 */}
      <CashflowTrackerModal
        isOpen={activeModal === "cashflowTracker"}
        onClose={onClose}
        targetMonthlySpending={targetMonthlySpending}
        liquidAssets={store.simulationParams.nonPensionAssets || 15000}
      />
      <InteractiveChatAdvisorModal
        isOpen={activeModal === "interactiveAdvisor"}
        onClose={onClose}
        context={userContext}
        onOpenTool={handleToolNavigation}
      />

      {/* Sprint 44: 신규 모달 4종 */}
      <TaxAndHealthStatementModal
        isOpen={activeModal === "taxAndHealthStatement"}
        onClose={onClose}
        age={store.simulationParams.currentAge || 60}
        hasSpouse={store.simulationParams.hasSpouse ?? true}
        spouseAge={store.simulationParams.spouseAge || 58}
        retirementAge={store.simulationParams.retirementAge || 60}
        annualNationalPensionWon={(guaranteedMonthlyPension || 120) * 12 * 10000}
        annualRetirementPensionWon={Math.round(totalRetirementAssets * 0.6 * 0.05 * 10000)}
        annualPersonalPensionWon={Math.round(totalRetirementAssets * 0.4 * 0.05 * 10000)}
        annualFinancialWon={(store.simulationParams.financialIncome || 800) * 10000}
        propertyTaxBaseWon={(store.simulationParams.propertyTaxBase || 35000) * 10000}
      />

      <DividendCalendarModal
        isOpen={activeModal === "dividendCalendar"}
        onClose={onClose}
        coveredCallAssetManwon={coveredCallAsset}
        annualDividendRate={coveredCallDividendRate}
        targetMonthlyExpenseWon={targetMonthlySpending * 10000}
        monthlyNationalPensionWon={(guaranteedMonthlyPension || 120) * 10000}
        monthlyPrivatePensionWon={Math.round((totalRetirementAssets * 0.05 * 10000) / 12)}
      />

      <ShareSnapshotModal
        isOpen={activeModal === "shareSnapshot"}
        onClose={onClose}
        snapshotData={{
          v: 1,
          ts: Date.now(),
          ca: store.simulationParams.currentAge || 55,
          ra: store.simulationParams.retirementAge || 60,
          le: store.simulationParams.expectedLifeExpectancy || 90,
          hs: store.simulationParams.hasSpouse ?? true,
          sa: store.simulationParams.spouseAge,
          ms: targetMonthlySpending,
          np: guaranteedMonthlyPension,
          rp: Math.round(totalRetirementAssets * 0.6),
          pp: Math.round(totalRetirementAssets * 0.4),
          na: store.simulationParams.nonPensionAssets || 15000,
          re: store.simulationParams.propertyTaxBase || 50000,
          cca: coveredCallAsset,
          ccr: coveredCallDividendRate,
        }}
      />

      <StressTestModal
        isOpen={activeModal === "stressTest"}
        onClose={onClose}
        currentAge={store.simulationParams.currentAge || 55}
        retirementAge={store.simulationParams.retirementAge || 60}
        expectedLifeExpectancy={store.simulationParams.expectedLifeExpectancy || 90}
        targetMonthlySpendingWon={targetMonthlySpending * 10000}
        monthlyNationalPensionWon={(guaranteedMonthlyPension || 120) * 10000}
        totalLiquidAssetsWon={((store.simulationParams.nonPensionAssets || 15000) + totalRetirementAssets) * 10000}
        baseInflationRate={store.simulationParams.inflationRate || 2.5}
        baseNpsStartAge={store.simulationParams.nationalPensionStartAge || 65}
      />
    </>
  );
}
