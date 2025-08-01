/*
  Warnings:

  - A unique constraint covering the columns `[onchainTeamId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "onchainTeamId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_onchainTeamId_key" ON "Team"("onchainTeamId");
