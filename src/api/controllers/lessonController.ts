import { Request, Response } from "express";
import {
    createLessonService,
    deleteLessonService,
    getLessonByIdService,
    getLessonListService,
    updateLessonService,
    uploadLessonAudioService,
} from "../../domain/services/lessonService";
import { Lesson } from "../../models/interfaces/lesson";
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// --- CORECTIE CHEIE AICI: Directorul de bază pentru operațiile de fișiere ---
// Acesta trebuie să corespundă cu `UPLOADS_BASE_DIR` din `app.ts` și cu `UPLOADS_ROOT_DIR` din `lessonRoutes.ts`
// care este 'your-project/uploads' (rădăcina proiectului)
// `__dirname` în `src/api/controllers/` este 'your-project/src/api/controllers/'
// '..', '..' te duce la 'your-project/src/'
// '..', '..', '..' te duce la 'your-project/' (rădăcina proiectului)
// Apoi, adăugăm 'uploads'.
const UPLOADS_BASE_DIR = path.join(__dirname, '..', '..', '..', 'uploads'); // <-- MODIFICAT AICI

// --- MODIFICAT: Funcția ajutătoare pentru a șterge un fișier existent de pe disc ---
const deleteFileIfExists = (relativePath: string | undefined) => {
    if (relativePath) {
        // Calea relativă vine din DB (ex: '/uploads/lessons/imagine.jpg')
        // Trebuie să extragem partea 'lessons/imagine.jpg' pentru a o alătura la UPLOADS_BASE_DIR
        const pathRelativeToUploads = relativePath.startsWith('/uploads/') ? relativePath.substring('/uploads/'.length) : relativePath;

        // Construim calea absolută pe disc
        const absolutePath = path.join(UPLOADS_BASE_DIR, pathRelativeToUploads);

        fs.unlink(absolutePath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.warn(`Attempted to delete non-existent file: ${absolutePath}`);
                } else {
                    console.error(`Error deleting file ${absolutePath}:`, err);
                }
            } else {
                console.log(`Successfully deleted old file: ${absolutePath}`);
            }
        });
    }
};

export const getLessonList = async (req: Request, res: Response): Promise<void> => {
    try {
        const lessons: Lesson[] = await getLessonListService();
        res.status(200).json({
            message: "Lista de lecții recuperată cu succes.",
            data: lessons,
        });
    } catch (error) {
        console.error("Eroare la obținerea listei de lecții:", error);
        res.status(500).json({
            error: "A eșuat obținerea listei de lecții.",
            details: error instanceof Error ? error.message : error,
        });
    }
};

export const getLessonById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        if (!id) {
            res.status(400).json({ message: "ID-ul lecției nu a fost furnizat în cerere." });
            return;
        }

        const lesson: Lesson | null = await getLessonByIdService(id);

        if (!lesson) {
            res.status(404).json({ message: `Lecția cu ID ${id} nu a fost găsită.` });
            return;
        }

        res.status(200).json({
            message: "Lecție găsită.",
            data: lesson,
        });
    } catch (error) {
        console.error(`Eroare la obținerea lecției cu ID ${id}:`, error);
        const statusCode = (error instanceof Error && error.message.includes("ID-ul lecției nu este valid")) ? 400 : 500;
        res.status(statusCode).json({
            error: `A eșuat obținerea lecției cu ID ${id}.`,
            details: error instanceof Error ? error.message : error,
        });
    }
};

export const createLesson = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, order, theoryContent } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const sheetMusicImageFile = files['sheetMusicImage'] ? files['sheetMusicImage'][0] : undefined;
        const audioLessonFile = files['audioFile'] ? files['audioFile'][0] : undefined;

        // Calea salvată în DB trebuie să includă "lessons/"
        const sheetMusicImageUrl = sheetMusicImageFile ? `/uploads/lessons/${sheetMusicImageFile.filename}` : undefined;
        const audioUrl = audioLessonFile ? `/uploads/lessons/${audioLessonFile.filename}` : undefined;

        const lessonData = {
            title,
            order: parseInt(order as string),
            theoryContent,
            sheetMusicImageUrl,
            audioUrl,
        };

        const newLesson: Lesson = await createLessonService(lessonData);

        res.status(201).json({
            message: "Lecție creată cu succes.",
            data: newLesson,
        });
    } catch (error) {
        console.error("CONTROLLER ERROR: Eroare la crearea lecției:", error);
        if (error instanceof multer.MulterError) {
            res.status(400).json({ message: `Eroare la încărcarea fișierului: ${error.message}` });
        } else {
            res.status(500).json({
                error: "A eșuat crearea unei noi lecții.",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
};

export const updateLesson = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { title, order, theoryContent, quizIds } = req.body;

    try {
        if (!id) {
            res.status(400).json({ message: "ID-ul lecției nu a fost furnizat în cerere." });
            return;
        }

        const existingLesson = await getLessonByIdService(id);
        if (!existingLesson) {
            res.status(404).json({ message: `Lecția cu ID ${id} nu a fost găsită.` });
            return;
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const updatedData: Partial<Lesson> = {
            title,
            order: order !== undefined ? parseInt(order as string) : existingLesson.order,
            theoryContent,
        };

        if (quizIds !== undefined) {
            try {
                if (typeof quizIds === 'string' && quizIds.trim() !== '') {
                    updatedData.quizIds = JSON.parse(quizIds);
                } else if (Array.isArray(quizIds)) {
                    updatedData.quizIds = quizIds;
                } else if (quizIds === null || quizIds === '') {
                    updatedData.quizIds = [];
                }
            } catch (jsonError) {
                console.warn(`Could not parse quizIds: ${quizIds}. Using existing quizIds. Error: ${jsonError}`);
                updatedData.quizIds = existingLesson.quizIds;
            }
        } else {
            updatedData.quizIds = existingLesson.quizIds;
        }

        const newSheetMusicImageFile = files['sheetMusicImage'] ? files['sheetMusicImage'][0] : undefined;
        if (newSheetMusicImageFile) {
            deleteFileIfExists(existingLesson.sheetMusicImageUrl);
            updatedData.sheetMusicImageUrl = `/uploads/lessons/${newSheetMusicImageFile.filename}`;
        } else if (req.body.sheetMusicImageUrl === '' || req.body.sheetMusicImageUrl === 'null') {
            deleteFileIfExists(existingLesson.sheetMusicImageUrl);
            updatedData.sheetMusicImageUrl = undefined;
        } else if (existingLesson.sheetMusicImageUrl && req.body.sheetMusicImageUrl === undefined) {
            updatedData.sheetMusicImageUrl = existingLesson.sheetMusicImageUrl;
        } else {
            updatedData.sheetMusicImageUrl = undefined;
        }


        const newAudioLessonFile = files['audioFile'] ? files['audioFile'][0] : undefined;
        if (newAudioLessonFile) {
            deleteFileIfExists(existingLesson.audioUrl);
            updatedData.audioUrl = `/uploads/lessons/${newAudioLessonFile.filename}`;
        } else if (req.body.audioUrl === '' || req.body.audioUrl === 'null') {
            deleteFileIfExists(existingLesson.audioUrl);
            updatedData.audioUrl = undefined;
        } else if (existingLesson.audioUrl && req.body.audioUrl === undefined) {
            updatedData.audioUrl = existingLesson.audioUrl;
        } else {
            updatedData.audioUrl = undefined;
        }

        const updatedLessonResult: Lesson | null = await updateLessonService(id, updatedData);

        if (!updatedLessonResult) {
            res.status(404).json({ message: `Lecția cu ID ${id} nu a fost găsită sau nu a putut fi actualizată.` });
            return;
        }

        res.status(200).json({
            message: "Lecție actualizată cu succes.",
            data: updatedLessonResult,
        });

    } catch (error) {
        console.error(`Eroare la actualizarea lecției cu ID ${id}:`, error);
        if (error instanceof multer.MulterError) {
            res.status(400).json({ message: `Eroare la încărcarea fișierului: ${error.message}` });
        } else if (error instanceof Error && error.message.includes("ID-ul lecției nu este valid")) {
            res.status(400).json({ message: `Eroare: ID-ul lecției nu este valid.` });
        } else {
            res.status(500).json({
                error: `A eșuat actualizarea lecției cu ID ${id}.`,
                details: error instanceof Error ? error.message : error,
            });
        }
    }
};

export const deleteLessonById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        if (!id) {
            res.status(400).json({ message: "ID-ul lecției nu a fost furnizat în cerere." });
            return;
        }

        const lessonToDelete = await getLessonByIdService(id);
        if (!lessonToDelete) {
            res.status(404).json({ message: `Lecția cu ID ${id} nu a fost găsită.` });
            return;
        }

        const isDeleted: boolean = await deleteLessonService(id);

        if (!isDeleted) {
            res.status(500).json({ message: `Lecția cu ID ${id} nu a putut fi ștearsă din baza de date.` });
            return;
        }

        deleteFileIfExists(lessonToDelete.sheetMusicImageUrl);
        deleteFileIfExists(lessonToDelete.audioUrl);

        res.status(200).json({
            message: "Lecție ștearsă cu succes, inclusiv fișierele asociate.",
            data: true,
        });
    } catch (error) {
        console.error(`Eroare la ștergerea lecției cu ID ${id}:`, error);
        const statusCode = (error instanceof Error && error.message.includes("nu a fost găsită")) ? 404 :
            (error instanceof Error && error.message.includes("ID-ul lecției nu este valid")) ? 400 : 500;
        res.status(statusCode).json({
            error: `A eșuat ștergerea lecției cu ID ${id}.`,
            details: error instanceof Error ? error.message : error,
        });
    }
};

export const uploadLessonAudio = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Niciun fișier audio nu a fost încărcat sau tipul fișierului este nepermis.' });
            return;
        }

        const lessonId = req.params.id;
        // ATENTIE: Aceasta cale este pentru audio-urile ÎNCĂRCATE DE UTILIZATOR (ex: înregistrări)
        // care se presupune că merg într-un folder 'audio_recordings', nu 'lessons'.
        const audioPath = `/uploads/audio_recordings/${req.file.filename}`;

        if (!lessonId) {
            res.status(400).json({ message: 'ID-ul lecției nu a fost furnizat.' });
            return;
        }

        const updatedLesson = await uploadLessonAudioService(lessonId, audioPath);

        if (!updatedLesson) {
            res.status(404).json({ message: 'Lecția nu a fost găsită pentru a-i asocia înregistrarea audio.' });
            return;
        }

        res.status(200).json({
            message: 'Înregistrare audio încărcată cu succes!',
            audioUrl: audioPath,
            lesson: updatedLesson
        });

    } catch (error) {
        console.error('Eroare la încărcarea înregistrării audio în controller:', error);
        if (error instanceof multer.MulterError) {
            res.status(400).json({ message: `Eroare la încărcarea fișierului: ${error.message}` });
        } else if (error instanceof Error) {
            const statusCode = error.message.includes('ID-ul lecției nu este valid.') ? 400 : 500;
            res.status(statusCode).json({ message: `Eroare server: ${error.message}` });
        } else {
            res.status(500).json({ message: 'Eroare internă a serverului la încărcarea audio.' });
        }
    }
};
