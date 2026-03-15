import { Router } from "express";
import { createQuizQuestion, listQuizQuestions, submitQuizAnswer, } from "../controllers/quiz.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
export const quizRouter = Router();
quizRouter.get("/questions", requireAuth, listQuizQuestions);
quizRouter.post("/questions", requireAuth, requireAdmin, createQuizQuestion);
quizRouter.post("/answer", requireAuth, submitQuizAnswer);
