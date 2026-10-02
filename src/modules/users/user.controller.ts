import type { Request, Response } from "express";

import type { CreateUserInput, UpdateUserInput } from "./user.schemas.js";
import { userService } from "./user.service.js";

/** HTTP adapter: translates requests into service calls. No business logic here. */
export const userController = {
  async create(req: Request<object, unknown, CreateUserInput>, res: Response) {
    const user = await userService.create(req.body);
    res.status(201).location(`/api/users/${user.id}`).json(user);
  },

  async list(_req: Request, res: Response) {
    res.json(await userService.list());
  },

  async me(req: Request, res: Response) {
    res.json(await userService.getById(req.user!.id));
  },

  async update(req: Request<{ id: string }, unknown, UpdateUserInput>, res: Response) {
    res.json(await userService.update(req.user!.id, req.params.id, req.body));
  },
};
