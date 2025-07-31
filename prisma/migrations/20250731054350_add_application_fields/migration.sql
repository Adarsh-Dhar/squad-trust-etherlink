/*
  Warnings:

  - Added the required column `deadline` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteAmount` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "quoteAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "teamExperience" TEXT,
ADD COLUMN     "teamScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "fundingAmount" DROP NOT NULL,
ALTER COLUMN "minimumStake" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "skillsRequired" DROP NOT NULL;
