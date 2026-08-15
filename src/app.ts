import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config/index.js";
import { customerRoutes} from "./modules/customer/customer.route.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFoundError } from "./middlewares/notFoundError.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { technicianRoutes } from "./modules/technician/technician.route.js";
import { bookingRoutes } from "./modules/booking/booking.route.js";
import { serviceRoutes } from "./modules/service/service.route.js";
import { categoryRoutes } from "./modules/category/category.route.js";
import { paymentRoutes } from "./modules/payment/payment.route.js";

const app: Application = express();


app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
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
app.use("/api/categories", categoryRoutes);
app.use("/api/payment", paymentRoutes);




app.use(notFoundError);
app.use(globalErrorHandler);
export default app;