/*
  Warnings:

  - The `isVarified` column on the `technician_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `availabilities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VerifiedStatus" AS ENUM ('VERIFIED', 'PENDING', 'UNVERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_technicianId_fkey";

-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "isVarified",
ADD COLUMN     "isVarified" "VerifiedStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "availabilities";

-- DropEnum
DROP TYPE "VarifiedStatus";
