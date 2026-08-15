import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.post(
  "/checkout/:bookingId",
  auth(Role.CUSTOMER),
  paymentController.createCheckoutSession,
);

router.post("/webhook", paymentController.webhookHandler);

export const paymentRoutes = router;
