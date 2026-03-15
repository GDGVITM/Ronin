import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { startRound } from "../services/round.service.js";
export async function listPendingUsers(_req, res) {
    const users = await prisma.user.findMany({
        where: { status: UserStatus.PENDING, role: "PARTICIPANT" },
        select: {
            id: true,
            name: true,
            email: true,
            college: true,
            status: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    return res.json(users);
}
export async function updateUserApproval(req, res) {
    const { userId } = req.params;
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    if (status !== "APPROVED" && status !== "REJECTED") {
        return res.status(400).json({ message: "Invalid status." });
    }
    const user = await prisma.user.update({
        where: { id: String(userId) },
        data: { status: status },
        select: { id: true, email: true, status: true },
    });
    return res.json(user);
}
export async function adminStartRound(req, res) {
    try {
        const { roundNumber } = req.body;
        const eventState = await startRound(roundNumber);
        return res.json({ message: `Round ${roundNumber} started.`, eventState });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
