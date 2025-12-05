/*
  Warnings:

  - The primary key for the `ReconciliationReport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `businessId` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `discrepancies` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `fromDate` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `reportDate` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `toDate` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `totalInvoices` on the `ReconciliationReport` table. All the data in the column will be lost.
  - You are about to drop the column `totalPayments` on the `ReconciliationReport` table. All the data in the column will be lost.
  - The `id` column on the `ReconciliationReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `amount` to the `ReconciliationReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `ReconciliationReport` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `ReconciliationReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ReconciliationReport" DROP CONSTRAINT "ReconciliationReport_pkey",
DROP COLUMN "businessId",
DROP COLUMN "createdBy",
DROP COLUMN "discrepancies",
DROP COLUMN "fromDate",
DROP COLUMN "reportDate",
DROP COLUMN "summary",
DROP COLUMN "toDate",
DROP COLUMN "totalInvoices",
DROP COLUMN "totalPayments",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ADD CONSTRAINT "ReconciliationReport_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "public"."ReconciliationStatus";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
