import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middlewares/auth";
import { bookingController } from "./booking.controller";

const router = Router();

router.post("/", auth(Role.CUSTOMER), bookingController.createBookingCtrl);
router.get("/", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.getMyBookings);
router.get("/my-bookings", auth(Role.CUSTOMER), bookingController.getMyBookings);
router.get("/:id", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.getBookingById);
router.patch("/:id", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.updateBookingStatus);
router.delete("/:id", auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), bookingController.cancelBooking);




export const bookingRoutes = router;