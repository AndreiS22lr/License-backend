export interface UserCompletedQuiz {
  id?: string;        // ID-ul generat de MongoDB
  userId: string;     // ID-ul utilizatorului care a completat quiz-ul
  quizId: string;     // ID-ul quiz-ului care a fost completat
  completedAt: Date;  // Data și ora la care a fost completat cu succes
}