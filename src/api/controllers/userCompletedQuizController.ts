// src/api/controllers/userCompletedQuizController.ts

import { Request, Response, NextFunction } from 'express';
import {
  submitQuizAnswersService,
  getQuizCompletionStatusService,
  getCompletedQuizzesForUserService,
  SubmitQuizAnswersDto
} from '../../domain/services/userCompletedQuizService';

/**
 * Endpoint pentru a procesa răspunsurile utilizatorului la un quiz.
 * Va primi un DTO cu ID-ul utilizatorului, ID-ul quiz-ului și răspunsurile.
 * Dacă toate răspunsurile sunt corecte, marchează quiz-ul ca fiind completat.
 */
export const submitQuizAnswers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.body.userId || "guest_user_id";

  const submitData: SubmitQuizAnswersDto = {
    userId: userId,
    quizId: req.body.quizId,
    userAnswers: req.body.userAnswers
  };

  if (!submitData.quizId || !submitData.userAnswers || typeof submitData.userAnswers !== 'object' || Object.keys(submitData.userAnswers).length === 0) {
    res.status(400).json({ message: "Date invalide. Sunt necesare quizId și userAnswers (ca un obiect non-gol)." });
    return;
  }

  try {
    const result = await submitQuizAnswersService(submitData);
    if (result.success) {
      res.status(200).json({ // ELIMINAT 'return'
        message: result.message,
        completedRecord: result.completedRecord
      });
    } else {
      res.status(400).json({ message: result.message }); // ELIMINAT 'return'
    }
  } catch (error) {
    console.error(`CONTROLLER ERROR (submitQuizAnswers): ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ // ELIMINAT 'return'
      error: "A eșuat procesarea răspunsurilor quiz-ului.",
      details: error instanceof Error ? error.message : "Eroare necunoscută"
    });
  }
};

/**
 * Endpoint pentru a verifica dacă un quiz a fost completat de un anumit utilizator.
 */
export const getQuizCompletionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { quizId } = req.params;
  const userId = req.query.userId as string || "guest_user_id";

  if (!quizId || !userId) {
    res.status(400).json({ message: "ID-ul quiz-ului și ID-ul utilizatorului sunt necesare." }); // ELIMINAT 'return'
    return; // Adăugăm un return gol pentru a opri execuția funcției
  }

  try {
    const isCompleted = await getQuizCompletionStatusService(userId, quizId);
    res.status(200).json({ // ELIMINAT 'return'
      quizId: quizId,
      userId: userId,
      isCompleted: isCompleted
    });
  } catch (error) {
    console.error(`CONTROLLER ERROR (getQuizCompletionStatus): ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ // ELIMINAT 'return'
      error: "A eșuat verificarea stării de completare a quiz-ului.",
      details: error instanceof Error ? error.message : "Eroare necunoscută"
    });
  }
};

/**
 * Endpoint pentru a obține toate quiz-urile completate de un anumit utilizator.
 */
export const getCompletedQuizzesForUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.params.userId || "guest_user_id";

  if (!userId) {
    res.status(400).json({ message: "ID-ul utilizatorului este necesar." }); // ELIMINAT 'return'
    return; // Adăugăm un return gol pentru a opri execuția funcției
  }

  try {
    const completedQuizzes = await getCompletedQuizzesForUserService(userId);
    res.status(200).json({ // ELIMINAT 'return'
      userId: userId,
      completedQuizzes: completedQuizzes
    });
  } catch (error) {
    console.error(`CONTROLLER ERROR (getCompletedQuizzesForUser): ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ // ELIMINAT 'return'
      error: "A eșuat obținerea listei de quiz-uri completate.",
      details: error instanceof Error ? error.message : "Eroare necunoscută"
    });
  }
};