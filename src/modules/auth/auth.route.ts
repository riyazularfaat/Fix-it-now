import Router from 'express';
import { authController } from './auth.controller';


const router = Router();

router.post('/register', authController.createUser);
router.post('/login', authController.userLogin);
router.post('/admin', authController.adminLogin);
router.post('/refresh-token', authController.refreshToken);

export const authRoutes = router;