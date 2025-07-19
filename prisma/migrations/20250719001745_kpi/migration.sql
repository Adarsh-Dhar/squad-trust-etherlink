/*
  Warnings:

  - Added the required column `updatedAt` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'FAILED', 'AT_RISK');

-- CreateEnum
CREATE TYPE "KPICategory" AS ENUM ('DEVELOPMENT', 'GROWTH', 'COMMUNITY', 'FUNDING', 'SECURITY', 'PARTNERSHIP');

-- CreateEnum
CREATE TYPE "DifficultyTier" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('AUTOMATED_ORACLE', 'MANUAL_VERIFICATION', 'COMMUNITY_VOTE', 'AUDIT_REPORT');

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "achievedValue" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "difficulty" "DifficultyTier",
ADD COLUMN     "kpi" TEXT,
ADD COLUMN     "kpiCategory" "KPICategory",
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "oracleSource" TEXT,
ADD COLUMN     "stakeCurrency" TEXT,
ADD COLUMN     "stakedAmount" DOUBLE PRECISION,
ADD COLUMN     "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "targetValue" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verificationMethod" TEXT;

-- CreateTable
CREATE TABLE "MilestoneVerification" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "verificationType" "VerificationType" NOT NULL,
    "dataSource" TEXT,
    "verifiedValue" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleDataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "contractAddress" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPITemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "KPICategory" NOT NULL,
    "kpis" JSONB NOT NULL,
    "difficulty" "DifficultyTier" NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPITemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneVerification_milestoneId_verifierId_verificationTy_key" ON "MilestoneVerification"("milestoneId", "verifierId", "verificationType");

-- AddForeignKey
ALTER TABLE "MilestoneVerification" ADD CONSTRAINT "MilestoneVerification_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneVerification" ADD CONSTRAINT "MilestoneVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
