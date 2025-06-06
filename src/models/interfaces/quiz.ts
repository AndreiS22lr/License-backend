// src/models/interfaces/quiz.ts

// Interfața pentru o singură întrebare dintr-un quiz
export interface QuizQuestion {
  questionText: string;
  options: string[]; // Răspunsurile posibile
  correctAnswer: string;
    imageUrl?: string; 
   // Răspunsul corect (trebuie să se potrivească cu una din 'options')
  // Poți adăuga și alte proprietăți, ex: type: 'multiple-choice' | 'true-false', difficulty: number etc.
}

// Interfața principală pentru un Quiz
export interface Quiz {
  id?: string; // ID-ul generat de MongoDB
  title: string;
  description?: string; // O scurtă descriere a quiz-ului
  questions: QuizQuestion[]; // Array-ul de întrebări pentru acest quiz
  createdAt?: Date;
  updatedAt?: Date;
}