-- CreateTable
CREATE TABLE "InvestorSignature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fundingId" TEXT NOT NULL,
    "investorAddress" TEXT NOT NULL,
    "signatures" JSONB NOT NULL,
    "requiredSignatures" INTEGER NOT NULL,
    "totalInvestors" INTEGER NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneInvestorSignature" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investorAddress" TEXT NOT NULL,
    "signatures" JSONB NOT NULL,
    "requiredSignatures" INTEGER NOT NULL,
    "totalInvestors" INTEGER NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneInvestorSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorSignature_fundingId_key" ON "InvestorSignature"("fundingId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneInvestorSignature_milestoneId_key" ON "MilestoneInvestorSignature"("milestoneId");

-- AddForeignKey
ALTER TABLE "InvestorSignature" ADD CONSTRAINT "InvestorSignature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSignature" ADD CONSTRAINT "InvestorSignature_fundingId_fkey" FOREIGN KEY ("fundingId") REFERENCES "Funding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneInvestorSignature" ADD CONSTRAINT "MilestoneInvestorSignature_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneInvestorSignature" ADD CONSTRAINT "MilestoneInvestorSignature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
