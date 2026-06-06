-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalPension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contributionMonths" INTEGER NOT NULL,
    "totalPaidAmount" DECIMAL(15,2) NOT NULL,
    "currentStandardMonthlyIncome" DECIMAL(15,2) NOT NULL,
    "expectedTotalContributionMonths" INTEGER NOT NULL,
    "expectedMonthlyPension" DECIMAL(15,2) NOT NULL,
    "totalExpectedPremium" DECIMAL(15,2) NOT NULL,
    "basicPensionAmount" DECIMAL(15,2) NOT NULL,
    "aValue" DECIMAL(15,2) NOT NULL,
    "bValue" DECIMAL(15,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalPension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasicPension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdType" TEXT NOT NULL,
    "recognizedIncome" DECIMAL(15,2) NOT NULL,
    "expectedEligibility" BOOLEAN NOT NULL,
    "expectedMonthlyAmount" DECIMAL(15,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasicPension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetirementPension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pensionType" TEXT NOT NULL,
    "avgSalary" DECIMAL(15,2),
    "yearsOfService" INTEGER,
    "salaryGrowthRate" DECIMAL(5,2),
    "totalAccumulated" DECIMAL(15,2),
    "monthlyContribution" DECIMAL(15,2),
    "companyMatchRate" DECIMAL(15,2),
    "expectedReturnRate" DECIMAL(5,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetirementPension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalPensionSavings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savingsType" TEXT NOT NULL,
    "totalAccumulated" DECIMAL(15,2) NOT NULL,
    "monthlyAnnualContribution" DECIMAL(15,2) NOT NULL,
    "desiredStartAge" INTEGER NOT NULL,
    "receivingPeriod" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalPensionSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PensionInsurance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "totalAccumulated" DECIMAL(15,2) NOT NULL,
    "monthlyPayment" DECIMAL(15,2) NOT NULL,
    "paymentPeriod" INTEGER NOT NULL,
    "expectedDeclaredRate" DECIMAL(5,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PensionInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "retirementAge" INTEGER NOT NULL,
    "expectedLifeExpectancy" INTEGER NOT NULL,
    "inflationRate" DECIMAL(5,2) NOT NULL,
    "nationalPensionStartAge" INTEGER NOT NULL,
    "customParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertContent" (
    "id" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "transcript" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertContent_pkey" PRIMARY KEY ("id")
);

-- Create HNSW index for pgvector cosine similarity search
CREATE INDEX IF NOT EXISTS expert_content_embedding_hnsw_idx ON "ExpertContent" USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NationalPension_userId_key" ON "NationalPension"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BasicPension_userId_key" ON "BasicPension"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertContent_videoId_key" ON "ExpertContent"("videoId");

-- AddForeignKey
ALTER TABLE "NationalPension" ADD CONSTRAINT "NationalPension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasicPension" ADD CONSTRAINT "BasicPension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetirementPension" ADD CONSTRAINT "RetirementPension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPensionSavings" ADD CONSTRAINT "PersonalPensionSavings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensionInsurance" ADD CONSTRAINT "PensionInsurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
