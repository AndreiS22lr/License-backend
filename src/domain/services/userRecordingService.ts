// src/domain/services/userRecordingService.ts

import * as userRecordingRepository from "../repositories/userRecordingRepository";
import { UserRecording } from "../../models/interfaces/userRecording";
import { Lesson } from "../../models/interfaces/lesson";
import * as lessonRepository from "../repositories/lessonRepository";

/**
 
 * @param userId 
 * @param lessonId 
 * @param audioUrl 
 * @returns 
 * @throws 
 */
export const saveUserRecordingService = async (
    userId: string,
    lessonId: string,
    audioUrl: string
): Promise<UserRecording> => {
    console.log(`SERVICE DEBUG (saveUserRecordingService): Începe salvarea/actualizarea înregistrării. userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

    const lesson = await lessonRepository.getLessonById(lessonId);
    if (!lesson) {
        console.error(`SERVICE ERROR (saveUserRecordingService): Lecția cu ID ${lessonId} nu a fost găsită.`);
        throw new Error(`Lecția cu ID ${lessonId} nu a fost găsită pentru a-i asocia înregistrarea audio.`);
    }

    try {
        
        const savedOrUpdatedRecording = await userRecordingRepository.upsertUserRecording(userId, lessonId, audioUrl);
        console.log(`SERVICE DEBUG (saveUserRecordingService): Înregistrare utilizator salvată/actualizată cu succes: ${savedOrUpdatedRecording.id}`);
        return savedOrUpdatedRecording;
    } catch (error) {
        console.error(`SERVICE ERROR (saveUserRecordingService): Eroare la salvarea/actualizarea înregistrării utilizatorului pentru lessonId ${lessonId} și userId ${userId}:`, error);
        throw new Error("A eșuat salvarea/actualizarea înregistrării utilizatorului.");
    }
};

/**
 
 * @param userId 
 * @returns 
 */
export const getUserRecordingsByUserService = async (userId: string): Promise<(UserRecording & { lessonDetails?: Lesson })[]> => {
    console.log(`SERVICE DEBUG (getUserRecordingsByUserService): Caut înregistrări pentru userId: ${userId}`);
    try {
        const recordings = await userRecordingRepository.getUserRecordingsByUserId(userId);
        console.log(`SERVICE DEBUG (getUserRecordingsByUserService): Am găsit ${recordings.length} înregistrări. Populăm detalii lecții...`);

        const recordingsWithLessonDetails = await Promise.all(recordings.map(async (recording) => {
            const lessonDetails = await lessonRepository.getLessonById(recording.lessonId);
            return {
                ...recording,
                lessonDetails: lessonDetails || undefined
            };
        }));
        return recordingsWithLessonDetails;
    } catch (error) {
        console.error(`SERVICE ERROR (getUserRecordingsByUserService): Eroare la obținerea înregistrărilor pentru userId ${userId}:`, error);
        throw new Error("A eșuat obținerea înregistrărilor utilizatorului.");
    }
};

/**
 
 * @param userId 
 * @param lessonId 
 * @returns 
 */
export const getUserRecordingsByLessonAndUserService = async (userId: string, lessonId: string): Promise<(UserRecording & { lessonDetails?: Lesson })[]> => {
    console.log(`SERVICE DEBUG (getUserRecordingsByLessonAndUserService): Caut înregistrări pentru userId: ${userId} și lessonId: ${lessonId}`);
    try {
        const recordings = await userRecordingRepository.getUserRecordingsByLessonAndUser(userId, lessonId);
        console.log(`SERVICE DEBUG (getUserRecordingsByLessonAndUserService): Am găsit ${recordings.length} înregistrări. Populăm detalii lecție...`);

        const lessonDetails = await lessonRepository.getLessonById(lessonId);

        return recordings.map(recording => ({
            ...recording,
            lessonDetails: lessonDetails || undefined
        }));

    } catch (error) {
        console.error(`SERVICE ERROR (getUserRecordingsByLessonAndUserService): Eroare la obținerea înregistrărilor pentru userId ${userId} și lessonId ${lessonId}:`, error);
        throw new Error("A eșuat obținerea înregistrărilor utilizatorului pentru lecție.");
    }
};


/**
 
 * @param recordingId 
 * @param userId 
 * @returns 
 * @throws 
 */
export const deleteUserRecordingService = async (recordingId: string, userId: string): Promise<boolean> => {
    console.log(`SERVICE DEBUG (deleteUserRecordingService): Începe ștergerea înregistrării ${recordingId} de către utilizatorul ${userId}.`);

    const recordingToDelete = await userRecordingRepository.getUserRecordingById(recordingId);
    if (!recordingToDelete) {
        console.warn(`SERVICE WARNING (deleteUserRecordingService): Înregistrarea cu ID ${recordingId} nu a fost găsită.`);
        throw new Error("Înregistrarea nu a fost găsită.");
    }

    if (recordingToDelete.userId !== userId) {
        console.error(`SERVICE ERROR (deleteUserRecordingService): Utilizatorul ${userId} nu este autorizat să șteargă înregistrarea ${recordingId} (proprietar: ${recordingToDelete.userId}).`);
        throw new Error("Nu sunteți autorizat să ștergeți această înregistrare.");
    }

    try {
        const deleted = await userRecordingRepository.deleteUserRecordingById(recordingId);
        console.log(`SERVICE DEBUG (deleteUserRecordingService): Înregistrarea ${recordingId} a fost ștearsă cu succes: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`SERVICE ERROR (deleteUserRecordingService): Eroare la ștergerea înregistrării ${recordingId}:`, error);
        throw new Error("A eșuat ștergerea înregistrării.");
    }
};

/**
 
 * @param recordingId 
 * @returns 
 */
export const getUserRecordingByIdService = async (recordingId: string): Promise<UserRecording | null> => {
    console.log(`SERVICE DEBUG (getUserRecordingByIdService): Caut înregistrarea cu ID: ${recordingId}`);
    try {
        return await userRecordingRepository.getUserRecordingById(recordingId);
    } catch (error) {
        console.error(`SERVICE ERROR (getUserRecordingByIdService): Eroare la obținerea înregistrării cu ID ${recordingId}:`, error);
        throw new Error("A eșuat obținerea înregistrării.");
    }
};
