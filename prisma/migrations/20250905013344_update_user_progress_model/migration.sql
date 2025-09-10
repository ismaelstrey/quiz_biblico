/*
  Warnings:

  - You are about to drop the column `currentLevel` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivity` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `quizzesCompleted` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `streak` on the `user_progress` table. All the data in the column will be lost.
  - You are about to drop the column `totalScore` on the `user_progress` table. All the data in the column will be lost.
  - Added the required column `levelId` to the `user_progress` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "bestPercentage" REAL NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_progress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_user_progress" ("id", "userId") SELECT "id", "userId" FROM "user_progress";
DROP TABLE "user_progress";
ALTER TABLE "new_user_progress" RENAME TO "user_progress";
CREATE UNIQUE INDEX "user_progress_userId_levelId_key" ON "user_progress"("userId", "levelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
