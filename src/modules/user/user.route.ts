import Router from 'express';
import { userController } from './user.controller';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

// router.post('/register', userController.createUser);
router.get('/', auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), userController.getAllUsers);
router.get('/me', auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), userController.getMyProfile);
router.put('/my-profile', auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN), userController.updateMyProfile);



export const userRoutes = router;