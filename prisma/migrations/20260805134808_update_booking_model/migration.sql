-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "completedAt" TIMESTAMP(3),
ALTER COLUMN "cancellationReason" DROP NOT NULL;
