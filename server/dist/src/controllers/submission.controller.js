import { MatchupStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { runAgainstProblem } from "../services/judging.service.js";
import { getIO } from "../socket/index.js";
export async function runCode(req, res) {
    try {
        const { problemId, language, code } = req.body;
        const result = await runAgainstProblem(problemId, language, code);
        return res.json(result);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function submitCode(req, res) {
    try {
        const { problemId, language, code, matchupId } = req.body;
        const userId = req.auth.userId;
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
            if (!matchup) {
                return res.status(404).json({ message: "Matchup not found." });
            }
            if (matchup.user1Id !== userId && matchup.user2Id !== userId) {
                return res.status(403).json({ message: "You are not part of this matchup." });
            }
            if (matchup.problemId !== problemId) {
                return res.status(400).json({ message: "Submitted problem does not match matchup problem." });
            }
            if (matchup && matchup.status === MatchupStatus.LIVE && !matchup.winnerId) {
                const opponentId = matchup.user1Id === userId ? matchup.user2Id : matchup.user1Id;
                if (judged.accepted) {
                    // Claim victory in a single transaction so winner update and bits award stay consistent.
                    const result = await prisma.$transaction(async (tx) => {
                        const endedAt = new Date();
                        const claim = await tx.matchup.updateMany({
                            where: {
                                id: matchupId,
                                status: MatchupStatus.LIVE,
                                winnerId: null,
                            },
                            data: {
                                winnerId: userId,
                                status: MatchupStatus.COMPLETED,
                                endedAt,
                            },
                        });
                        if (claim.count === 0) {
                            return null;
                        }
                        await tx.user.update({
                            where: { id: opponentId },
                            data: { eliminatedAt: endedAt },
                        });
                        await tx.user.update({
                            where: { id: userId },
                            data: { bits: { increment: 100 } },
                        });
                        return { winnerId: userId, loserId: opponentId };
                    });
                    if (result) {
                        io.to(`matchup:${matchupId}`).emit("matchup:result", {
                            matchupId,
                            winnerId: result.winnerId,
                            loserId: result.loserId,
                        });
                    }
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
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function getMatchupSubmissions(req, res) {
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
