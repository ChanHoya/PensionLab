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

interface DashboardModalManagerProps {
  activeModal: DashboardModalType;
  onClose: () => void;
  coveredCallAsset: number;
  coveredCallDividendRate: number;
  onApplyDividendRate: (rate: number) => void;
}

export default function DashboardModalManager({
  activeModal,
  onClose,
  coveredCallAsset,
  coveredCallDividendRate,
  onApplyDividendRate,
}: DashboardModalManagerProps) {
  return (
    <>
      <QuickDiagnosisModal
        isOpen={activeModal === "quickDiagnosis"}
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
    </>
  );
}
