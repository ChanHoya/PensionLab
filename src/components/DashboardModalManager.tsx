"use client";

import React from "react";
import type { DashboardModalType } from "./DashboardToolbar";
import QuickDiagnosisModal from "./QuickDiagnosisModal";
import PersonaPresetModal from "./PersonaPresetModal";
import NpsEarlyDeferralModal from "./NpsEarlyDeferralModal";
import { PrivatePensionTaxModal } from "./PrivatePensionTaxModal";
import { HealthInsuranceBillModal } from "./HealthInsuranceBillModal";
import { ReverseMortgageModal } from "./ReverseMortgageModal";
import { IncomeBridgeModal } from "./IncomeBridgeModal";
import { NpsBoostRoadmapModal } from "./NpsBoostRoadmapModal";
import { SavingsPlanModal } from "./SavingsPlanModal";
import { SurvivorCareModal } from "./SurvivorCareModal";
import { IsaPensionTransferModal } from "./IsaPensionTransferModal";
import { DividendStrategyModal } from "./DividendStrategyModal";
import PortfolioBacktestModal from "./PortfolioBacktestModal";
import DbDcTransitionModal from "./DbDcTransitionModal";
import ThreeBucketPlanModal from "./ThreeBucketPlanModal";
import PensionTransferBenefitModal from "./PensionTransferBenefitModal";
import RetirementRoadmapModal from "./RetirementRoadmapModal";
import ScenarioComparisonModal from "./ScenarioComparisonModal";
import AccountTaxMatrixModal from "./AccountTaxMatrixModal";

interface DashboardModalManagerProps {
  activeModal: DashboardModalType;
  onClose: () => void;
  onOpenModal?: (modal: DashboardModalType) => void;
  coveredCallAsset: number;
  coveredCallDividendRate: number;
  onApplyDividendRate: (rate: number) => void;
  // 은퇴 자산 및 월 생활비 컨텍스트 (3-Bucket 및 갈아타기 연동용)
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
        onOpenTool={(toolId) => {
          if (!onOpenModal) return;
          if (toolId === "DB_DC_TRANSITION") onOpenModal("dbDcTransition");
          else if (toolId === "THREE_BUCKET_PLAN") onOpenModal("threeBucket");
          else if (toolId === "PENSION_TRANSFER") onOpenModal("pensionTransfer");
          else if (toolId === "NPS_BEP") onOpenModal("bep");
          else if (toolId === "NPS_BOOST") onOpenModal("npsBoost");
          else if (toolId === "SAVINGS_PLAN") onOpenModal("tax15");
          else if (toolId === "HEALTH_BILL") onOpenModal("healthBill");
          else if (toolId === "REVERSE_MORTGAGE") onOpenModal("reverseMortgage");
          else if (toolId === "INCOME_BRIDGE") onOpenModal("incomeBridge");
          else if (toolId === "SURVIVOR_CARE") onOpenModal("survivorCare");
          else if (toolId === "ISA_TRANSFER") onOpenModal("isaTransfer");
          else if (toolId === "DIVIDEND_STRATEGY") onOpenModal("dividendStrategy");
        }}
      />
      <ScenarioComparisonModal
        isOpen={activeModal === "scenarioComparison"}
        onClose={onClose}
      />
      <AccountTaxMatrixModal
        isOpen={activeModal === "accountTaxMatrix"}
        onClose={onClose}
      />
    </>
  );
}
