import { Router } from "express";
import { runCode, submitCode, getMatchupSubmissions } from "../controllers/submission.controller.js";
import { requireAuth } from "../middleware/auth.js";
export const submissionRouter = Router();
submissionRouter.use(requireAuth);
submissionRouter.post("/run", runCode);
submissionRouter.post("/submit", submitCode);
submissionRouter.get("/matchup/:matchupId", getMatchupSubmissions);
