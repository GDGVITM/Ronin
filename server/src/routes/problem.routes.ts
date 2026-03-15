import { Router } from "express";
import { createProblem, listProblems } from "../controllers/problem.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const problemRouter = Router();

problemRouter.get("/", listProblems);
problemRouter.post("/", requireAuth, requireAdmin, createProblem);
