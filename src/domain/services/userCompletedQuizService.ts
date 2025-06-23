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
  // MODIFICARE AICI: userAnswers este acum un obiect cu chei de tip string (indexuri) și valori de tip string (răspunsuri alese)
  userAnswers: { [key: string]: string };
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
      // Throw new Error(`Quiz-ul cu ID ${quizId} nu a fost găsit.`); // S-a modificat pentru a returna un mesaj specific
      return { success: false, message: `Quiz-ul cu ID ${quizId} nu a fost găsit.` };
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return { success: false, message: "Quiz-ul nu conține întrebări." };
    }

    // 2. Validează răspunsurile utilizatorului
    let allAnswersCorrect = true;
    let correctCount = 0;

    // Aici va trebui să ne asigurăm că întrebările din quiz vin într-o ordine deterministă
    // sau că avem o modalitate de a mapa răspunsurile user-ului la întrebările corecte.
    // Presupunem că userAnswers sunt indexate numeric (0, 1, 2...) și corespund cu quiz.questions indexate.
    // De exemplu: userAnswers['0'] corespunde quiz.questions[0].correctAnswer
    // userAnswers['1'] corespunde quiz.questions[1].correctAnswer

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const userAnswerKey = i.toString(); // Cheia din obiectul userAnswers va fi "0", "1", "2", etc.
      const chosenAnswer = userAnswers[userAnswerKey];

      // Verificăm dacă utilizatorul a furnizat un răspuns pentru această întrebare
      if (chosenAnswer === undefined || chosenAnswer === null) {
        console.warn(`SERVICE WARNING: Răspuns lipsă pentru întrebarea cu index ${i} din quiz-ul ${quizId}.`);
        allAnswersCorrect = false; // Considerăm că un răspuns lipsă înseamnă incorect
        break;
      }

      // Compară răspunsul utilizatorului (case-insensitive și fără spații extra, pentru robustețe)
      // Asigură-te că `question.correctAnswer` este disponibil și corect!
      if (chosenAnswer.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase()) {
        allAnswersCorrect = false;
        // Nu mai facem break imediat pentru a putea număra răspunsurile corecte chiar dacă nu toate sunt
        // Dacă vrei să oprești la prima greșeală, poți adăuga 'break;' aici
      } else {
        correctCount++;
      }
    }

    // 3. Dacă toate răspunsurile sunt corecte, marchează quiz-ul ca fiind completat
    if (allAnswersCorrect) {
      const completedRecord = await userCompletedQuizRepository.markQuizAsCompleted(userId, quizId);
      if (completedRecord) {
        return { success: true, message: "Quiz completat cu succes! Toate răspunsurile sunt corecte.", completedRecord };
      } else {
        return { success: false, message: "Quiz-ul a fost completat, dar înregistrarea nu a putut fi salvată sau a existat deja." };
      }
    } else {
      // Mesaj mai informativ dacă nu toate răspunsurile sunt corecte
      return { success: false, message: `Răspunsuri incorecte. Ai răspuns corect la ${correctCount} din ${quiz.questions.length} întrebări. Quiz-ul nu a fost completat cu succes.` };
    }

  } catch (error) {
    console.error("SERVICE ERROR (submitQuizAnswers):", error);
    // Este important să nu expui detalii interne ale erorii clientului.
    // Poți arunca o eroare generică sau un mesaj mai specific.
    return { success: false, message: "A eșuat procesarea răspunsurilor quiz-ului din cauza unei erori interne." };
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
    // Aruncă o eroare specifică serviciului pentru a fi gestionată de controller
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
    // Aruncă o eroare specifică serviciului pentru a fi gestionată de controller
    throw new Error("A eșuat obținerea quiz-urilor completate de utilizator.");
  }
};