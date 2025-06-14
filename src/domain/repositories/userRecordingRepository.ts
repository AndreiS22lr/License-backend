// src/domain/repositories/userRecordingRepository.ts

import { Collection, ObjectId, OptionalId } from 'mongodb'; // FindAndModifyResult rămâne importat, deși nu va mai fi folosit direct în upsert
import { getDb } from "../../core/database/mongoClient";
import { UserRecording } from "../../models/interfaces/userRecording";

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
 * @deprecated Folosiți upsertUserRecording pentru a asigura o singură înregistrare per lecție.
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
        return { ...newRecording, id: result.insertedId.toHexString() };
    }
};

/**
 * Salvează sau actualizează o înregistrare a utilizatorului.
 * Dacă există deja o înregistrare pentru userId și lessonId, o va actualiza.
 * Altfel, va crea o înregistrare nouă.
 * @param userId - ID-ul utilizatorului.
 * @param lessonId - ID-ul lecției.
 * @param audioUrl - Calea URL către fișierul audio.
 * @returns Înregistrarea utilizatorului salvată sau actualizată.
 */
export const upsertUserRecording = async (
    userId: string,
    lessonId: string,
    audioUrl: string
): Promise<UserRecording> => {
    const collection = getUserRecordingsCollection();
    const now = new Date();

    console.log(`REPOSITORY DEBUG (upsertUserRecording): Începe upsert pentru userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

    // Caută o înregistrare existentă pentru acest utilizator și această lecție
    const existingRecording = await collection.findOne({ userId: userId, lessonId: lessonId });

    let finalRecording: UserRecording | null = null; // Inițializăm la null

    if (existingRecording) {
        console.log(`REPOSITORY DEBUG (upsertUserRecording): Înregistrare existentă găsită cu ID: ${existingRecording._id.toHexString()}. Se actualizează.`);
        
        // NOUA LOGICĂ: Folosim updateOne și apoi findOne, similar cu exemplul Product
        const updateResult = await collection.updateOne(
            { _id: existingRecording._id },
            { $set: { audioUrl: audioUrl, updatedAt: now } }
        );

        if (updateResult.matchedCount > 0) {
            // Dacă un document a fost găsit și actualizat, îl preluăm
            finalRecording = await collection.findOne({ _id: existingRecording._id });
        } else {
            console.warn(`REPOSITORY WARNING (upsertUserRecording): matchedCount este 0 pentru ID ${existingRecording._id.toHexString()} la actualizare. Poate a fost șters recent.`);
        }
    } else {
        console.log(`REPOSITORY DEBUG (upsertUserRecording): Nu s-a găsit înregistrare existentă. Se creează una nouă.`);
        // Dacă nu există, creează o nouă înregistrare
        const newRecording: Omit<UserRecording, 'id'> = {
            userId,
            lessonId,
            audioUrl,
            createdAt: now,
            updatedAt: now,
        };
        const insertResult = await collection.insertOne(newRecording as OptionalId<UserRecording>);
        // findOne după insert este în general sigur că va găsi documentul
        finalRecording = await collection.findOne({ _id: insertResult.insertedId });
    }

    if (finalRecording) {
        console.log(`REPOSITORY DEBUG (upsertUserRecording): Operație upsert finalizată. ID: ${finalRecording._id?.toHexString()}`);
        return { ...finalRecording, id: finalRecording._id?.toHexString() };
    } else {
        console.error(`REPOSITORY ERROR (upsertUserRecording): A eșuat upsert pentru userId: ${userId}, lessonId: ${lessonId}. finalRecording este null după operație.`);
        throw new Error("A eșuat salvarea/actualizarea înregistrării utilizatorului.");
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
    
    

    // Nota: userId poate fi un string simplu (ex. de la Firebase Auth), nu neapărat un ObjectId.
    // Presupunem că `userId` este stocat ca string în baza de date.
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
    
    // Nota: userId poate fi un string simplu (ex. de la Firebase Auth), nu neapărat un ObjectId.
    // Presupunem că `userId` este stocat ca string în baza de date.
    // Nu mai este necesară validarea ObjectId pentru userId aici, dacă este un string arbitrar.
    // if (!ObjectId.isValid(userId)) {
    //     console.error(`REPOSITORY ERROR (getUserRecordingsByUserId): userId "${userId}" nu este un ObjectId valid.`);
    //     return [];
    // }

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
