/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeCustomerId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "stripeCustomerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeCustomerId_key" ON "payments"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
