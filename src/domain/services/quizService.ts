// src/domain/services/quizService.ts

import { Quiz } from "../../models/interfaces/quiz";
import * as quizRepository from "../repositories/quizRepository"; 


export const createQuizService = async (
  quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Quiz> => {
  try {
    const newQuiz = await quizRepository.createQuiz(quizData);
    return newQuiz;
  } catch (error) {
    console.error("SERVICE ERROR (Quiz): Eroare la crearea quiz-ului:", error);
    throw new Error("A eșuat crearea quiz-ului.");
  }
};


export const getQuizListService = async (): Promise<Quiz[]> => {
  try {
    const quizzes = await quizRepository.getQuizList();
    return quizzes;
  } catch (error) {
    console.error("SERVICE ERROR (Quiz): Eroare la obținerea listei de quiz-uri:", error);
    throw new Error("A eșuat obținerea listei de quiz-uri.");
  }
};


export const getQuizByIdService = async (id: string): Promise<Quiz | null> => {
  try {
    const quiz = await quizRepository.getQuizById(id);
    if (!quiz) {
      throw new Error(`Quiz-ul cu ID ${id} nu a fost găsit.`);
    }
    return quiz;
  } catch (error) {
    console.error(`SERVICE ERROR (Quiz): Eroare la obținerea quiz-ului cu ID ${id}:`, error);
    throw error; 
  }
};


export const updateQuizService = async (
  id: string,
  partialQuiz: Partial<Quiz>
): Promise<Quiz | null> => {
  try {
    const updatedQuiz = await quizRepository.updateQuiz(id, partialQuiz);
    if (!updatedQuiz) {
      throw new Error(`Quiz-ul cu ID ${id} nu a fost găsit sau nu a putut fi actualizat.`);
    }
    return updatedQuiz;
  } catch (error) {
    console.error(`SERVICE ERROR (Quiz): Eroare la actualizarea quiz-ului cu ID ${id}:`, error);
    throw error;
  }
};


export const deleteQuizByIdService = async (id: string): Promise<boolean> => {
  try {
    const deleted = await quizRepository.deleteQuizById(id);
    if (!deleted) {
      throw new Error(`Quiz-ul cu ID ${id} nu a fost găsit sau nu a putut fi șters.`);
    }
    return deleted;
  } catch (error) {
    console.error(`SERVICE ERROR (Quiz): Eroare la ștergerea quiz-ului cu ID ${id}:`, error);
    throw error;
  }
};


export const getQuizByLessonIdService = async (lessonId: string): Promise<Quiz | null> => {
  try {
    const quiz = await quizRepository.getQuizByLessonId(lessonId);
    
    return quiz;
  } catch (error) {
    console.error(`SERVICE ERROR (Quiz): Eroare la obținerea quiz-ului pentru lessonId ${lessonId}:`, error);
    throw error;
  }
};