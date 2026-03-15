import { Router } from "express";
import {
  adminStartRound,
  listPendingUsers,
  updateUserApproval,
} from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/pending-users", listPendingUsers);
adminRouter.patch("/users/:userId", updateUserApproval);
adminRouter.post("/start-round", adminStartRound);
