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
            team1: { select: { id: true, name: true } },
            team2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } },
            problem: { select: { id: true, title: true, difficulty: true, timeLimit: true } },
        },
        orderBy: { startedAt: "asc" },
    });
    return res.json(matchups);
}
export async function leaderboard(_req, res) {
    const teams = await prisma.team.findMany({
        include: {
            quizScores: true,
            members: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: [{ bits: "desc" }, { updatedAt: "asc" }],
    });
    return res.json(teams.map((team) => ({
        id: team.id,
        name: team.name,
        bits: team.bits,
        status: team.status,
        quizScore: team.quizScores.reduce((acc, cur) => acc + cur.score, 0),
        members: team.members.map((member) => member.user.name),
    })));
}
