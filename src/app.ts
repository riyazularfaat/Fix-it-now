import express, { Application, Request, Response } from "express";

import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config";
import { customerRoutes} from "./modules/customer/customer.route";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFoundError } from "./middlewares/notFoundError";
import { authRoutes } from "./modules/auth/auth.route";
import { technicianRoutes } from "./modules/technician/technician.route";
import { bookingRoutes } from "./modules/booking/booking.route";
import { serviceRoutes } from "./modules/service/service.route";

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

app.use("/api/customers", customerRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);




app.use(notFoundError);
app.use(globalErrorHandler);
export default app;