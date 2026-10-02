import { type RequestHandler, Router } from "express";

import { validate } from "../../middlewares/validate.js";
import { authController } from "./auth.controller.js";
import { loginSchema } from "./auth.schemas.js";

export function createAuthRoutes(loginRateLimit: RequestHandler) {
  const router = Router();

  router.post("/login", loginRateLimit, validate({ body: loginSchema }), authController.login);

  return router;
}
