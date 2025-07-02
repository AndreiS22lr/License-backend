// src/domain/repositories/lessonRepository.ts

// Asigură-te că PATH-ul este corect pentru fișierul tău de conexiune la MongoDB
import { getDb } from "../../core/database/mongoClient";
import { Lesson } from "../../models/interfaces/lesson";
// Am scos FindAndModifyResult și ModifyResult din import, deoarece nu mai sunt necesare
import { Collection, ObjectId, OptionalId, WithId } from "mongodb"; 
import { getQuizById } from "./quizRepository";
import { Quiz } from "../../models/interfaces/quiz";

// Funcție ajutătoare pentru a obține colecția 'lessons'
const getLessonsCollection = (): Collection<Lesson> => {
    return getDb().collection<Lesson>("lessons");
};

// Functie helper pentru type guard
function isQuiz(quiz: Quiz | null): quiz is Quiz {
    return quiz !== null;
}

// Funcția pentru a crea o lecție
export const createLesson = async (
    lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'quizzes'>
): Promise<Lesson> => {
    const collection = getLessonsCollection();
    const newLesson = {
        ...lessonData,
        createdAt: new Date(),
        updatedAt: new Date(),
        quizIds: lessonData.quizIds || []
    };

    const result = await collection.insertOne(newLesson as OptionalId<Lesson>);

    const insertedLesson = await collection.findOne({ _id: result.insertedId });
    if (insertedLesson) {
        const mappedLesson: Lesson = { ...insertedLesson, id: insertedLesson._id.toHexString() };
        
        if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
            const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
            const quizzes = await Promise.all(quizzesPromises);
            mappedLesson.quizzes = quizzes.filter(isQuiz);
        } else {
            mappedLesson.quizzes = [];
        }

        return mappedLesson;
    } else {
        const fallbackLesson: Lesson = { ...newLesson, id: result.insertedId.toHexString() };
        fallbackLesson.quizzes = [];
        return fallbackLesson;
    }
};

// Funcția pentru a obține toate lecțiile (cu populare de quiz-uri)
export const getLessonList = async (): Promise<Lesson[]> => {
    const collection = getLessonsCollection();
    const lessons = await collection.find({}).sort({ order: 1 }).toArray();

    const lessonsWithQuizzesPromises = lessons.map(async lesson => {
        const mappedLesson: Lesson = {
            ...lesson,
            id: lesson._id ? lesson._id.toHexString() : undefined,
        };

        if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
            const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
            const quizzes = await Promise.all(quizzesPromises);
            mappedLesson.quizzes = quizzes.filter(isQuiz);
        } else {
            mappedLesson.quizzes = [];
        }
        return mappedLesson;
    });

    return Promise.all(lessonsWithQuizzesPromises);
};



export const getLessonById = async (id: string): Promise<Lesson | null> => {
    const collection = getLessonsCollection();
    let foundLesson: Lesson | null = null;
    try {
        if (!ObjectId.isValid(id)) {
            console.error("REPOSITORY ERROR: ID-ul furnizat nu este un ObjectId valid:", id);
            return null;
        }
        const objectId = new ObjectId(id);
        const lesson = await collection.findOne({ _id: objectId });
        if (lesson) {
            foundLesson = {
                ...lesson,
                id: lesson._id ? lesson._id.toHexString() : undefined
            };

            if (foundLesson.quizIds && foundLesson.quizIds.length > 0) {
                const quizzesPromises = foundLesson.quizIds.map(quizId => getQuizById(quizId));
                const quizzes = await Promise.all(quizzesPromises);
                foundLesson.quizzes = quizzes.filter(isQuiz);
            } else {
                foundLesson.quizzes = [];
            }
        }
    } catch (error) {
        console.error("REPOSITORY ERROR: Eroare la găsirea lecției după ID:", error);
        return null;
    }
    return foundLesson;
};



export const updateLesson = async (
    id: string,
    partialLesson: Partial<Omit<Lesson, 'quizzes' | 'createdAt' | 'updatedAt'>>
): Promise<Lesson | null> => {
    const collection = getLessonsCollection();
    let objectId: ObjectId;

    console.log("\n--- REPOSITORY UPDATE DEBUG START ---");
    console.log("REPOSITORY DEBUG: ID primit:", id);
    console.log("REPOSITORY DEBUG: Date partiale primite:", partialLesson);

    try {
        if (!ObjectId.isValid(id)) {
            console.error("REPOSITORY ERROR: Format ID invalid la conversie ObjectId:", id);
            console.log("--- REPOSITORY UPDATE DEBUG END (ID Invalid) ---\n");
            return null;
        }
        objectId = new ObjectId(id);
        console.log("REPOSITORY DEBUG: ID convertit în ObjectId:", objectId.toHexString());
    } catch (error) {
        console.error("REPOSITORY ERROR: Eroare la conversia ID-ului în ObjectId (catch):", id, error);
        console.log("--- REPOSITORY UPDATE DEBUG END (Eroare Conversie ID) ---\n");
        throw error;
    }

    const updateFields: Partial<Lesson> = { ...partialLesson };
    delete (updateFields as any).id;
    delete (updateFields as any).quizzes;
    delete (updateFields as any).createdAt; 
    delete (updateFields as any).updatedAt; 

    try {
        console.log("REPOSITORY DEBUG: Căutare după _id:", objectId);
        console.log("REPOSITORY DEBUG: Câmpuri de actualizat cu $set:", { ...updateFields, updatedAt: new Date() });

        
        const updatedDocument = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { ...updateFields, updatedAt: new Date() } },
            { returnDocument: 'after' } // Asigură-te că driverul returnează documentul după actualizare
        );

        console.log("REPOSITORY DEBUG: Rezultat complet de la findOneAndUpdate:", updatedDocument);

        if (updatedDocument) { 
            console.log("REPOSITORY DEBUG: Lecție găsită și actualizată cu succes. _id:", updatedDocument._id.toHexString());
            const mappedLesson: Lesson = {
                ...updatedDocument,
                id: updatedDocument._id.toHexString()
            };

            if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
                const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
                const quizzes = await Promise.all(quizzesPromises);
                mappedLesson.quizzes = quizzes.filter(isQuiz);
            } else {
                mappedLesson.quizzes = [];
            }

            console.log("REPOSITORY DEBUG: Document mapat pentru a fi returnat:", mappedLesson);
            console.log("--- REPOSITORY UPDATE DEBUG END (Succes) ---\n");
            return mappedLesson;
        } else {
            console.log("REPOSITORY DEBUG: findOneAndUpdate nu a găsit lecția sau actualizarea a eșuat. ID:", objectId.toHexString());
            console.log("--- REPOSITORY UPDATE DEBUG END (Nu a fost găsit) ---\n");
            return null;
        }
    } catch (error) {
        console.error(`REPOSITORY ERROR: Eroare la apelul findOneAndUpdate pentru ID ${id}:`, error);
        console.log("--- REPOSITORY UPDATE DEBUG END (Eroare Catch) ---\n");
        throw error;
    }
};


export const deleteLessonById = async (id: string): Promise<boolean> => {
    const collection = getLessonsCollection();
    try {
        if (!ObjectId.isValid(id)) {
            console.error("REPOSITORY ERROR: ID-ul furnizat nu este un ObjectId valid:", id);
            return false;
        }
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    } catch (error) {
        console.error("REPOSITORY ERROR: Eroare la ștergerea lecției:", error);
        return false;
    }
};


export const updateLessonAudio = async (lessonId: string, audioUrl: string): Promise<Lesson | null> => {
    const collection = getLessonsCollection();
    try {
        if (!ObjectId.isValid(lessonId)) {
            console.error("REPOSITORY ERROR: ID-ul furnizat nu este un ObjectId valid pentru updateLessonAudio:", lessonId);
            throw new Error('ID-ul lecției nu este valid.');
        }
        const objectId = new ObjectId(lessonId);

        
        const updatedDocument = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { audioUrl: audioUrl, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (updatedDocument) { 
            const mappedLesson: Lesson = {
                ...updatedDocument,
                id: updatedDocument._id ? updatedDocument._id.toHexString() : undefined,
            };

            if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
                const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
                const quizzes = await Promise.all(quizzesPromises);
                mappedLesson.quizzes = quizzes.filter(isQuiz);
            } else {
                mappedLesson.quizzes = [];
            }
            return mappedLesson;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`REPOSITORY ERROR: Eroare la actualizarea audio pentru lecția cu ID ${lessonId}:`, error);
        throw error;
    }
};