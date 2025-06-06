// src/domain/services/userCompletedQuizService.ts

import * as userCompletedQuizRepository from '../repositories/userCompletedQuizRepository';
import { getQuizById } from '../repositories/quizRepository'; // Avem nevoie de quiz pentru a verifica răspunsurile corecte
import { UserCompletedQuiz } from '../../models/interfaces/quizResult';
import { QuizQuestion } from '../../models/interfaces/quiz'; // Pentru tipul întrebărilor

// Interfața pentru DTO-ul (Data Transfer Object) de intrare de la frontend
// Acesta va conține ID-ul quiz-ului și răspunsurile utilizatorului
export interface SubmitQuizAnswersDto {
  userId: string;
  quizId: string;
  userAnswers: Array<{
    questionText: string; // Textul întrebării
    chosenAnswer: string; // Răspunsul ales de utilizator
    imageUrl?: string;    // Opțional, dacă întrebarea a avut o imagine
  }>;
}

/**
 * Procesează răspunsurile utilizatorului la un quiz, validează și marchează quiz-ul ca fiind completat.
 * Returnează true dacă quiz-ul a fost completat cu succes (toate răspunsurile corecte), false altfel.
 */
export const submitQuizAnswersService = async (
  submitData: SubmitQuizAnswersDto
): Promise<{ success: boolean; message: string; completedRecord?: UserCompletedQuiz }> => {
  const { userId, quizId, userAnswers } = submitData;

  try {
    // 1. Preia quiz-ul complet din baza de date pentru a verifica răspunsurile corecte
    const quiz = await getQuizById(quizId);

    if (!quiz) {
      throw new Error(`Quiz-ul cu ID ${quizId} nu a fost găsit.`);
    }

    if (!quiz.questions || quiz.questions.length === 0) {
        return { success: false, message: "Quiz-ul nu conține întrebări." };
    }

    // 2. Validează răspunsurile utilizatorului
    let allAnswersCorrect = true;
    const correctAnswersMap = new Map<string, string>(); // Mapează textul întrebării la răspunsul corect

    // Populează harta cu răspunsurile corecte
    quiz.questions.forEach(q => {
        correctAnswersMap.set(q.questionText, q.correctAnswer);
    });

    for (const userAnswer of userAnswers) {
      const expectedCorrectAnswer = correctAnswersMap.get(userAnswer.questionText);

      if (expectedCorrectAnswer === undefined) {
          // Dacă întrebarea din răspunsul utilizatorului nu există în quiz-ul nostru, e o problemă
          console.warn(`SERVICE WARNING: Întrebare "${userAnswer.questionText}" din răspunsurile utilizatorului nu a fost găsită în quiz-ul ID ${quizId}.`);
          // Putem alege să tratăm acest caz ca o greșeală, sau să îl ignorăm.
          // Pentru simplitate, considerăm că dacă nu există întrebarea, nu e corect.
          allAnswersCorrect = false;
          break;
      }

      // Compară răspunsul utilizatorului (case-insensitive și fără spații extra, pentru robustețe)
      if (userAnswer.chosenAnswer.trim().toLowerCase() !== expectedCorrectAnswer.trim().toLowerCase()) {
        allAnswersCorrect = false;
        break; // O singură greșeală e suficientă pentru a nu marca quiz-ul ca "trecut"
      }
    }

    // 3. Dacă toate răspunsurile sunt corecte, marchează quiz-ul ca fiind completat
    if (allAnswersCorrect) {
      const completedRecord = await userCompletedQuizRepository.markQuizAsCompleted(userId, quizId);
      if (completedRecord) {
        return { success: true, message: "Quiz completat cu succes!", completedRecord };
      } else {
        return { success: false, message: "Quiz-ul a fost completat, dar înregistrarea nu a putut fi salvată sau a existat deja." };
      }
    } else {
      return { success: false, message: "Răspunsuri incorecte. Quiz-ul nu a fost completat cu succes." };
    }

  } catch (error) {
    console.error("SERVICE ERROR (submitQuizAnswers):", error);
    throw new Error("A eșuat procesarea răspunsurilor quiz-ului.");
  }
};

/**
 * Preia starea de completare a unui quiz pentru un utilizator specific.
 */
export const getQuizCompletionStatusService = async (
  userId: string,
  quizId: string
): Promise<boolean> => {
  try {
    const completed = await userCompletedQuizRepository.getCompletionStatusForQuiz(userId, quizId);
    return completed !== null; // Returnează true dacă există o înregistrare de completare
  } catch (error) {
    console.error(`SERVICE ERROR (getQuizCompletionStatus): Eroare la obținerea stării de completare pentru quiz-ul ${quizId} și utilizatorul ${userId}:`, error);
    throw new Error("A eșuat obținerea stării de completare a quiz-ului.");
  }
};

/**
 * Preia toate quiz-urile completate de un anumit utilizator.
 * Utile pentru a afișa o listă generală a progresului.
 */
export const getCompletedQuizzesForUserService = async (
  userId: string
): Promise<UserCompletedQuiz[]> => {
  try {
    const completedQuizzes = await userCompletedQuizRepository.getCompletedQuizzesForUser(userId);
    return completedQuizzes;
  } catch (error) {
    console.error(`SERVICE ERROR (getCompletedQuizzesForUser): Eroare la obținerea quiz-urilor completate pentru utilizatorul ${userId}:`, error);
    throw new Error("A eșuat obținerea quiz-urilor completate de utilizator.");
  }
};