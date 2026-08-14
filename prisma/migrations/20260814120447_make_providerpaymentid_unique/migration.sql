/*
  Warnings:

  - A unique constraint covering the columns `[providerPaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");
