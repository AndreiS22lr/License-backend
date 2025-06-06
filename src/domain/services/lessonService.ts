// src/domain/services/lessonService.ts

import { Lesson } from "../../models/interfaces/lesson";
import * as lessonRepository from "../repositories/lessonRepository"; // Importăm toate funcțiile din lessonRepository

export const createLessonService = async (
  // NOU: Excludem 'quizzes' și de la creare, deoarece ele sunt populate, nu create direct
  lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'quizzes'>
): Promise<Lesson> => {
  try {
    const newLesson = await lessonRepository.createLesson(lessonData);
    return newLesson;
  } catch (error) {
    console.error("SERVICE ERROR: Eroare la crearea lecției:", error);
    throw new Error("A eșuat crearea lecției.");
  }
};

export const getLessonListService = async (): Promise<Lesson[]> => {
  try {
    // Repository-ul returnează deja lecțiile cu quiz-uri populate
    const lessons = await lessonRepository.getLessonList();
    return lessons;
  } catch (error) {
    console.error("SERVICE ERROR: Eroare la obținerea listei de lecții:", error);
    throw new Error("A eșuat obținerea listei de lecții.");
  }
};

export const getLessonByIdService = async (id: string): Promise<Lesson | null> => {
  try {
    // Repository-ul returnează deja lecția cu quiz-uri populate
    const lesson = await lessonRepository.getLessonById(id);
    if (!lesson) {
      throw new Error(`Lecția cu ID ${id} nu a fost găsită.`);
    }
    return lesson;
  } catch (error) {
    console.error(`SERVICE ERROR: Eroare la obținerea lecției cu ID ${id}:`, error);
    throw error;
  }
};

export const updateLessonService = async (
  id: string,
  // NOU: Excludem 'quizzes' din partialLesson, deoarece nu se actualizează direct prin acest DTO
  partialLesson: Partial<Omit<Lesson, 'quizzes'>>
): Promise<Lesson | null> => {
  try {
    // Repository-ul returnează deja lecția cu quiz-uri populate după actualizare
    const updatedLesson = await lessonRepository.updateLesson(id, partialLesson);
    if (!updatedLesson) {
      throw new Error(`Lecția cu ID ${id} nu a fost găsită sau nu a putut fi actualizată.`);
    }
    return updatedLesson;
  } catch (error) {
    console.error(`SERVICE ERROR: Eroare la actualizarea lecției cu ID ${id}:`, error);
    throw error;
  }
};

export const deleteLessonByIdService = async (id: string): Promise<boolean> => {
  try {
    const deleted = await lessonRepository.deleteLessonById(id);
    if (!deleted) {
      throw new Error(`Lecția cu ID ${id} nu a fost găsită sau nu a putut fi ștearsă.`);
    }
    return deleted;
  } catch (error) {
      console.error(`SERVICE ERROR: Eroare la ștergerea lecției cu ID ${id}:`, error);
      throw error;
  }
};