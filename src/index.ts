import express from "express";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/user.routes";

const app = express();

connectDB();

app.use(express.json());

app.use("/api/users", usersRoutes);
app.use("/api/", authRoutes);

export { app };

