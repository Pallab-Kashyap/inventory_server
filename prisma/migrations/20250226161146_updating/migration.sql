/*
  Warnings:

  - Added the required column `nestingName` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nestingName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "baseCategoryId" TEXT;

-- CreateIndex
CREATE INDEX "Product_productName_idx" ON "Product"("productName");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_baseCategoryId_fkey" FOREIGN KEY ("baseCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
