// src/api/routes/quizRoutes.ts

import { Router } from 'express';
import {
  createQuiz,
  getQuizList,
  getQuizById,
  updateQuiz,
  deleteQuizById
} from '../controllers/quizController';

const router = Router();

// Ruta pentru a crea un quiz nou
router.post('/create', createQuiz);

// Ruta pentru a obține toate quiz-urile
router.get('/list', getQuizList);

// Ruta pentru a obține un quiz după ID
router.get('/:id', getQuizById);

// Ruta pentru a actualiza un quiz după ID
router.put('/update/:id', updateQuiz);

// Ruta pentru a șterge un quiz după ID
router.delete('/delete/:id', deleteQuizById);

export default router;