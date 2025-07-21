/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Team` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "blockchainProjectId" TEXT;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "createdBy",
ADD COLUMN     "tags" TEXT[];
