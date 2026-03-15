import { prisma } from "../config/prisma.js";
export async function createQuizQuestion(req, res) {
    const { questionText, options, correctIndex, timeLimit, points } = req.body;
    const question = await prisma.quizQuestion.create({
        data: { questionText, options, correctIndex, timeLimit, points },
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
    const isCorrect = selectedIndex === question.correctIndex;
    const pointsEarned = isCorrect ? Math.max(0, question.points - responseTime) : 0;
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
    return res.status(201).json(response);
}
