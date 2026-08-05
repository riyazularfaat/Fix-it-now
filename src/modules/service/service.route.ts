import Router from "express";
import { serviceController } from "./service.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();


router.get("/", auth(Role.ADMIN), serviceController.getAllServices);
router.get("/my-services", auth(Role.ADMIN, Role.TECHNICIAN), serviceController.getMyServices);
router.post("/", auth(Role.TECHNICIAN), serviceController.createService);
router.patch("/:serviceId", auth(Role.TECHNICIAN), serviceController.updateService);
router.delete("/:serviceId", auth(Role.TECHNICIAN), serviceController.deleteService);

export const serviceRoutes = router;
