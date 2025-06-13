// src/api/routes/userCompletedQuizRoutes.ts

import { Router } from 'express';
import {
  submitQuizAnswers,
  getQuizCompletionStatus,
  getCompletedQuizzesForUser
} from '../controllers/userCompletedQuizController';

const router = Router();

router.post('/submit', submitQuizAnswers);
router.get('/status/:quizId', getQuizCompletionStatus);
router.get('/user/:userId', getCompletedQuizzesForUser);

export default router;