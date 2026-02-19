-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ReconciliationReport" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "totalInvoices" DOUBLE PRECISION NOT NULL,
    "totalPayments" DOUBLE PRECISION NOT NULL,
    "discrepancies" INTEGER NOT NULL,
    "summary" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationReport_pkey" PRIMARY KEY ("id")
);
