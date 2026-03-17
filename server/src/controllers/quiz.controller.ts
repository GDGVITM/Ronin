import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { getIO } from "../socket/index.js";
import {
  getCurrentRound2QuestionState,
  isRound2QuestionPushed,
  markRound2QuestionPushed,
} from "../services/quiz-push-state.service.js";

export async function createQuizQuestion(req: Request, res: Response) {
  const { questionText, codeSnippet, options, correctIndex, timeLimit, points, roundNumber } =
    req.body as {
      questionText: string;
      codeSnippet?: string;
      options: string[];
      correctIndex: number;
      timeLimit: number;
      points: number;
      roundNumber?: number;
    };

  const question = await prisma.quizQuestion.create({
    data: {
      questionText,
      codeSnippet: codeSnippet ?? "",
      options,
      correctIndex,
      timeLimit,
      points,
      roundNumber: roundNumber ?? 2,
    },
  });
  return res.status(201).json(question);
}

export async function listQuizQuestions(_req: Request, res: Response) {
  const questions = await prisma.quizQuestion.findMany({ orderBy: { createdAt: "asc" } });
  const filtered = questions.filter((q) => !(q.roundNumber === 2 && isRound2QuestionPushed(q.id)));
  return res.json(filtered);
}

export async function submitQuizAnswer(req: Request, res: Response) {
  const { questionId, selectedIndex, responseTime } = req.body as {
    questionId: string;
    selectedIndex: number;
    responseTime: number;
  };

  const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    return res.status(404).json({ message: "Question not found." });
  }

  const existing = await prisma.quizResponse.findFirst({
    where: { userId: req.auth!.userId, questionId },
  });

  const isCorrect = selectedIndex === question.correctIndex;
  const pointsEarned = isCorrect
    ? Math.round(
        question.points * 0.6 +
          question.points *
            0.4 *
            Math.max(0, 1 - responseTime / (question.timeLimit * 1000))
      )
    : 0;

  const response = existing
    ? await prisma.quizResponse.update({
        where: { id: existing.id },
        data: {
          selectedIndex,
          isCorrect,
          responseTime,
          pointsEarned,
        },
      })
    : await prisma.quizResponse.create({
        data: {
          userId: req.auth!.userId,
          questionId,
          selectedIndex,
          isCorrect,
          responseTime,
          pointsEarned,
        },
      });

  // Keep bits in sync when a participant changes answer before timeout.
  const delta = pointsEarned - (existing?.pointsEarned ?? 0);
  if (delta !== 0) {
    await prisma.user.update({
      where: { id: req.auth!.userId },
      data: { bits: { increment: delta } },
    });
  }

  const io = getIO();
  io.to(`user:${req.auth!.userId}`).emit("quiz:answer-ack", {
    questionId,
    isCorrect,
    pointsEarned,
    correctIndex: question.correctIndex,
  });

  return res.status(existing ? 200 : 201).json({
    responseId: response.id,
    questionId,
    isCorrect,
    pointsEarned,
    correctIndex: question.correctIndex,
  });
}

export async function pushQuestion(req: Request, res: Response) {
  const { questionId } = req.body as { questionId: string };

  const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    return res.status(404).json({ message: "Question not found." });
  }

  if (question.roundNumber === 2 && isRound2QuestionPushed(question.id)) {
    return res.status(400).json({ message: "Question already pushed. Reset round 2 to reuse." });
  }

  const payload: CurrentRound2Question = {
    id: question.id,
    questionText: question.questionText,
    codeSnippet: question.codeSnippet,
    options: question.options,
    timeLimit: question.timeLimit,
    points: question.points,
    pushedAt: new Date().toISOString(),
  };

  markRound2QuestionPushed(payload);

  const io = getIO();
  io.emit("round2:question", payload);

  return res.json({ message: "Question pushed." });
}

export async function getCurrentRound2Question(_req: Request, res: Response) {
  return res.json(getCurrentRound2QuestionState());
}

export async function getQuizLeaderboard(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: "PARTICIPANT", status: "APPROVED" },
    include: { quizResponses: true },
    orderBy: { bits: "desc" },
  });

  const leaderboard = users.map((u) => ({
    userId: u.id,
    userName: u.name,
    totalQuizPoints: u.quizResponses.reduce((sum, r) => sum + r.pointsEarned, 0),
    bits: u.bits,
  }));

  leaderboard.sort((a, b) => b.totalQuizPoints - a.totalQuizPoints);
  return res.json(leaderboard);
}
