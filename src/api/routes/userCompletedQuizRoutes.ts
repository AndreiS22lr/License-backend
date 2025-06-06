// src/api/routes/userCompletedQuizRoutes.ts

import { Router } from 'express';
// Ensure these are imported as named exports directly
import {
  submitQuizAnswers,
  getQuizCompletionStatus,
  getCompletedQuizzesForUser
} from '../controllers/userCompletedQuizController';

const router = Router();

// Route to submit quiz answers and mark as completed if correct
// POST /api/quiz-results/submit
router.post('/submit', submitQuizAnswers);

// Route to get the completion status of a specific quiz for a user
// GET /api/quiz-results/status/:quizId?userId=...
router.get('/status/:quizId', getQuizCompletionStatus);

// Route to get all completed quizzes for a specific user
// GET /api/quiz-results/user/:userId
router.get('/user/:userId', getCompletedQuizzesForUser);

export default router;