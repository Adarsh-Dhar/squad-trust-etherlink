/*
  Warnings:

  - The `role` column on the `TeamMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "role",
ADD COLUMN     "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER';
