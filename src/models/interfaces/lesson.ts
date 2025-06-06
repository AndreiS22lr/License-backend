import { Quiz } from './quiz';

export interface Lesson {
  id?: string; // MongoDB va genera automat un ID
  title: string;
  order: number;
  theoryContent: string;
  sheetMusicImageUrl?: string; // O variabilă opțională
  audioUrl?: string; // O variabilă opțională
  createdAt?: Date; // Data la care a fost creată lecția
  updatedAt?: Date; // Data la care a fost ultima dată actualizată lecția
  quizIds?: string[];
  quizzes?: Quiz[];
}