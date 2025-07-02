// src/api/routes/userRecordingRoutes.ts

import express from 'express';
import {
    uploadUserRecording,
    getUserRecordingsMe,
    deleteUserRecording,
    getUserRecordingsForLesson 
} from '../controllers/userRecordingController';
import { authenticate } from '../../core/middlewares/authMiddleware';
import uploadAudio from '../../core/config/multerConfig'; 

const router = express.Router();

/**
 * @route 
 * @desc 
 * @access 
 */
router.post('/:lessonId', authenticate, uploadAudio.single('audioFile'), uploadUserRecording);

/**
 * @route 
 * @desc 
 * @access 
 
 */
router.get('/:lessonId/my-recordings', authenticate, getUserRecordingsForLesson);

/**
 * @route 
 * @desc 
 * @access 
 */
router.get('/me', authenticate, getUserRecordingsMe);

/**
 * @route 
 * @desc 
 * @access 
 */
router.delete('/:recordingId', authenticate, deleteUserRecording);

export default router;
