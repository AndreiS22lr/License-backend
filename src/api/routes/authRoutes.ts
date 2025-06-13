// src/api/routes/authRoutes.ts

import express from 'express'; // <-- SCHIMBAT AICI
import { register, login } from '../controllers/authController';

const router = express.Router(); // <-- AICI NU SE SCHIMBĂ NIMIC, DAR ACUM FOLOSEȘTE express.Router()

/**
 * @route POST /api/auth/register
 * @desc Înregistrează un nou utilizator.
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Autentifică un utilizator și returnează un token JWT.
 * @access Public
 */
router.post('/login', login);

export default router;