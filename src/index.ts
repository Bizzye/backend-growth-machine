import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/user.routes";
import swaggerDocs from './swagger.json';

import 'dotenv/config';

const app = express();

app.use(express.json());

app.use(cors());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectDB();


app.use("/api/users", usersRoutes);
app.use("/api/", authRoutes);

export { app };

