// src/domain/repositories/userRecordingRepository.ts

import { Collection, ObjectId, OptionalId } from 'mongodb';
import { getDb } from "../../core/database/mongoClient"; // Asigură-te că calea este corectă
import { UserRecording } from "../../models/interfaces/userRecording"; // Importăm noul model UserRecording

/**
 * Returnează colecția MongoDB pentru înregistrările utilizatorilor.
 */
const getUserRecordingsCollection = (): Collection<UserRecording> => {
    return getDb().collection<UserRecording>('userRecordings');
};

/**
 * Creează o nouă înregistrare a utilizatorului în baza de date.
 * @param recordingData - Obiectul înregistrării utilizatorului de creat.
 * @returns Înregistrarea creată, inclusiv ID-ul din baza de date.
 */
export const createUserRecording = async (
    recordingData: Omit<UserRecording, 'id' | 'createdAt' | 'updatedAt'>
): Promise<UserRecording> => {
    const collection = getUserRecordingsCollection();
    const newRecording = {
        ...recordingData,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    console.log("REPOSITORY DEBUG (createUserRecording): Se inserează o nouă înregistrare:", newRecording);
    const result = await collection.insertOne(newRecording as OptionalId<UserRecording>);

    const insertedRecording = await collection.findOne({ _id: result.insertedId });
    if (insertedRecording) {
        console.log(`REPOSITORY DEBUG (createUserRecording): Înregistrare creată cu ID: ${insertedRecording._id.toHexString()}`);
        return { ...insertedRecording, id: insertedRecording._id.toHexString() };
    } else {
        console.error("REPOSITORY ERROR (createUserRecording): Nu s-a putut regăsi înregistrarea inserată.");
        // Fallback în cazul în care findOne eșuează imediat după insert (rar, dar posibil)
        return { ...newRecording, id: result.insertedId.toHexString() };
    }
};

/**
 * Găsește toate înregistrările unui utilizator pentru o anumită lecție.
 * @param userId - ID-ul utilizatorului.
 * @param lessonId - ID-ul lecției.
 * @returns Un array de înregistrări ale utilizatorului pentru acea lecție.
 */
export const getUserRecordingsByLessonAndUser = async (userId: string, lessonId: string): Promise<UserRecording[]> => {
    const collection = getUserRecordingsCollection();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByLessonAndUser): Caut înregistrări pentru userId: ${userId}, lessonId: ${lessonId}`);
    
    // Asigură-te că userId și lessonId sunt valide (deși ele vin ca stringuri, MongoDB le stochează ca stringuri)
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(lessonId)) {
        console.error(`REPOSITORY ERROR (getUserRecordingsByLessonAndUser): userId "${userId}" sau lessonId "${lessonId}" nu este un ObjectId valid.`);
        return [];
    }

    const recordings = await collection.find({ userId: userId, lessonId: lessonId }).sort({ createdAt: -1 }).toArray();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByLessonAndUser): Am găsit ${recordings.length} înregistrări.`);
    
    return recordings.map(rec => ({ ...rec, id: rec._id.toHexString() }));
};

/**
 * Găsește toate înregistrările unui utilizator.
 * @param userId - ID-ul utilizatorului.
 * @returns Un array de înregistrări ale utilizatorului.
 */
export const getUserRecordingsByUserId = async (userId: string): Promise<UserRecording[]> => {
    const collection = getUserRecordingsCollection();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByUserId): Caut înregistrări pentru userId: ${userId}`);
    
    if (!ObjectId.isValid(userId)) {
        console.error(`REPOSITORY ERROR (getUserRecordingsByUserId): userId "${userId}" nu este un ObjectId valid.`);
        return [];
    }

    const recordings = await collection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByUserId): Am găsit ${recordings.length} înregistrări.`);
    
    return recordings.map(rec => ({ ...rec, id: rec._id.toHexString() }));
};

/**
 * Șterge o înregistrare a utilizatorului după ID.
 * @param recordingId - ID-ul înregistrării de șters.
 * @returns True dacă înregistrarea a fost ștearsă, false altfel.
 */
export const deleteUserRecordingById = async (recordingId: string): Promise<boolean> => {
    const collection = getUserRecordingsCollection();
    console.log(`REPOSITORY DEBUG (deleteUserRecordingById): Se încearcă ștergerea înregistrării cu ID: ${recordingId}`);

    if (!ObjectId.isValid(recordingId)) {
        console.error(`REPOSITORY ERROR (deleteUserRecordingById): recordingId "${recordingId}" nu este un ObjectId valid.`);
        return false;
    }

    const result = await collection.deleteOne({ _id: new ObjectId(recordingId) });
    console.log(`REPOSITORY DEBUG (deleteUserRecordingById): Rezultat ștergere: ${result.deletedCount} documente șterse.`);
    return result.deletedCount === 1;
};

// NOU: O funcție pentru a găsi o înregistrare după ID-ul său (utilă pentru a obține calea fișierului înainte de ștergere)
export const getUserRecordingById = async (id: string): Promise<UserRecording | null> => {
    const collection = getUserRecordingsCollection();
    if (!ObjectId.isValid(id)) {
        console.error(`REPOSITORY ERROR (getUserRecordingById): ID-ul "${id}" nu este un ObjectId valid.`);
        return null;
    }
    const recording = await collection.findOne({ _id: new ObjectId(id) });
    if (recording) {
        return { ...recording, id: recording._id.toHexString() };
    }
    return null;
};
