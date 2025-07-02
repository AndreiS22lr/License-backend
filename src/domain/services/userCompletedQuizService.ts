// src/domain/services/userCompletedQuizService.ts

import * as userCompletedQuizRepository from '../repositories/userCompletedQuizRepository';
import { getQuizById } from '../repositories/quizRepository'; 
import { UserCompletedQuiz } from '../../models/interfaces/quizResult';
import { QuizQuestion } from '../../models/interfaces/quiz'; 


export interface SubmitQuizAnswersDto {
  userId: string;
  quizId: string;
  
  userAnswers: { [key: string]: string };
}


export const submitQuizAnswersService = async (
  submitData: SubmitQuizAnswersDto
): Promise<{ success: boolean; message: string; completedRecord?: UserCompletedQuiz }> => {
  const { userId, quizId, userAnswers } = submitData;

  try {
    
    const quiz = await getQuizById(quizId);

    if (!quiz) {
      return { success: false, message: `Quiz-ul cu ID ${quizId} nu a fost găsit.` };
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return { success: false, message: "Quiz-ul nu conține întrebări." };
    }

    
    let allAnswersCorrect = true;
    let correctCount = 0;

    

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const userAnswerKey = i.toString(); 
      const chosenAnswer = userAnswers[userAnswerKey];

      
      if (chosenAnswer === undefined || chosenAnswer === null) {
        console.warn(`SERVICE WARNING: Răspuns lipsă pentru întrebarea cu index ${i} din quiz-ul ${quizId}.`);
        allAnswersCorrect = false; 
        break;
      }

      
      if (chosenAnswer.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase()) {
        allAnswersCorrect = false;
        
      } else {
        correctCount++;
      }
    }

    
    if (allAnswersCorrect) {
      const completedRecord = await userCompletedQuizRepository.markQuizAsCompleted(userId, quizId);
      if (completedRecord) {
        return { success: true, message: "Quiz completat cu succes! Toate răspunsurile sunt corecte.", completedRecord };
      } else {
        return { success: false, message: "Quiz-ul a fost completat, dar înregistrarea nu a putut fi salvată sau a existat deja." };
      }
    } else {
      
      return { success: false, message: `Răspunsuri incorecte. Ai răspuns corect la ${correctCount} din ${quiz.questions.length} întrebări. Quiz-ul nu a fost completat cu succes.` };
    }

  } catch (error) {
    console.error("SERVICE ERROR (submitQuizAnswers):", error);
    
    return { success: false, message: "A eșuat procesarea răspunsurilor quiz-ului din cauza unei erori interne." };
  }
};


export const getQuizCompletionStatusService = async (
  userId: string,
  quizId: string
): Promise<boolean> => {
  try {
    const completed = await userCompletedQuizRepository.getCompletionStatusForQuiz(userId, quizId);
    return completed !== null; 
  } catch (error) {
    console.error(`SERVICE ERROR (getQuizCompletionStatus): Eroare la obținerea stării de completare pentru quiz-ul ${quizId} și utilizatorul ${userId}:`, error);
    
    throw new Error("A eșuat obținerea stării de completare a quiz-ului.");
  }
};


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