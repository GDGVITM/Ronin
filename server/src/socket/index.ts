import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function createSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { userId: string; role: string };
    socket.join(`user:${user.userId}`);

    socket.on("room:join", (room: string) => {
      socket.join(room);
    });

    socket.on("room:leave", (room: string) => {
      socket.leave(room);
    });

    socket.on("auction:code", (data: { auctionProblemId: string; code: string; teamId?: string }) => {
      io!.to(`auction:${data.auctionProblemId}`).emit("auction:live-code", {
        userId: user.userId,
        teamId: data.teamId,
        code: data.code,
      });
    });
  });

  return io;
}
