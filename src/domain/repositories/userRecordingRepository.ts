// src/domain/repositories/userRecordingRepository.ts

import { Collection, ObjectId, OptionalId } from 'mongodb'; 
import { getDb } from "../../core/database/mongoClient";
import { UserRecording } from "../../models/interfaces/userRecording";


const getUserRecordingsCollection = (): Collection<UserRecording> => {
    return getDb().collection<UserRecording>('userRecordings');
};

/**
 
 * @param recordingData 
 * @returns 
 * @deprecated 
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
 
 * @param userId 
 * @param lessonId 
 * @param audioUrl 
 * @returns 
 */
export const upsertUserRecording = async (
    userId: string,
    lessonId: string,
    audioUrl: string
): Promise<UserRecording> => {
    const collection = getUserRecordingsCollection();
    const now = new Date();

    console.log(`REPOSITORY DEBUG (upsertUserRecording): Începe upsert pentru userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

    
    const existingRecording = await collection.findOne({ userId: userId, lessonId: lessonId });

    let finalRecording: UserRecording | null = null; // Inițializăm la null

    if (existingRecording) {
        console.log(`REPOSITORY DEBUG (upsertUserRecording): Înregistrare existentă găsită cu ID: ${existingRecording._id.toHexString()}. Se actualizează.`);
        
        
        const updateResult = await collection.updateOne(
            { _id: existingRecording._id },
            { $set: { audioUrl: audioUrl, updatedAt: now } }
        );

        if (updateResult.matchedCount > 0) {
            
            finalRecording = await collection.findOne({ _id: existingRecording._id });
        } else {
            console.warn(`REPOSITORY WARNING (upsertUserRecording): matchedCount este 0 pentru ID ${existingRecording._id.toHexString()} la actualizare. Poate a fost șters recent.`);
        }
    } else {
        console.log(`REPOSITORY DEBUG (upsertUserRecording): Nu s-a găsit înregistrare existentă. Se creează una nouă.`);
        
        const newRecording: Omit<UserRecording, 'id'> = {
            userId,
            lessonId,
            audioUrl,
            createdAt: now,
            updatedAt: now,
        };
        const insertResult = await collection.insertOne(newRecording as OptionalId<UserRecording>);
        
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

 * @param userId 
 * @param lessonId 
 * @returns 
 */
export const getUserRecordingsByLessonAndUser = async (userId: string, lessonId: string): Promise<UserRecording[]> => {
    const collection = getUserRecordingsCollection();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByLessonAndUser): Caut înregistrări pentru userId: ${userId}, lessonId: ${lessonId}`);
    
    

    
    const recordings = await collection.find({ userId: userId, lessonId: lessonId }).sort({ createdAt: -1 }).toArray();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByLessonAndUser): Am găsit ${recordings.length} înregistrări.`);
    
    return recordings.map(rec => ({ ...rec, id: rec._id.toHexString() }));
};

/**
 
 * @param userId 
 * @returns 
 */
export const getUserRecordingsByUserId = async (userId: string): Promise<UserRecording[]> => {
    const collection = getUserRecordingsCollection();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByUserId): Caut înregistrări pentru userId: ${userId}`);
    
    

    const recordings = await collection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
    console.log(`REPOSITORY DEBUG (getUserRecordingsByUserId): Am găsit ${recordings.length} înregistrări.`);
    
    return recordings.map(rec => ({ ...rec, id: rec._id.toHexString() }));
};

/**
 * @param recordingId 
 * @returns 
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
