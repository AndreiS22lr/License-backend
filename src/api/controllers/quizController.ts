// src/api/controllers/quizController.ts

import { Request, Response } from "express";
import {
  createQuizService,
  deleteQuizByIdService,
  getQuizByIdService,
  getQuizListService,
  updateQuizService,
} from "../../domain/services/quizService";
import { Quiz } from "../../models/interfaces/quiz"; // Importăm interfața Quiz

// Controller pentru a crea un quiz nou
export const createQuiz = async (req: Request, res: Response) => {
  const quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'> = req.body;
  try {
    const newQuiz = await createQuizService(quizData);
    res.status(201).json({
      message: "Quiz creat cu succes!",
      data: newQuiz,
    });
  } catch (error) {
    console.error("CONTROLLER ERROR (Quiz): Eroare la crearea quiz-ului:", error);
    res.status(500).json({
      error: "A eșuat crearea quiz-ului.",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Controller pentru a obține lista tuturor quiz-urilor
export const getQuizList = async (req: Request, res: Response) => {
  try {
    const quizzes = await getQuizListService();
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("CONTROLLER ERROR (Quiz): Eroare la obținerea listei de quiz-uri:", error);
    res.status(500).json({
      error: "A eșuat obținerea listei de quiz-uri.",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Controller pentru a obține un quiz după ID
export const getQuizById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const quiz = await getQuizByIdService(id);
    res.status(200).json(quiz);
  } catch (error) {
    console.error(`CONTROLLER ERROR (Quiz): Eroare la obținerea quiz-ului cu ID ${id}:`, error);
    const statusCode = error instanceof Error && error.message.includes("nu a fost găsit") ? 404 : 500;
    res.status(statusCode).json({
      error: `A eșuat obținerea quiz-ului cu ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Controller pentru a actualiza un quiz existent
export const updateQuiz = async (req: Request, res: Response) => {
  const id = req.params.id;
  const partialQuizDto: Partial<Quiz> = req.body;
  try {
    const updatedQuiz = await updateQuizService(id, partialQuizDto);
    res.status(200).json({
      message: "Quiz actualizat cu succes!",
      data: updatedQuiz,
    });
  } catch (error) {
    console.error(`CONTROLLER ERROR (Quiz): Eroare la actualizarea quiz-ului cu ID ${id}:`, error);
    const statusCode = error instanceof Error && error.message.includes("nu a fost găsit") ? 404 : 500;
    res.status(statusCode).json({
      error: `A eșuat actualizarea quiz-ului cu ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Controller pentru a șterge un quiz
export const deleteQuizById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const deleted = await deleteQuizByIdService(id);
    res.status(200).json({
      message: "Quiz șters cu succes!",
      deleted: deleted,
    });
  } catch (error) {
    console.error(`CONTROLLER ERROR (Quiz): Eroare la ștergerea quiz-ului cu ID ${id}:`, error);
    const statusCode = error instanceof Error && error.message.includes("nu a fost găsit") ? 404 : 500;
    res.status(statusCode).json({
      error: `A eșuat ștergerea quiz-ului cu ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};