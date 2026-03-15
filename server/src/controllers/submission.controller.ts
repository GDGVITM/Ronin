import { Request, Response } from "express";
import { MatchupStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { runAgainstProblem } from "../services/judging.service.js";
import { getIO } from "../socket/index.js";

export async function runCode(req: Request, res: Response) {
  try {
    const { problemId, language, code } = req.body as {
      problemId: string;
      language: string;
      code: string;
    };
    const result = await runAgainstProblem(problemId, language, code);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function submitCode(req: Request, res: Response) {
  try {
    const { problemId, language, code, matchupId } = req.body as {
      problemId: string;
      language: string;
      code: string;
      matchupId?: string;
    };

    const userId = req.auth!.userId;
    const judged = await runAgainstProblem(problemId, language, code);

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        language,
        code,
        status: judged.accepted ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
        passedTests: judged.passedTests,
        totalTests: judged.totalTests,
      },
    });

    const io = getIO();

    // If matchup provided, check for winner resolution
    if (matchupId) {
      const matchup = await prisma.matchup.findUnique({ where: { id: matchupId } });

      if (matchup && matchup.status === MatchupStatus.LIVE && !matchup.winnerId) {
        // Check if both users have submitted, or if this is an accepted solution
        const opponentId = matchup.user1Id === userId ? matchup.user2Id : matchup.user1Id;

        // Get best submissions from both users for this problem
        const myBest = await prisma.submission.findFirst({
          where: { userId, problemId, status: SubmissionStatus.ACCEPTED },
        });

        const opponentBest = await prisma.submission.findFirst({
          where: { userId: opponentId, problemId, status: SubmissionStatus.ACCEPTED },
        });

        // Determine winner: whoever has an accepted submission first
        if (myBest && !opponentBest) {
          // I solved it, opponent hasn't yet - wait for time to expire or opponent to submit
          // For now, mark as winner immediately on first accepted
          await prisma.matchup.update({
            where: { id: matchupId },
            data: {
              winnerId: userId,
              status: MatchupStatus.COMPLETED,
              endedAt: new Date(),
            },
          });

          await prisma.user.update({
            where: { id: opponentId },
            data: { eliminatedAt: new Date() },
          });

          await prisma.user.update({
            where: { id: userId },
            data: { bits: { increment: 100 } },
          });

          io.to(`matchup:${matchupId}`).emit("matchup:result", {
            matchupId,
            winnerId: userId,
            loserId: opponentId,
          });
        }
      }

      io.to(`matchup:${matchupId}`).emit("submission:result", {
        userId,
        accepted: judged.accepted,
        passedTests: judged.passedTests,
        totalTests: judged.totalTests,
      });
    }

    return res.status(201).json({
      submissionId: submission.id,
      accepted: judged.accepted,
      passedTests: judged.passedTests,
      totalTests: judged.totalTests,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function getMatchupSubmissions(req: Request, res: Response) {
  const matchupId = String(req.params.matchupId);
  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: { problem: true },
  });
  if (!matchup) {
    return res.status(404).json({ message: "Matchup not found." });
  }

  const submissions = await prisma.submission.findMany({
    where: { problemId: matchup.problemId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return res.json(submissions);
}
