import { Router } from "express";
import { bookingController } from "./booking.controller";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/", auth(Role.CUSTOMER), bookingController.createBookingCtrl);




export const bookingRoutes = router;