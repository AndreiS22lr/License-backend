// src/domain/repositories/userCompletedQuizRepository.ts

import { getDb } from "../../core/database/mongoClient";
import { UserCompletedQuiz } from "../../models/interfaces/quizResult"; 
import { Collection, ObjectId, OptionalId } from "mongodb";


const getUserCompletedQuizzesCollection = (): Collection<UserCompletedQuiz> => {
    
    return getDb().collection<UserCompletedQuiz>("userCompletedQuizzes");
};


export const markQuizAsCompleted = async (
    userId: string,
    quizId: string 
): Promise<UserCompletedQuiz | null> => {
    const collection = getUserCompletedQuizzesCollection();
    let quizObjectId: ObjectId;
    

    try {
        quizObjectId = new ObjectId(quizId);
    } catch (error) {
        console.error("REPOSITORY ERROR (UserCompletedQuiz): ID-ul quiz-ului invalid la conversie ObjectId:", quizId, error);
        return null;
    }

    
    const existingCompletion = await collection.findOne({ userId: userId, quizId: quizId });

    if (existingCompletion) {
        console.log(`REPOSITORY INFO (UserCompletedQuiz): Quiz-ul ${quizId} a fost deja marcat ca și completat de utilizatorul ${userId}.`);
        return { ...existingCompletion, id: existingCompletion._id.toHexString() };
    }

    
    const newCompletion: Omit<UserCompletedQuiz, 'id'> = {
        userId: userId,
        quizId: quizId,
        completedAt: new Date(),
    };

    const result = await collection.insertOne(newCompletion as OptionalId<UserCompletedQuiz>);

    if (result.acknowledged) {
        return { ...newCompletion, id: result.insertedId.toHexString() };
    } else {
        return null;
    }
};


export const getCompletedQuizzesForUser = async (userId: string): Promise<UserCompletedQuiz[]> => {
    const collection = getUserCompletedQuizzesCollection();
    const completions = await collection.find({ userId: userId }).toArray();
    return completions.map(comp => ({
        ...comp,
        id: comp._id ? comp._id.toHexString() : undefined
    }));
};


export const getCompletionStatusForQuiz = async (userId: string, quizId: string): Promise<UserCompletedQuiz | null> => {
    const collection = getUserCompletedQuizzesCollection();
    try {
        const completion = await collection.findOne({ userId: userId, quizId: quizId });
        if (completion) {
            return { ...completion, id: completion._id.toHexString() };
        }
        return null;
    } catch (error) {
        console.error("REPOSITORY ERROR (UserCompletedQuiz): Eroare la obținerea stării de completare:", error);
        return null;
    }
};