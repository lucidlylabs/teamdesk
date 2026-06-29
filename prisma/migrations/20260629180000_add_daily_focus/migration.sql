-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE_PERFECT');

-- CreateTable
CREATE TABLE "FocusSettings" (
    "id" TEXT NOT NULL,
    "northStar" TEXT,
    "weekGoal" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FocusSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyFocus" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "recap" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyFocus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusItem" (
    "id" TEXT NOT NULL,
    "focusId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "owner" TEXT,
    "revenueWhy" TEXT NOT NULL,
    "perfectWhen" TEXT NOT NULL,
    "status" "FocusStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FocusItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyFocus_date_key" ON "DailyFocus"("date");

-- CreateIndex
CREATE INDEX "DailyFocus_date_idx" ON "DailyFocus"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FocusItem_focusId_rank_key" ON "FocusItem"("focusId", "rank");

-- AddForeignKey
ALTER TABLE "FocusItem" ADD CONSTRAINT "FocusItem_focusId_fkey" FOREIGN KEY ("focusId") REFERENCES "DailyFocus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
