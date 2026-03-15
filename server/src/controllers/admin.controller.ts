import { Request, Response } from "express";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { startRound } from "../services/round.service.js";
import { getIO } from "../socket/index.js";

export async function listPendingUsers(_req: Request, res: Response) {
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

export async function updateUserApproval(req: Request, res: Response) {
  const { userId } = req.params;
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (status !== "APPROVED" && status !== "REJECTED") {
    return res.status(400).json({ message: "Invalid status." });
  }

  const user = await prisma.user.update({
    where: { id: String(userId) },
    data: { status: status as UserStatus },
    select: { id: true, email: true, status: true },
  });

  return res.json(user);
}

export async function adminStartRound(req: Request, res: Response) {
  try {
    const { roundNumber } = req.body as { roundNumber: number };
    const eventState = await startRound(roundNumber);

    const io = getIO();
    io.emit("round:started", { roundNumber, eventState });

    return res.json({ message: `Round ${roundNumber} started.`, eventState });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}
