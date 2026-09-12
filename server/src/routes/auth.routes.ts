import { Router } from "express";
import { login, logout, refresh } from "../controllers/auth.controller.js";
import { getCurrentUser } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginBodySchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/login", validateBody(loginBodySchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);

export default router;
