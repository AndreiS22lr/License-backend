// src/domain/services/lessonService.ts

import { Lesson } from "../../models/interfaces/lesson";
import * as lessonRepository from "../repositories/lessonRepository";
import { getQuizById } from "../repositories/quizRepository"; // <-- NOU: Importă funcția pentru a prelua quiz-uri

export const createLessonService = async (
    lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'quizzes'> // 'quizIds' poate fi inclus aici dacă e trimis de la form, dar va fi de obicei gol la creare
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
        // Aici am putea adăuga popularea pentru fiecare lecție din listă, dacă e necesar
        // Dar pentru început, e suficient să populăm doar la getLessonById
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

        // --- NOU: Logica de populare a quiz-ului ---
        if (lesson.quizIds && lesson.quizIds.length > 0) {
            const quizIdToPopulate = lesson.quizIds[0]; // Luăm primul (și singurul, prin convenție) ID
            try {
                const quiz = await getQuizById(quizIdToPopulate); // Preia quiz-ul complet
                if (quiz) {
                    lesson.quizzes = [quiz]; // Adaugă quiz-ul populat în array-ul 'quizzes'
                } else {
                    console.warn(`SERVICE WARNING: Quiz-ul cu ID ${quizIdToPopulate} asociat lecției ${id} nu a fost găsit.`);
                    lesson.quizzes = []; // Asigură-te că este un array gol dacă nu se găsește
                }
            } catch (quizError) {
                console.error(`SERVICE ERROR: Eroare la popularea quiz-ului ${quizIdToPopulate} pentru lecția ${id}:`, quizError);
                // Decide dacă arunci eroarea sau doar loghezi și trimiți lecția fără quiz-ul populat
                // Pentru robustete, vom trimite lecția, dar fără quiz-ul populat în cazul unei erori la quiz.
                lesson.quizzes = [];
            }
        } else {
            lesson.quizzes = []; // Asigură-te că e un array gol dacă nu există quizIds
        }
        // --- SFÂRȘIT NOU ---

        return lesson;
    } catch (error) {
        console.error(`SERVICE ERROR: Eroare la obținerea lecției cu ID ${id}:`, error);
        throw error;
    }
};

export const updateLessonService = async (
    id: string,
    partialLesson: Partial<Omit<Lesson, 'quizzes'>> // <--- ATENȚIE AICI! 'quizIds' nu e omis!
): Promise<Lesson | null> => {
    try {
        // Asigură-te că 'quizIds' poate fi trimis aici.
        // partialLesson poate include acum 'quizIds'
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

export const deleteLessonService = async (id: string): Promise<boolean> => {
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

export const uploadLessonAudioService = async (lessonId: string, audioPath: string): Promise<Lesson | null> => {
    try {
        const updatedLesson = await lessonRepository.updateLessonAudio(lessonId, audioPath);
        return updatedLesson;
    } catch (error) {
        console.error(`SERVICE ERROR: Eroare la upload audio pentru lecția cu ID ${lessonId}:`, error);
        throw error;
    }
};