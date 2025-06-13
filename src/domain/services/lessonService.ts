// src/domain/services/lessonService.ts

import { Lesson } from "../../models/interfaces/lesson";
import * as lessonRepository from "../repositories/lessonRepository"; // Importăm toate funcțiile din lessonRepository

export const createLessonService = async (
    lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'quizzes' | 'quizIds'>
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
        const lessons = await lessonRepository.getLessonList();
        return lessons;
    } catch (error) {
        console.error("SERVICE ERROR: Eroare la obținerea listei de lecții:", error);
        throw new Error("A eșuat obținerea listei de lecții.");
    }
};

export const getLessonByIdService = async (id: string): Promise<Lesson | null> => {
    try {
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
    partialLesson: Partial<Omit<Lesson, 'quizzes'>>
): Promise<Lesson | null> => {
    try {
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

// --- MODIFICAT: Numele funcției de la deleteLessonByIdService la deleteLessonService ---
export const deleteLessonService = async (id: string): Promise<boolean> => {
    try {
        // Asigură-te că și în lessonRepository.ts, funcția se numește deleteLessonById sau cum e importată.
        // Dacă lessonRepository.ts exportă 'deleteLessonById', atunci apelul aici ar trebui să rămână 'lessonRepository.deleteLessonById(id)'
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

export const uploadLessonAudioService = async (lessonId: string, audioPath: string): Promise<Lesson | null> => {
    try {
        const updatedLesson = await lessonRepository.updateLessonAudio(lessonId, audioPath);
        return updatedLesson;
    } catch (error) {
        console.error(`SERVICE ERROR: Eroare la upload audio pentru lecția cu ID ${lessonId}:`, error);
        throw error;
    }
};