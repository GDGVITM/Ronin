import { prisma } from "../config/prisma.js";
import { getIO } from "../socket/index.js";
export async function createQuizQuestion(req, res) {
    const { questionText, codeSnippet, options, correctIndex, timeLimit, points, roundNumber } = req.body;
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
export async function listQuizQuestions(_req, res) {
    const questions = await prisma.quizQuestion.findMany({ orderBy: { createdAt: "asc" } });
    return res.json(questions);
}
export async function submitQuizAnswer(req, res) {
    const { questionId, selectedIndex, responseTime } = req.body;
    const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found." });
    }
    // Prevent duplicate answers
    const existing = await prisma.quizResponse.findFirst({
        where: { userId: req.auth.userId, questionId },
    });
    if (existing) {
        return res.status(400).json({ message: "Already answered this question." });
    }
    const isCorrect = selectedIndex === question.correctIndex;
    const pointsEarned = isCorrect
        ? Math.round(question.points * 0.6 +
            question.points *
                0.4 *
                Math.max(0, 1 - responseTime / (question.timeLimit * 1000)))
        : 0;
    const response = await prisma.quizResponse.create({
        data: {
            userId: req.auth.userId,
            questionId,
            selectedIndex,
            isCorrect,
            responseTime,
            pointsEarned,
        },
    });
    // Update user bits
    if (pointsEarned > 0) {
        await prisma.user.update({
            where: { id: req.auth.userId },
            data: { bits: { increment: pointsEarned } },
        });
    }
    const io = getIO();
    io.to(`user:${req.auth.userId}`).emit("quiz:answer-ack", {
        questionId,
        isCorrect,
        pointsEarned,
        correctIndex: question.correctIndex,
    });
    return res.status(201).json(response);
}
export async function pushQuestion(req, res) {
    const { questionId } = req.body;
    const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found." });
    }
    const io = getIO();
    io.to("round2").emit("round2:question", {
        id: question.id,
        questionText: question.questionText,
        codeSnippet: question.codeSnippet,
        options: question.options,
        timeLimit: question.timeLimit,
        points: question.points,
    });
    return res.json({ message: "Question pushed." });
}
export async function getQuizLeaderboard(_req, res) {
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
