import { Router } from "express";
import {
  assignTaskHandler,
  createTaskHandler,
  getTaskHandler,
  listTasksHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
} from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import {
  assignTaskBodySchema,
  createTaskBodySchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "../validators/task.validators.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "PM", "DEVELOPER"));

router.get("/", validateQuery(listTasksQuerySchema), listTasksHandler);
router.post("/", validateBody(createTaskBodySchema), createTaskHandler);
router.patch(
  "/:id/assign",
  validateParams(taskIdParamsSchema),
  validateBody(assignTaskBodySchema),
  assignTaskHandler,
);
router.patch(
  "/:id/status",
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskStatusBodySchema),
  updateTaskStatusHandler,
);
router.get("/:id", validateParams(taskIdParamsSchema), getTaskHandler);
router.patch(
  "/:id",
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskBodySchema),
  updateTaskHandler,
);

export default router;
