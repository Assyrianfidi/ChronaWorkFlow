/*
  Warnings:

  - A unique constraint covering the columns `[title,userId]` on the table `reconciliation_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_reports_title_userId_key" ON "reconciliation_reports"("title", "userId");
