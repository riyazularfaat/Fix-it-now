import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/checkout/:bookingId",
  auth(Role.CUSTOMER),
  paymentController.createCheckoutSession,
);

router.post("/webhook", paymentController.webhookHandler);

export const paymentRoutes = router;
