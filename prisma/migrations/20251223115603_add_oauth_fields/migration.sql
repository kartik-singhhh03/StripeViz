/*
  Warnings:

  - A unique constraint covering the columns `[oauthProvider,oauthProviderId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "oauthProviderId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_oauthProvider_oauthProviderId_idx" ON "User"("oauthProvider", "oauthProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthProvider_oauthProviderId_key" ON "User"("oauthProvider", "oauthProviderId");
