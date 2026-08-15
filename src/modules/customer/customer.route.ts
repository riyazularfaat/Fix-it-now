import Router from 'express';
import { userController } from './customer.controller.js';
import { auth } from '../../middlewares/auth.js';
import { Role } from '../../../generated/prisma/enums.js';

const router = Router();

// router.post('/register', userController.createUser);
router.get('/technicians', auth(Role.ADMIN, Role.CUSTOMER), userController.getAllTechnicians);
router.get('/me', auth(Role.ADMIN, Role.CUSTOMER), userController.getMyProfile);
router.patch('/my-profile', auth(Role.CUSTOMER), userController.updateMyProfile);
router.patch('/my-profile/password', auth(Role.CUSTOMER), userController.updatePassword);
router.delete('/my-profile', auth(Role.ADMIN, Role.CUSTOMER), userController.deactivateProfile);
router.post('/create-review', auth(Role.CUSTOMER), userController.createReview);



export const customerRoutes = router;