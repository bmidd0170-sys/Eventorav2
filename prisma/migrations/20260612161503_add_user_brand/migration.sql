-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasCompletedTutorial" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailRsvp" BOOLEAN NOT NULL DEFAULT true,
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailSecurity" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "emailConnectionsRequests" BOOLEAN NOT NULL DEFAULT true,
    "emailConnectionsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "emailTutorialComplete" BOOLEAN NOT NULL DEFAULT true,
    "emailAppUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailEventCancelled" BOOLEAN NOT NULL DEFAULT true,
    "pushRsvp" BOOLEAN NOT NULL DEFAULT true,
    "pushReminders" BOOLEAN NOT NULL DEFAULT true,
    "pushTips" BOOLEAN NOT NULL DEFAULT false,
    "pushConnectionsRequests" BOOLEAN NOT NULL DEFAULT true,
    "pushConnectionsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBrand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryColor" TEXT DEFAULT '#000000',
    "secondaryColor" TEXT DEFAULT '#FFFFFF',
    "accentColor" TEXT DEFAULT '#0066CC',
    "headingFont" TEXT DEFAULT 'Inter',
    "bodyFont" TEXT DEFAULT 'Inter',
    "logoDataUrl" TEXT,
    "defaultHeadline" TEXT,
    "defaultSubheadline" TEXT,
    "defaultCtaLabel" TEXT,
    "toneTemplate" TEXT,
    "tone" TEXT,
    "exampleSentences" TEXT,
    "personalityQuestionnaireAnswers" JSONB,
    "emailSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectedUserId" TEXT NOT NULL,
    "connectedUserName" TEXT NOT NULL,
    "connectedUserEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "fromUserName" TEXT NOT NULL,
    "fromUserEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationSettings_userId_idx" ON "UserNotificationSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBrand_userId_key" ON "UserBrand"("userId");

-- CreateIndex
CREATE INDEX "UserBrand_userId_idx" ON "UserBrand"("userId");

-- CreateIndex
CREATE INDEX "SocialConnection_userId_idx" ON "SocialConnection"("userId");

-- CreateIndex
CREATE INDEX "SocialConnection_connectedUserId_idx" ON "SocialConnection"("connectedUserId");

-- CreateIndex
CREATE INDEX "SocialConnection_status_idx" ON "SocialConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SocialConnection_userId_connectedUserId_key" ON "SocialConnection"("userId", "connectedUserId");

-- CreateIndex
CREATE INDEX "ConnectionRequest_fromUserId_idx" ON "ConnectionRequest"("fromUserId");

-- CreateIndex
CREATE INDEX "ConnectionRequest_toUserId_idx" ON "ConnectionRequest"("toUserId");

-- CreateIndex
CREATE INDEX "ConnectionRequest_status_idx" ON "ConnectionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_fromUserId_toUserId_key" ON "ConnectionRequest"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "UserNotificationSettings" ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBrand" ADD CONSTRAINT "UserBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
