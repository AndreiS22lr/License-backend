// src/domain/repositories/quizRepository.ts

import { getDb } from "../../core/database/mongoClient"; // Asigură-te că acest import este corect
import { Quiz, QuizQuestion } from "../../models/interfaces/quiz"; // Importăm interfețele Quiz
import { Collection, ObjectId, OptionalId } from "mongodb";

// Funcție ajutătoare pentru a obține colecția 'quizzes'
const getQuizzesCollection = (): Collection<Quiz> => {
    // Asigură-te că numele colecției 'quizzes' este corect în baza ta de date
    return getDb().collection<Quiz>("quizzes");
};

// Funcția pentru a crea un quiz
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

// Funcția pentru a obține toate quiz-urile
export const getQuizList = async (): Promise<Quiz[]> => {
    const collection = getQuizzesCollection();
    const quizzes = await collection.find({}).toArray();
    return quizzes.map(quiz => ({
        ...quiz,
        id: quiz._id ? quiz._id.toHexString() : undefined,
    }));
};

// Funcția pentru a obține un quiz după ID
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
    return null; // Returnează null dacă nu a fost găsit sau a apărut o eroare
};

// Funcția pentru a actualiza un quiz (CORECTATĂ PENTRU TIPARE)
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
    delete (updateFields as any).id; // Elimină 'id' din obiectul de update

    try {
        // Aici este corecția cheie: `updatedDocument` va fi direct rezultatul sau `null`
        const updatedDocument = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { ...updateFields, updatedAt: new Date() } },
            { returnDocument: 'after' } // Asigură-te că driverul MongoDB returnează documentul după actualizare
        );

        if (updatedDocument) { // Verifică direct `updatedDocument`
            return {
                ...updatedDocument, // Acesta este deja obiectul Quiz cu _id
                id: updatedDocument._id ? updatedDocument._id.toHexString() : undefined
            };
        } else {
            return null; // Quiz-ul nu a fost găsit sau actualizarea a eșuat
        }
    } catch (error) {
        console.error(`REPOSITORY ERROR (Quiz): Eroare la apelul findOneAndUpdate pentru ID ${id}:`, error);
        throw error;
    }
};

// Funcția pentru a șterge un quiz după ID
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

// --- NOU: Funcția pentru a obține un quiz după ID-ul lecției ---
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