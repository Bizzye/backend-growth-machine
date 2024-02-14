import { Router } from "express";
import { createUser, listUsers, updateUser } from "../controllers/user";

import protect from "../middlewares/auth";

const usersRoutes = Router();

usersRoutes.post("/", createUser);

usersRoutes.get("/", listUsers);

usersRoutes.put("/:id", protect, updateUser);

export default usersRoutes;