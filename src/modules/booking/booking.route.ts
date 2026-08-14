import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middlewares/auth";
import { bookingController } from "./booking.controller";

const router = Router();

router.post("/", auth(Role.CUSTOMER), bookingController.createBookingCtrl);
router.get("/check-availability", auth(Role.CUSTOMER), bookingController.checkAvailability);
router.get("/", auth(Role.CUSTOMER, Role.TECHNICIAN), bookingController.getMyBookings);
router.patch("/:bookingId", auth(Role.TECHNICIAN), bookingController.updateBookingStatus);
router.delete("/:bookingId", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.cancelBooking);
router.get("/:bookingId", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.getBookingById);




export const bookingRoutes = router;
