import { prisma } from "../config/prisma.js";
export async function getEventState(_req, res) {
    const event = await prisma.eventState.findUnique({ where: { id: "singleton" } });
    return res.json(event);
}
export async function getRoundMatchups(req, res) {
    const roundNumber = Number(req.params.roundNumber);
    const matchups = await prisma.matchup.findMany({
        where: { roundNumber },
        include: {
            user1: { select: { id: true, name: true } },
            user2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } },
            problem: { select: { id: true, title: true, difficulty: true, timeLimit: true } },
        },
        orderBy: { startedAt: "desc" },
    });
    return res.json(matchups);
}
export async function leaderboard(_req, res) {
    const users = await prisma.user.findMany({
        where: { role: "PARTICIPANT", status: "APPROVED" },
        orderBy: [{ bits: "desc" }, { updatedAt: "asc" }],
        select: {
            id: true,
            name: true,
            college: true,
            bits: true,
            eliminatedAt: true,
        },
    });
    return res.json(users.map((u) => ({
        id: u.id,
        name: u.name,
        college: u.college,
        bits: u.bits,
        eliminated: !!u.eliminatedAt,
    })));
}
export async function getRoundProblems(req, res) {
    const roundNumber = Number(req.params.roundNumber);
    const problems = await prisma.problem.findMany({
        where: { roundNumber },
        select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            starterCode: true,
            timeLimit: true,
        },
        orderBy: { createdAt: "asc" },
    });
    return res.json(problems);
}
