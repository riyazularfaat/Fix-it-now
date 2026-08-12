/*
  Warnings:

  - You are about to drop the column `isVarified` on the `technician_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "isVarified",
ADD COLUMN     "isVerified" "VerifiedStatus" NOT NULL DEFAULT 'PENDING';
