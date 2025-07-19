-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProjectSignature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "signatures" JSONB NOT NULL,
    "requiredSignatures" INTEGER NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSignature" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "signatures" JSONB NOT NULL,
    "requiredSignatures" INTEGER NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "status" "SignatureStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSignature_projectId_key" ON "ProjectSignature"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSignature_milestoneId_key" ON "TaskSignature"("milestoneId");

-- AddForeignKey
ALTER TABLE "ProjectSignature" ADD CONSTRAINT "ProjectSignature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSignature" ADD CONSTRAINT "TaskSignature_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
