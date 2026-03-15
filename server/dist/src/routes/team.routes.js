import { Router } from "express";
import { createMyTeam, fetchMyTeam, joinMyTeam } from "../controllers/team.controller.js";
import { requireAuth } from "../middleware/auth.js";
export const teamRouter = Router();
teamRouter.use(requireAuth);
teamRouter.get("/me", fetchMyTeam);
teamRouter.post("/create", createMyTeam);
teamRouter.post("/join", joinMyTeam);
