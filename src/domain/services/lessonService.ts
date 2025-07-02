// src/domain/services/lessonService.ts

import { Lesson } from "../../models/interfaces/lesson";
import * as lessonRepository from "../repositories/lessonRepository";
import { getQuizById } from "../repositories/quizRepository"; 

export const createLessonService = async (
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

        
        if (lesson.quizIds && lesson.quizIds.length > 0) {
            const quizIdToPopulate = lesson.quizIds[0]; 
            try {
                const quiz = await getQuizById(quizIdToPopulate); 
                if (quiz) {
                    lesson.quizzes = [quiz]; 
                } else {
                    console.warn(`SERVICE WARNING: Quiz-ul cu ID ${quizIdToPopulate} asociat lecției ${id} nu a fost găsit.`);
                    lesson.quizzes = []; 
                }
            } catch (quizError) {
                console.error(`SERVICE ERROR: Eroare la popularea quiz-ului ${quizIdToPopulate} pentru lecția ${id}:`, quizError);
                
                lesson.quizzes = [];
            }
        } else {
            lesson.quizzes = []; 
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