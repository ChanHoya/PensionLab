-- DropIndex
DROP INDEX "expert_content_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "SimulationScenario" ADD COLUMN     "annualMedicalExpense" INTEGER,
ADD COLUMN     "childSupportExpense" INTEGER,
ADD COLUMN     "childrenAges" TEXT,
ADD COLUMN     "childrenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentAge" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "hasSpouse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minMonthlySpending" INTEGER,
ADD COLUMN     "nonPensionAssets" INTEGER,
ADD COLUMN     "spouseAge" INTEGER,
ADD COLUMN     "targetMonthlySpending" INTEGER;
