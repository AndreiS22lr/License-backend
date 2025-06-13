// src/domain/repositories/lessonRepository.ts

// Asigură-te că PATH-ul este corect pentru fișierul tău de conexiune la MongoDB
// Conform codului tău, este "../../core/database/mongoClient"
import { getDb } from "../../core/database/mongoClient";
import { Lesson } from "../../models/interfaces/lesson";
import { Collection, ObjectId, OptionalId } from "mongodb";
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
    // Acum tipul include sheetMusicImageUrl și audioUrl, deoarece sunt primite de la service
    lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'quizzes' | 'quizIds'>
): Promise<Lesson> => {
    const collection = getLessonsCollection();
    const newLesson = {
        ...lessonData, // lessonData va conține acum sheetMusicImageUrl și audioUrl
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await collection.insertOne(newLesson as OptionalId<Lesson>);

    const insertedLesson = await collection.findOne({ _id: result.insertedId });
    if (insertedLesson) {
        return { ...insertedLesson, id: insertedLesson._id.toHexString() };
    } else {
        // Fallback în cazul în care findOne eșuează imediat după insert (rar, dar posibil)
        return { ...newLesson, id: result.insertedId.toHexString() };
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

        if (lesson.quizIds && lesson.quizIds.length > 0) {
            const quizzesPromises = lesson.quizIds.map(quizId => getQuizById(quizId));
            const quizzes = await Promise.all(quizzesPromises);
            mappedLesson.quizzes = quizzes.filter(isQuiz);
        }
        return mappedLesson;
    });

    return Promise.all(lessonsWithQuizzesPromises);
};


// Funcția pentru a obține o lecție după ID (cu populare de quiz-uri)
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
            }
        }
    } catch (error) {
        console.error("REPOSITORY ERROR: Eroare la găsirea lecției după ID:", error);
        return null;
    }
    return foundLesson;
};


// Funcția pentru a actualiza o lecție (cu log-uri de depanare și corecții de tipare)
export const updateLesson = async (
    id: string,
    partialLesson: Partial<Omit<Lesson, 'quizzes'>>
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

    const updateFields: Omit<Partial<Lesson>, 'id' | 'createdAt' | 'updatedAt' | 'quizzes'> = { ...partialLesson };
    delete (updateFields as any).id;
    delete (updateFields as any).createdAt;
    delete (updateFields as any).updatedAt;
    delete (updateFields as any).quizzes;

    try {
        console.log("REPOSITORY DEBUG: Căutare după _id:", objectId);
        console.log("REPOSITORY DEBUG: Câmpuri de actualizat cu $set:", { ...updateFields, updatedAt: new Date() });

        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { ...updateFields, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        console.log("REPOSITORY DEBUG: Rezultat complet de la findOneAndUpdate:", result);

        // NOU: Verificăm 'value' după un cast la 'any' pentru a mulțumi TypeScript-ul
        if ((result as any) && (result as any).value) {
            const updatedDocument = (result as any).value; // Aici se accesează 'value' după cast

            console.log("REPOSITORY DEBUG: Lecție găsită și actualizată cu succes. _id:", updatedDocument._id.toHexString());
            const mappedLesson: Lesson = {
                ...updatedDocument,
                id: updatedDocument._id.toHexString()
            };

            if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
                const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
                const quizzes = await Promise.all(quizzesPromises);
                mappedLesson.quizzes = quizzes.filter(isQuiz);
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

// Funcția pentru a șterge o lecție după ID
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

// Funcția pentru a actualiza doar calea audio a unei lecții
export const updateLessonAudio = async (lessonId: string, audioUrl: string): Promise<Lesson | null> => {
    const collection = getLessonsCollection();
    try {
        if (!ObjectId.isValid(lessonId)) {
            console.error("REPOSITORY ERROR: ID-ul furnizat nu este un ObjectId valid pentru updateLessonAudio:", lessonId);
            throw new Error('ID-ul lecției nu este valid.');
        }
        const objectId = new ObjectId(lessonId);

        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: { audioUrl: audioUrl, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        // NOU: Verificăm 'value' după un cast la 'any' pentru a mulțumi TypeScript-ul
        if ((result as any) && (result as any).value) {
            const updatedDocument = (result as any).value; // Aici se accesează 'value' după cast

            if (updatedDocument) {
                const mappedLesson: Lesson = {
                    ...updatedDocument,
                    id: updatedDocument._id ? updatedDocument._id.toHexString() : undefined,
                };

                if (mappedLesson.quizIds && mappedLesson.quizIds.length > 0) {
                    const quizzesPromises = mappedLesson.quizIds.map(quizId => getQuizById(quizId));
                    const quizzes = await Promise.all(quizzesPromises);
                    mappedLesson.quizzes = quizzes.filter(isQuiz);
                }
                return mappedLesson;
            } else {
                return null;
            }
        } else {
            return null; // Lecția nu a fost găsită sau nu a putut fi actualizată
        }
    } catch (error) {
        console.error(`REPOSITORY ERROR: Eroare la actualizarea audio pentru lecția cu ID ${lessonId}:`, error);
        throw error;
    }
};