import { Router } from "express";
import { createAuctionProblem, listAuctionBoard, placeBid, } from "../controllers/auction.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
export const auctionRouter = Router();
auctionRouter.get("/board", requireAuth, listAuctionBoard);
auctionRouter.post("/problem", requireAuth, requireAdmin, createAuctionProblem);
auctionRouter.post("/bid", requireAuth, placeBid);
