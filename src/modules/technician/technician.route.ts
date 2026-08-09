import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { technicianController } from "./technician.controller";

const router = Router()

router.get('/me', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.getMyProfile);
router.get('/', auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER), technicianController.getAllTechnicians);
router.patch('/my-profile', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.updateMyProfile);
router.patch('/my-profile/password', auth(Role.TECHNICIAN), technicianController.updatePassword);
router.delete('/my-profile', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.deactivateProfile);
router.get("/my-bookings", auth(Role.TECHNICIAN, Role.ADMIN), technicianController.getMyBookings);
router.get("/my-payments", auth(Role.TECHNICIAN), technicianController.getMyPayments);
router.get("/my-reviews", auth(Role.ADMIN, Role.TECHNICIAN), technicianController.getMyReviewsReceived);
router.get("/:technicianId", auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER), technicianController.getTechnicianAvailability);
router.get("/availability-exceptions/:technicianId", auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER), technicianController.getTechnicianAvailabilityExceptions);
router.post("/my-availability", auth(Role.TECHNICIAN), technicianController.setAvailability);
router.patch("/my-availability/:slotId", auth(Role.TECHNICIAN), technicianController.updateAvailability);
router.post("/my-availability-exception", auth(Role.TECHNICIAN), technicianController.setAvailabilityException);
router.get("/my-availability-exceptions", auth(Role.TECHNICIAN), technicianController.getMyAvailabilityExceptions);
router.patch("/my-availability-exception/:exceptionId", auth(Role.TECHNICIAN), technicianController.updateAvailabilityException);
router.delete("/my-availability-exception/:exceptionId", auth(Role.TECHNICIAN), technicianController.deleteAvailabilityException);

export const technicianRoutes = router;