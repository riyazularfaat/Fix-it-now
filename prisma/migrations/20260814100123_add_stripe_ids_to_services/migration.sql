/*
  Warnings:

  - A unique constraint covering the columns `[stripeProductId]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceId]` on the table `services` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "services" ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "services_stripeProductId_key" ON "services"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "services_stripePriceId_key" ON "services"("stripePriceId");
