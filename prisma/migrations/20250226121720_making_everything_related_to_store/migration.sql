/*
  Warnings:

  - Added the required column `storeId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Option` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
