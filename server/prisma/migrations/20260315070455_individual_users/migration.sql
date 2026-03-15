/*
  Warnings:

  - You are about to drop the column `team1Id` on the `Matchup` table. All the data in the column will be lost.
  - You are about to drop the column `team2Id` on the `Matchup` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `AuctionProblem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Bid` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user1Id` to the `Matchup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Id` to the `Matchup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuctionProblem" DROP CONSTRAINT "AuctionProblem_problemId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_auctionProblemId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Matchup" DROP CONSTRAINT "Matchup_team1Id_fkey";

-- DropForeignKey
ALTER TABLE "Matchup" DROP CONSTRAINT "Matchup_team2Id_fkey";

-- DropForeignKey
ALTER TABLE "Matchup" DROP CONSTRAINT "Matchup_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "QuizScore" DROP CONSTRAINT "QuizScore_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- AlterTable
ALTER TABLE "Matchup" DROP COLUMN "team1Id",
DROP COLUMN "team2Id",
ADD COLUMN     "user1Id" TEXT NOT NULL,
ADD COLUMN     "user2Id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Problem" ALTER COLUMN "starterCode" SET DEFAULT '',
ALTER COLUMN "timeLimit" SET DEFAULT 900;

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "codeSnippet" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "roundNumber" INTEGER NOT NULL DEFAULT 2,
ALTER COLUMN "timeLimit" SET DEFAULT 30,
ALTER COLUMN "points" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "teamId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eliminatedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "AuctionProblem";

-- DropTable
DROP TABLE "Bid";

-- DropTable
DROP TABLE "QuizScore";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamMember";

-- DropEnum
DROP TYPE "AuctionProblemStatus";

-- DropEnum
DROP TYPE "TeamStatus";

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchup" ADD CONSTRAINT "Matchup_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
