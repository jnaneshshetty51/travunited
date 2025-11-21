-- AlterTable
ALTER TABLE "Visa" ADD COLUMN     "stayDurationDays" INTEGER,
ADD COLUMN     "validityDays" INTEGER,
ADD COLUMN     "govtFee" INTEGER,
ADD COLUMN     "serviceFee" INTEGER,
ADD COLUMN     "currency" TEXT DEFAULT 'INR';

