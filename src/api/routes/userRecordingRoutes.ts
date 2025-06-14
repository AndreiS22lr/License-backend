// src/api/routes/userRecordingRoutes.ts

import express from 'express';
import {
    uploadUserRecording,
    getUserRecordingsMe,
    deleteUserRecording,
    getUserRecordingsForLesson // NOU: Importă funcția lipsă
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
 * @route GET /api/user-recordings/:lessonId/my-recordings
 * @desc Obține toate înregistrările audio ale utilizatorului autentificat pentru o lecție specifică.
 * @access Privat (necesită autentificare)
 * NOU: Această rută a fost adăugată.
 */
router.get('/:lessonId/my-recordings', authenticate, getUserRecordingsForLesson);

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
