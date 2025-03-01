/*
  Warnings:

  - You are about to drop the column `variationId` on the `OptionValue` table. All the data in the column will be lost.
  - Added the required column `optionId` to the `OptionValue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OptionValue" DROP CONSTRAINT "OptionValue_variationId_fkey";

-- AlterTable
ALTER TABLE "OptionValue" DROP COLUMN "variationId",
ADD COLUMN     "optionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "OptionValue" ADD CONSTRAINT "OptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
