// src/domain/repositories/userCompletedQuizRepository.ts

import { getDb } from "../../core/database/mongoClient";
import { UserCompletedQuiz } from "../../models/interfaces/quizResult"; // Importăm noua interfață
import { Collection, ObjectId, OptionalId } from "mongodb";

// Funcție ajutătoare pentru a obține colecția 'userCompletedQuizzes'
const getUserCompletedQuizzesCollection = (): Collection<UserCompletedQuiz> => {
    // Asigură-te că numele colecției este consistent (ex: 'userCompletedQuizzes')
    return getDb().collection<UserCompletedQuiz>("userCompletedQuizzes");
};

/**
 * Înregistrează un quiz ca fiind completat cu succes de către un utilizator.
 * Va evita duplicarea înregistrărilor pentru același utilizator și quiz.
 */
export const markQuizAsCompleted = async (
    userId: string,
    quizId: string // Am eliminat quizTitle de aici
): Promise<UserCompletedQuiz | null> => {
    const collection = getUserCompletedQuizzesCollection();
    let quizObjectId: ObjectId;
    // userObjectId nu este necesar aici dacă userId este un string simplu

    try {
        quizObjectId = new ObjectId(quizId);
    } catch (error) {
        console.error("REPOSITORY ERROR (UserCompletedQuiz): ID-ul quiz-ului invalid la conversie ObjectId:", quizId, error);
        return null;
    }

    // Verificăm dacă utilizatorul a completat deja acest quiz
    const existingCompletion = await collection.findOne({ userId: userId, quizId: quizId });

    if (existingCompletion) {
        console.log(`REPOSITORY INFO (UserCompletedQuiz): Quiz-ul ${quizId} a fost deja marcat ca și completat de utilizatorul ${userId}.`);
        return { ...existingCompletion, id: existingCompletion._id.toHexString() };
    }

    // Dacă nu există, creăm o nouă înregistrare
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

/**
 * Preia toate quiz-urile completate de un anumit utilizator.
 */
export const getCompletedQuizzesForUser = async (userId: string): Promise<UserCompletedQuiz[]> => {
    const collection = getUserCompletedQuizzesCollection();
    const completions = await collection.find({ userId: userId }).toArray();
    return completions.map(comp => ({
        ...comp,
        id: comp._id ? comp._id.toHexString() : undefined
    }));
};

/**
 * Preia starea de completare pentru un quiz specific pentru un utilizator.
 */
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