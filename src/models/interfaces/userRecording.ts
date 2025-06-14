// src/models/interfaces/userRecording.ts

import { ObjectId } from 'mongodb';

/**
 * Interfața pentru o înregistrare audio făcută de un utilizator.
 * Aceasta este stocată separat de înregistrarea audio a lecției (admin).
 */
export interface UserRecording {
  _id?: ObjectId; // ID-ul intern MongoDB
  id?: string;    // ID-ul public, sub formă de string (opțional, pentru conveniență)
  userId: string; // ID-ul utilizatorului care a făcut înregistrarea
  lessonId: string; // ID-ul lecției la care se referă înregistrarea
  audioUrl: string; // Calea URL către fișierul audio încărcat de utilizator (ex: /uploads/audio_recordings/nume_fisier.mp3)
  createdAt: Date;
  updatedAt: Date;
}