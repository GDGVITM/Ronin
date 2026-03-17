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
    // Guard: check if this round already has LIVE matchups
    if (roundNumber === 1 || roundNumber === 2) {
        const existingLive = await prisma.matchup.count({
            where: { roundNumber, status: MatchupStatus.LIVE },
        });
        if (existingLive > 0) {
            throw new Error(`Round ${roundNumber} already has ${existingLive} active matchup(s). Reset the round first before restarting.`);
        }
    }
    // Get approved, non-eliminated participants
    const users = await prisma.user.findMany({
        where: {
            role: "PARTICIPANT",
            status: "APPROVED",
            eliminatedAt: null,
        },
    });
    if (users.length < 2 && (roundNumber === 1 || roundNumber === 2)) {
        throw new Error("Need at least 2 active participants to start round.");
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
        const list = shuffle(users);
        const pairings = [];
        for (let i = 0; i + 1 < list.length; i += 2) {
            pairings.push({
                user1Id: list[i].id,
                user2Id: list[i + 1].id,
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
    // Round 3 is MVP - no matchups needed, just display problems
    return prisma.eventState.findUnique({ where: { id: "singleton" } });
}
export async function resetRound(roundNumber) {
    // Delete all matchups for this round (any status)
    const deleted = await prisma.matchup.deleteMany({
        where: { roundNumber },
    });
    // Un-eliminate any users who were eliminated in matchups of this round
    // (find users eliminated by matchups from this round)
    // Reset eliminatedAt for users who lost in this round
    await prisma.user.updateMany({
        where: {
            role: "PARTICIPANT",
            eliminatedAt: { not: null },
        },
        data: { eliminatedAt: null },
    });
    // Reset event state
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: { currentRound: roundNumber, roundStatus: RoundStatus.NOT_STARTED },
        create: { id: "singleton", currentRound: roundNumber, roundStatus: RoundStatus.NOT_STARTED },
    });
    return { deleted: deleted.count };
}
