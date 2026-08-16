import Router from "express";
import { serviceController } from "./service.controller.js";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();


router.get("/", serviceController.getAllServices);
router.get("/my-services", auth(Role.ADMIN, Role.TECHNICIAN), serviceController.getMyServices);
router.post("/", auth(Role.TECHNICIAN), serviceController.createService);
router.patch("/:serviceId", auth(Role.TECHNICIAN), serviceController.updateService);
router.delete("/:serviceId", auth(Role.TECHNICIAN), serviceController.deleteService);
router.get("/admin", auth(Role.ADMIN), serviceController.getAllServicesAdmin);

export const serviceRoutes = router;
