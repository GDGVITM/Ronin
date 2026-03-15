import { SubmissionStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { runAgainstProblem } from "../services/judging.service.js";
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
        const { problemId, language, code } = req.body;
        const member = await prisma.teamMember.findUnique({
            where: { userId: req.auth.userId },
            include: { team: true },
        });
        if (!member) {
            return res.status(400).json({ message: "Join a team first." });
        }
        const judged = await runAgainstProblem(problemId, language, code);
        const submission = await prisma.submission.create({
            data: {
                teamId: member.teamId,
                problemId,
                language,
                code,
                status: judged.accepted ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
                passedTests: judged.passedTests,
                totalTests: judged.totalTests,
            },
        });
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
