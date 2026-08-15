import Router from "express";
import { authController } from "./auth.controller.js";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import { bookingController } from "../booking/booking.controller.js";

const router = Router();

router.post("/register", authController.createUser);
router.post("/login", authController.userLogin);
router.post("/admin", authController.adminLogin);
router.get("/users", auth(Role.ADMIN), authController.getAllUsers);
router.patch("/users/:userId", auth(Role.ADMIN), authController.toggleUserStatus);
router.patch("/technicians/:technicianId", auth(Role.ADMIN), authController.verifyTechnician);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/booking/all", auth(Role.ADMIN), bookingController.getAllBookings);

export const authRoutes = router;
