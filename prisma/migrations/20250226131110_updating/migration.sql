/*
  Warnings:

  - You are about to drop the column `name` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `OptionValue` table. All the data in the column will be lost.
  - Added the required column `optionName` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `optionValue` to the `OptionValue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Option" DROP COLUMN "name",
ADD COLUMN     "optionName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OptionValue" DROP COLUMN "name",
ADD COLUMN     "optionValue" TEXT NOT NULL;
