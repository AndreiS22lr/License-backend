export interface UserCompletedQuiz {
  id?: string;        
  userId: string;     
  quizId: string;     
  completedAt: Date;  
}