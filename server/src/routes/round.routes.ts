import { Router } from "express";
import { getEventState, getRoundMatchups, getRoundProblems, leaderboard } from "../controllers/round.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const roundRouter = Router();

roundRouter.get("/event-state", getEventState);
roundRouter.get("/:roundNumber/matchups", requireAuth, getRoundMatchups);
roundRouter.get("/:roundNumber/problems", requireAuth, getRoundProblems);
roundRouter.get("/leaderboard/global", leaderboard);
