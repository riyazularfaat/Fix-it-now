import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import { technicianController } from "./technician.controller.js";

const router = Router()

router.get('/me', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.getMyProfile);
router.patch('/my-profile', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.updateMyProfile);
router.patch('/my-profile/password', auth(Role.TECHNICIAN), technicianController.updatePassword);
router.delete('/my-profile', auth(Role.ADMIN, Role.TECHNICIAN), technicianController.deactivateProfile);
router.get("/my-payments", auth(Role.TECHNICIAN), technicianController.getMyPayments);
router.get("/my-reviews", auth(Role.ADMIN, Role.TECHNICIAN), technicianController.getMyReviewsReceived);
router.get("/availability-exceptions/:technicianId", auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER), technicianController.getTechnicianAvailabilityExceptions);
router.post("/my-availability-exception", auth(Role.TECHNICIAN), technicianController.setAvailabilityException);
router.get("/my-availability-exceptions", auth(Role.TECHNICIAN), technicianController.getMyAvailabilityExceptions);
router.patch("/my-availability-exception/:exceptionId", auth(Role.TECHNICIAN), technicianController.updateAvailabilityException);
router.delete("/my-availability-exception/:exceptionId", auth(Role.TECHNICIAN), technicianController.deleteAvailabilityException);
router.patch("/my-professional-data", auth(Role.TECHNICIAN), technicianController.updateProfessionalData);
export const technicianRoutes = router;