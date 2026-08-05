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




export const technicianRoutes = router;