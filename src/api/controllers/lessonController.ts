// src/api/controllers/lessonController.ts

import { Request, Response } from "express";
import {
    createLessonService,
    deleteLessonByIdService,
    getLessonByIdService,
    getLessonListService,
    updateLessonService,
    uploadLessonAudioService, // Acest import rămâne, folosit pentru ruta de upload audio separată
} from "../../domain/services/lessonService";
import { Lesson } from "../../models/interfaces/lesson"; // Importă interfața Lesson
import multer from 'multer'; // Importă Multer pentru a gestiona erorile specifice

// Controller pentru a obține lista de lecții
export const getLessonList = async (req: Request, res: Response) => {
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

// Controller pentru a obține o lecție după ID
export const getLessonById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        if (!id) {
            throw new Error("ID-ul lecției nu a fost furnizat în cerere.");
        }

        const lesson: Lesson | null = await getLessonByIdService(id);

        if (!lesson) {
            throw new Error(`Lecția cu ID ${id} nu a fost găsită.`);
        }

        res.status(200).json({
            message: "Lecție găsită.",
            data: lesson,
        });
    } catch (error) {
        console.error(`Eroare la obținerea lecției cu ID ${id}:`, error);
        const statusCode = error instanceof Error && error.message.includes("nu a fost găsită") ? 404 : 500;
        res.status(statusCode).json({
            error: `A eșuat obținerea lecției cu ID ${id}.`,
            details: error instanceof Error ? error.message : error,
        });
    }
};

// Controller pentru a crea o nouă lecție (acum gestionează și fișiere)
export const createLesson = async (req: Request, res: Response) => {
    try {
        // req.body conține câmpurile text (title, order, theoryContent)
        const { title, order, theoryContent } = req.body;

        // req.files va conține informații despre fișierele încărcate de multer.fields()
        // Facem un cast pentru a lucra mai ușor cu tipurile TypeScript
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[]
        };

        const sheetMusicImageFile = files['sheetMusicImage'] ? files['sheetMusicImage'][0] : undefined;
        const audioLessonFile = files['audioFile'] ? files['audioFile'][0] : undefined;

        // Construim căile relative pentru stocare în baza de date
        // ATENȚIE: Calea este acum '/uploads/lessons/' (din cauza configurării multer în lessonRoutes.ts)
        const sheetMusicImageUrl = sheetMusicImageFile ? `/uploads/lessons/${sheetMusicImageFile.filename}` : undefined;
        const audioUrl = audioLessonFile ? `/uploads/lessons/${audioLessonFile.filename}` : undefined;

        // Creează obiectul lessonData, incluzând URL-urile fișierelor
        const lessonData = {
            title,
            order: parseInt(order as string), // Asigură-te că order este un număr
            theoryContent,
            sheetMusicImageUrl, // Acum trimitem și URL-ul imaginii
            audioUrl,           // Și URL-ul audio-ului lecției
            // quizIds vor fi adăugate separat dacă e cazul sau în logică ulterioară
        };

        const newLesson: Lesson = await createLessonService(lessonData);

        res.status(201).json({
            message: "Lecție creată cu succes.",
            data: newLesson,
        });

    } catch (error) {
        console.error("CONTROLLER ERROR: Eroare la crearea lecției:", error);
        // Gestionăm erorile de Multer specific, dacă apar la încărcare
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

// Controller pentru a actualiza o lecție existentă
export const updateLesson = async (req: Request, res: Response) => {
    const id = req.params.id;
    const partialLessonData = req.body;
    try {
        if (!id) {
            throw new Error("ID-ul lecției nu a fost furnizat în cerere.");
        }

        const updatedLesson: Lesson | null = await updateLessonService(id, partialLessonData);

        console.log("CONTROLLER - Valoarea lui updatedLesson după service:", updatedLesson);
        console.log("CONTROLLER - Este updatedLesson null?", updatedLesson === null);
        console.log("CONTROLLER - Este updatedLesson undefined?", updatedLesson === undefined);
        console.log("CONTROLLER - Este updatedLesson un obiect?", typeof updatedLesson === 'object' && updatedLesson !== null);

        if (!updatedLesson) {
            throw new Error(`Lecția cu ID ${id} nu a fost găsită sau nu a putut fi actualizată.`);
        }

        res.status(200).json({
            message: "Lecție actualizată cu succes.",
            data: updatedLesson,
        });
    } catch (error) {
        console.error(`Eroare la actualizarea lecției cu ID ${id}:`, error);
        const statusCode = error instanceof Error && error.message.includes("nu a fost găsită") ? 404 : 500;
        res.status(statusCode).json({
            error: `A eșuat actualizarea lecției cu ID ${id}.`,
            details: error instanceof Error ? error.message : error,
        });
    }
};

// Controller pentru a șterge o lecție
export const deleteLessonById = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        if (!id) {
            throw new Error("ID-ul lecției nu a fost furnizat în cerere.");
        }

        const isDeleted: boolean = await deleteLessonByIdService(id);

        if (!isDeleted) {
            throw new Error(`Lecția cu ID ${id} nu a putut fi ștearsă sau nu a fost găsită.`);
        }

        res.status(200).json({
            message: "Lecție ștearsă cu succes.",
            data: true,
        });
    } catch (error) {
        console.error(`Eroare la ștergerea lecției cu ID ${id}:`, error);
        const statusCode = error instanceof Error && error.message.includes("nu a putut fi ștearsă sau nu a fost găsită") ? 404 : 500;
        res.status(statusCode).json({
            error: `A eșuat ștergerea lecției cu ID ${id}.`,
            details: error instanceof Error ? error.message : error,
        });
    }
};


// Controller pentru upload audio (pentru ruta separată, ex. înregistrări utilizator sau update-uri)
export const uploadLessonAudio = async (req: Request, res: Response): Promise<void> => {
    try {
        // Multer procesează fișierul și îl pune pe req.file
        if (!req.file) {
            res.status(400).json({ message: 'Niciun fișier audio nu a fost încărcat sau tipul fișierului este nepermis.' });
            return;
        }

        const lessonId = req.params.id; // Obține ID-ul lecției din URL
        // ATENȚIE: req.file.path este calea absolută pe disc.
        // Pentru a salva în DB, vrem calea relativă publică (ex: /uploads/audio_recordings/nume_fisier.mp3)
        // Deci trebuie să ajustăm aici, bazându-ne pe cum e configurat `uploadAudio` în `multerConfig.ts`
        const audioPath = `/uploads/audio_recordings/${req.file.filename}`; // Calea publică pentru fișierul audio al userului

        if (!lessonId) {
            res.status(400).json({ message: 'ID-ul lecției nu a fost furnizat.' });
            return;
        }

        // Apelează service-ul pentru a actualiza calea audio
        const updatedLesson = await uploadLessonAudioService(lessonId, audioPath);

        if (!updatedLesson) {
            res.status(404).json({ message: 'Lecția nu a fost găsită pentru a-i asocia înregistrarea audio.' });
            return;
        }

        res.status(200).json({
            message: 'Înregistrare audio încărcată cu succes!',
            audioUrl: audioPath, // Calea relativă a fișierului pe server
            lesson: updatedLesson // Lecția actualizată returnată de service
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