import { AuctionProblemStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
export async function createAuctionProblem(req, res) {
    const { problemId, order } = req.body;
    const row = await prisma.auctionProblem.create({
        data: { problemId, order, status: AuctionProblemStatus.BIDDING },
        include: { problem: true },
    });
    return res.status(201).json(row);
}
export async function placeBid(req, res) {
    const { auctionProblemId, bidMinutes, isSteal } = req.body;
    const member = await prisma.teamMember.findUnique({ where: { userId: req.auth.userId } });
    if (!member) {
        return res.status(400).json({ message: "Join a team first." });
    }
    const bid = await prisma.bid.create({
        data: {
            auctionProblemId,
            teamId: member.teamId,
            bidMinutes,
            isSteal: isSteal ?? false,
        },
    });
    return res.status(201).json(bid);
}
export async function listAuctionBoard(_req, res) {
    const rows = await prisma.auctionProblem.findMany({
        include: {
            problem: true,
            bids: {
                include: { team: { select: { id: true, name: true } } },
                orderBy: { bidMinutes: "asc" },
            },
        },
        orderBy: { order: "asc" },
    });
    return res.json(rows);
}
