import express, { Application, Request, Response } from "express";

import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config";
import { userRoutes } from "./modules/user/user.route";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFoundError } from "./middlewares/notFoundError";

const app: Application = express();


app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to FixItNow!");
});

app.use("/api/users", userRoutes);




app.use(notFoundError);
app.use(globalErrorHandler);
export default app;