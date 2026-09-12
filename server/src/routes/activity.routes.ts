import { Router } from "express";
import { listRecentActivitiesHandler } from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "PM", "DEVELOPER"));

router.get("/", listRecentActivitiesHandler);

export default router;
