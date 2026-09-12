import { Router } from "express";
import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createProjectBodySchema,
  projectIdParamsSchema,
  updateProjectBodySchema,
} from "../validators/project.validators.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "PM"));

router.get("/", listProjectsHandler);
router.post("/", validateBody(createProjectBodySchema), createProjectHandler);
router.get(
  "/:id",
  validateParams(projectIdParamsSchema),
  getProjectHandler,
);
router.patch(
  "/:id",
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectBodySchema),
  updateProjectHandler,
);

export default router;
