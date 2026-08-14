/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripeCustomerId";
