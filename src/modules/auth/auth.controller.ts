import type { Request, Response } from "express";

import type { LoginInput } from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const authController = {
  async login(req: Request<object, unknown, LoginInput>, res: Response) {
    res.json(await authService.login(req.body));
  },
};
