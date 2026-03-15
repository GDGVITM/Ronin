import { customAlphabet } from "nanoid";
import { prisma } from "../config/prisma.js";
const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export async function createTeam(ownerUserId, name) {
    const ownerMember = await prisma.teamMember.findUnique({ where: { userId: ownerUserId } });
    if (ownerMember) {
        throw new Error("User is already in a team.");
    }
    return prisma.team.create({
        data: {
            name,
            inviteCode: code(),
            members: {
                create: {
                    userId: ownerUserId,
                },
            },
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });
}
export async function joinTeam(userId, inviteCode) {
    const existing = await prisma.teamMember.findUnique({ where: { userId } });
    if (existing) {
        throw new Error("User is already in a team.");
    }
    const team = await prisma.team.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
        include: { members: true },
    });
    if (!team) {
        throw new Error("Invalid invite code.");
    }
    if (team.members.length >= 2) {
        throw new Error("Team is already full.");
    }
    await prisma.teamMember.create({ data: { userId, teamId: team.id } });
    return prisma.team.findUnique({
        where: { id: team.id },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });
}
export async function getMyTeam(userId) {
    const member = await prisma.teamMember.findUnique({
        where: { userId },
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, email: true, status: true } },
                        },
                    },
                },
            },
        },
    });
    return member?.team ?? null;
}
