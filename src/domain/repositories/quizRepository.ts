// src/domain/repositories/quizRepository.ts

import { getDb } from "../../core/database/mongoClient"; 
import { Quiz, QuizQuestion } from "../../models/interfaces/quiz"; 
import { Collection, ObjectId, OptionalId } from "mongodb";


const getQuizzesCollection = (): Collection<Quiz> => {
    
    return getDb().collection<Quiz>("quizzes");
};


export const createQuiz = async (
    quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Quiz> => {
    const collection = getQuizzesCollection();
    const newQuiz = {
        ...quizData,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await collection.insertOne(newQuiz as OptionalId<Quiz>);
    return { ...newQuiz, id: result.insertedId.toHexString() };
};


export const getQuizList = async (): Promise<Quiz[]> => {
    const collection = getQuizzesCollection();
    const quizzes = await collection.find({}).toArray();
    return quizzes.map(quiz => ({
        ...quiz,
        id: quiz._id ? quiz._id.toHexString() : undefined,
    }));
};


export const getQuizById = async (id: string): Promise<Quiz | null> => {
    const collection = getQuizzesCollection();
    try {
        const objectId = new ObjectId(id);
        const quiz = await collection.findOne({ _id: objectId });
        if (quiz) {
            return {
                ...quiz,
                id: quiz._id ? quiz._id.toHexString() : undefined
            };
        }
    } catch (error) {
        console.error("REPOSITORY ERROR (Quiz): Eroare la conversia ID-ului sau găsirea quiz-ului:", error);
        return null;
    }
    return null; 
};


export const updateQuiz = async (
    id: string,
    partialQuiz: Partial<Quiz>
): Promise<Quiz | null> => {
    const collection = getQuizzesCollection();
    let objectId: ObjectId;

    try {
        objectId = new ObjectId(id);
    } catch (error) {
        console.error("REPOSITORY ERROR (Quiz): Format ID invalid la conversie ObjectId:", id, error);
        return null;
    }

    const updateFields: Omit<Partial<Quiz>, 'id' | 'createdAt' | 'updatedAt'> = { ...partialQuiz };
    delete (updateFields as any).id; 

    try {
        
        const updatedDocument = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { ...updateFields, updatedAt: new Date() } },
            { returnDocument: 'after' } 
        );

        if (updatedDocument) { 
            return {
                ...updatedDocument, 
                id: updatedDocument._id ? updatedDocument._id.toHexString() : undefined
            };
        } else {
            return null; 
        }
    } catch (error) {
        console.error(`REPOSITORY ERROR (Quiz): Eroare la apelul findOneAndUpdate pentru ID ${id}:`, error);
        throw error;
    }
};


export const deleteQuizById = async (id: string): Promise<boolean> => {
    const collection = getQuizzesCollection();
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    } catch (error) {
        console.error("REPOSITORY ERROR (Quiz): Eroare la ștergerea quiz-ului:", error);
        return false;
    }
};


export const getQuizByLessonId = async (lessonId: string): Promise<Quiz | null> => {
    const collection = getQuizzesCollection();
    try {
        const quiz = await collection.findOne({ lessonId: lessonId });
        if (quiz) {
            return {
                ...quiz,
                id: quiz._id ? quiz._id.toHexString() : undefined
            };
        }
    } catch (error) {
        console.error("REPOSITORY ERROR (Quiz): Eroare la găsirea quiz-ului după lessonId:", error);
        return null;
    }
    return null;
};