import { Router } from "express";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
  unreadNotificationCountHandler,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateParams } from "../middleware/validate.middleware.js";
import { notificationIdParamsSchema } from "../validators/notification.validators.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "PM", "DEVELOPER"));

router.get("/", listNotificationsHandler);
router.get("/unread-count", unreadNotificationCountHandler);
router.patch("/read-all", markAllNotificationsReadHandler);
router.patch(
  "/:id/read",
  validateParams(notificationIdParamsSchema),
  markNotificationReadHandler,
);

export default router;
