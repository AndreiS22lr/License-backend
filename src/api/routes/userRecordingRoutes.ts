// src/api/routes/userRecordingRoutes.ts

import express from 'express';
import {
    uploadUserRecording,
    getUserRecordingsMe,
    deleteUserRecording
} from '../controllers/userRecordingController';
import { authenticate } from '../../core/middlewares/authMiddleware';
import uploadAudio from '../../core/config/multerConfig'; // Multer configurat pentru înregistrări audio utilizator

const router = express.Router();

/**
 * @route POST /api/user-recordings/:lessonId
 * @desc Încarcă o înregistrare audio a utilizatorului pentru o anumită lecție.
 * @access Privat (necesită autentificare)
 */
router.post('/:lessonId', authenticate, uploadAudio.single('audioFile'), uploadUserRecording);

/**
 * @route GET /api/user-recordings/me
 * @desc Obține toate înregistrările audio ale utilizatorului autentificat.
 * @access Privat (necesită autentificare)
 */
router.get('/me', authenticate, getUserRecordingsMe);

/**
 * @route DELETE /api/user-recordings/:recordingId
 * @desc Șterge o înregistrare audio a utilizatorului.
 * @access Privat (necesită autentificare, doar proprietarul poate șterge)
 */
router.delete('/:recordingId', authenticate, deleteUserRecording);

export default router;
