// src/api/routes/authRoutes.ts

import express from 'express'; 
import { register, login } from '../controllers/authController';

const router = express.Router(); 

/**
 * @route 
 * @desc 
 * @access 
 */
router.post('/register', register);

/**
 * @route 
 * @desc 
 * @access 
 */
router.post('/login', login);

export default router;