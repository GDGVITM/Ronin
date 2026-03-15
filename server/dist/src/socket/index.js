import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
export function createSocketServer(server) {
    const io = new Server(server, {
        cors: {
            origin: env.CLIENT_ORIGIN,
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Unauthorized"));
        }
        try {
            const payload = verifyToken(token);
            socket.data.user = payload;
            return next();
        }
        catch {
            return next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.data.user;
        socket.join(`user:${user.userId}`);
        socket.on("room:join", (room) => {
            socket.join(room);
        });
        socket.on("room:leave", (room) => {
            socket.leave(room);
        });
    });
    return io;
}
