import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { userController } from "./user.controller.js";
import { createUserSchema, updateUserSchema, userIdParamsSchema } from "./user.schemas.js";

export const userRoutes = Router();

userRoutes.post("/", validate({ body: createUserSchema }), userController.create);
userRoutes.get("/", authenticate, userController.list);
userRoutes.get("/me", authenticate, userController.me);
userRoutes.patch(
  "/:id",
  authenticate,
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  userController.update,
);
