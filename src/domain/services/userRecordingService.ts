// src/domain/services/userRecordingService.ts

import * as userRecordingRepository from "../repositories/userRecordingRepository";
import { UserRecording } from "../../models/interfaces/userRecording";
import { Lesson } from "../../models/interfaces/lesson"; // Pentru a putea popula detalii despre lecție
import * as lessonRepository from "../repositories/lessonRepository"; // Pentru a obține detalii despre lecție

/**
 * Salvează o nouă înregistrare a utilizatorului.
 * @param userId - ID-ul utilizatorului care face înregistrarea.
 * @param lessonId - ID-ul lecției la care se referă înregistrarea.
 * @param audioUrl - Calea URL către fișierul audio încărcat.
 * @returns Înregistrarea utilizatorului creată.
 * @throws Eroare dacă lecția sau utilizatorul nu sunt găsite.
 */
export const saveUserRecordingService = async (
    userId: string,
    lessonId: string,
    audioUrl: string
): Promise<UserRecording> => {
    console.log(`SERVICE DEBUG (saveUserRecordingService): Începe salvarea înregistrării. userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

    // Opțional: Poți adăuga aici o verificare pentru existența utilizatorului
    // (deși middleware-ul de autentificare ar trebui să asigure că userId este valid).

    // Verifică dacă lecția la care se referă înregistrarea există
    const lesson = await lessonRepository.getLessonById(lessonId);
    if (!lesson) {
        console.error(`SERVICE ERROR (saveUserRecordingService): Lecția cu ID ${lessonId} nu a fost găsită.`);
        throw new Error(`Lecția cu ID ${lessonId} nu a fost găsită pentru a-i asocia înregistrarea audio.`);
    }

    const newRecordingData: Omit<UserRecording, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        lessonId,
        audioUrl,
    };

    try {
        const createdRecording = await userRecordingRepository.createUserRecording(newRecordingData);
        console.log(`SERVICE DEBUG (saveUserRecordingService): Înregistrare utilizator salvată cu succes: ${createdRecording.id}`);
        return createdRecording;
    } catch (error) {
        console.error(`SERVICE ERROR (saveUserRecordingService): Eroare la salvarea înregistrării utilizatorului pentru lessonId ${lessonId} și userId ${userId}:`, error);
        throw new Error("A eșuat salvarea înregistrării utilizatorului.");
    }
};

/**
 * Obține toate înregistrările unui utilizator, inclusiv detaliile lecțiilor.
 * @param userId - ID-ul utilizatorului.
 * @returns Un array de înregistrări ale utilizatorului, cu detalii despre lecții.
 */
export const getUserRecordingsByUserService = async (userId: string): Promise<(UserRecording & { lessonDetails?: Lesson })[]> => {
    console.log(`SERVICE DEBUG (getUserRecordingsByUserService): Caut înregistrări pentru userId: ${userId}`);
    try {
        const recordings = await userRecordingRepository.getUserRecordingsByUserId(userId);
        console.log(`SERVICE DEBUG (getUserRecordingsByUserService): Am găsit ${recordings.length} înregistrări. Populăm detalii lecții...`);

        const recordingsWithLessonDetails = await Promise.all(recordings.map(async (recording) => {
            const lessonDetails = await lessonRepository.getLessonById(recording.lessonId);
            // Returnăm înregistrarea cu detalii despre lecție (sau null dacă nu găsim lecția)
            return {
                ...recording,
                lessonDetails: lessonDetails || undefined // Adăugăm detalii despre lecție
            };
        }));
        return recordingsWithLessonDetails;
    } catch (error) {
        console.error(`SERVICE ERROR (getUserRecordingsByUserService): Eroare la obținerea înregistrărilor pentru userId ${userId}:`, error);
        throw new Error("A eșuat obținerea înregistrărilor utilizatorului.");
    }
};

/**
 * Șterge o înregistrare a utilizatorului.
 * @param recordingId - ID-ul înregistrării de șters.
 * @param userId - ID-ul utilizatorului care încearcă să șteargă (pentru verificare de securitate).
 * @returns True dacă înregistrarea a fost ștearsă, false altfel.
 * @throws Eroare dacă înregistrarea nu există sau utilizatorul nu este autorizat.
 */
export const deleteUserRecordingService = async (recordingId: string, userId: string): Promise<boolean> => {
    console.log(`SERVICE DEBUG (deleteUserRecordingService): Începe ștergerea înregistrării ${recordingId} de către utilizatorul ${userId}.`);

    // Verificăm dacă înregistrarea există și dacă utilizatorul este proprietarul ei
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
 * Obține o singură înregistrare a utilizatorului după ID.
 * Utila pentru a prelua detalii specifice sau pentru verificări interne.
 * @param recordingId - ID-ul înregistrării.
 * @returns Obiectul UserRecording sau null dacă nu este găsit.
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

