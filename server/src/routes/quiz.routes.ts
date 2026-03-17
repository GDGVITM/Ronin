import { Router } from "express";
import {
  createQuizQuestion,
  getCurrentRound2Question,
  listQuizQuestions,
  submitQuizAnswer,
  pushQuestion,
  getQuizLeaderboard,
} from "../controllers/quiz.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const quizRouter = Router();

quizRouter.get("/questions", requireAuth, listQuizQuestions);
quizRouter.post("/questions", requireAuth, requireAdmin, createQuizQuestion);
quizRouter.post("/answer", requireAuth, submitQuizAnswer);
quizRouter.post("/push-question", requireAuth, requireAdmin, pushQuestion);
quizRouter.get("/current-question", requireAuth, getCurrentRound2Question);
quizRouter.get("/leaderboard", requireAuth, getQuizLeaderboard);
