import { MatchupStatus, RoundStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export async function startRound(roundNumber) {
    const approvedTeams = await prisma.team.findMany({
        where: { status: "ACTIVE" },
        include: { members: true },
    });
    if (approvedTeams.length < 2) {
        throw new Error("Need at least 2 active teams to start round.");
    }
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: { currentRound: roundNumber, roundStatus: RoundStatus.LIVE },
        create: { id: "singleton", currentRound: roundNumber, roundStatus: RoundStatus.LIVE },
    });
    if (roundNumber === 1 || roundNumber === 2) {
        const problems = await prisma.problem.findMany({ where: { roundNumber } });
        if (problems.length === 0) {
            throw new Error(`No problems configured for round ${roundNumber}.`);
        }
        const list = shuffle(approvedTeams);
        const pairings = [];
        for (let i = 0; i + 1 < list.length; i += 2) {
            pairings.push({
                team1Id: list[i].id,
                team2Id: list[i + 1].id,
                problemId: problems[Math.floor(Math.random() * problems.length)].id,
                roundNumber,
                status: MatchupStatus.LIVE,
                startedAt: new Date(),
            });
        }
        if (pairings.length > 0) {
            await prisma.matchup.createMany({ data: pairings });
        }
    }
    return prisma.eventState.findUnique({ where: { id: "singleton" } });
}
