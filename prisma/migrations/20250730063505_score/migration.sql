-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('HACKATHON', 'STARTUP', 'ENTERPRISE');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "actualCost" DOUBLE PRECISION,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "projectType" "ProjectType" DEFAULT 'STARTUP';

-- CreateTable
CREATE TABLE "UserScoreData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectsShipped" INTEGER NOT NULL DEFAULT 0,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "budgetAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "abandonedProjects" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastDecayApplied" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inactiveMonths" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserScoreData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectScoreData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL DEFAULT 'STARTUP',
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "budgetAccuracy" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "completionTime" INTEGER,
    "memberScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectScoreData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneConfirmation" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timelinessScore" DOUBLE PRECISION,
    "delayDays" INTEGER,
    "onTimeRateImpact" DOUBLE PRECISION,

    CONSTRAINT "MilestoneConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAbandonmentVote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "ProjectAbandonmentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "commitCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserScoreData_userId_key" ON "UserScoreData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectScoreData_projectId_key" ON "ProjectScoreData"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneConfirmation_milestoneId_userId_key" ON "MilestoneConfirmation"("milestoneId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAbandonmentVote_projectId_userId_key" ON "ProjectAbandonmentVote"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OracleVerification_requestId_key" ON "OracleVerification"("requestId");

-- AddForeignKey
ALTER TABLE "UserScoreData" ADD CONSTRAINT "UserScoreData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectScoreData" ADD CONSTRAINT "ProjectScoreData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneConfirmation" ADD CONSTRAINT "MilestoneConfirmation_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneConfirmation" ADD CONSTRAINT "MilestoneConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAbandonmentVote" ADD CONSTRAINT "ProjectAbandonmentVote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAbandonmentVote" ADD CONSTRAINT "ProjectAbandonmentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleVerification" ADD CONSTRAINT "OracleVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
