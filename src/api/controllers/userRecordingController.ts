// src/api/controllers/userRecordingController.ts

import { Request, Response, NextFunction } from 'express';
import {
    saveUserRecordingService,
    getUserRecordingsByLessonAndUserService, // Utilizat pentru GET /:lessonId/my-recordings și pentru verificare la POST
    deleteUserRecordingService,
    getUserRecordingByIdService, // Importat pentru a obține calea fișierului înainte de ștergere
    getUserRecordingsByUserService // <--- ACEST IMPORT LIPSEA ÎN CODUL TĂU, CAUZÂND EROAREA!
} from '../../domain/services/userRecordingService';
import fs from 'fs';
import path from 'path';

// Directorul unde sunt salvate înregistrările utilizatorilor
const AUDIO_RECORDINGS_BASE_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'audio_recordings'); // Asigură-te că aceasta este calea corectă

/**
 * Șterge fizic un fișier de înregistrare al utilizatorului de pe disc.
 * @param relativePath - Calea relativă a fișierului (ex: /uploads/audio_recordings/nume_fisier.mp3).
 */
const deleteUserRecordingFileIfExists = (relativePath: string | undefined) => {
    if (relativePath) {
        // Extragem numele fișierului din calea URL
        const fileName = path.basename(relativePath);
        const absolutePath = path.join(AUDIO_RECORDINGS_BASE_DIR, fileName);

        fs.unlink(absolutePath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.warn(`USER RECORDING CONTROLLER WARNING: Fișierul înregistrare utilizator nu există la ștergere: ${absolutePath}`);
                } else {
                    console.error(`USER RECORDING CONTROLLER ERROR: Eroare la ștergerea fișierului înregistrare utilizator ${absolutePath}:`, err);
                }
            } else {
                console.log(`USER RECORDING CONTROLLER INFO: Fișierul înregistrare utilizator șters cu succes: ${absolutePath}`);
            }
        });
    }
};


/**
 * @route POST /api/user-recordings/:lessonId
 * @desc Încarcă o înregistrare audio a utilizatorului pentru o anumită lecție.
 * @access Privat (necesită autentificare)
 */
export const uploadUserRecording = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id; 

        if (!userId) {
            res.status(401).json({ message: 'Nu sunteți autentificat pentru a încărca o înregistrare.' });
            return;
        }

        const lessonId = req.params.lessonId; 
        
        if (!req.file) {
            res.status(400).json({ message: 'Niciun fișier audio nu a fost încărcat sau tipul fișierului este nepermis.' });
            return;
        }

        const audioUrl = `/uploads/audio_recordings/${req.file.filename}`;

        console.log(`USER RECORDING CONTROLLER DEBUG: Tentativă de salvare înregistrare pentru userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

        // Verificăm dacă există deja o înregistrare pentru această lecție și utilizator pentru a șterge fișierul fizic vechi
        const existingRecordings = await getUserRecordingsByLessonAndUserService(userId, lessonId);
        if (existingRecordings && existingRecordings.length > 0) {
            console.log(`USER RECORDING CONTROLLER DEBUG: S-a găsit o înregistrare existentă pentru userId: ${userId}, lessonId: ${lessonId}. Se șterge fișierul vechi.`);
            deleteUserRecordingFileIfExists(existingRecordings[0].audioUrl); 
        }

        const newRecording = await saveUserRecordingService(userId, lessonId, audioUrl);

        res.status(201).json({
            message: 'Înregistrarea utilizatorului a fost salvată cu succes!',
            data: newRecording,
        });

    } catch (error: any) { // Explicitly type error as 'any' or 'unknown' for safer error handling
        console.error('USER RECORDING CONTROLLER ERROR (uploadUserRecording): Eroare la încărcarea înregistrării utilizatorului:', error);
        if (error instanceof Error) {
            const statusCode = error.message.includes('nu a fost găsită') ? 404 : 500;
            res.status(statusCode).json({ message: `Eroare: ${error.message}` });
        } else {
            res.status(500).json({ message: 'Eroare internă a serverului la încărcarea înregistrării.' });
        }
    }
};

/**
 * @route GET /api/user-recordings/:lessonId/my-recordings
 * @desc Preia toate înregistrările utilizatorului pentru o lecție specifică.
 * @access Private (Auth user)
 */
export const getUserRecordingsForLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const userId = req.user?.id; 

        if (!userId) {
            res.status(401).json({ message: 'Neautentificat. Vă rugăm să vă autentificați.' });
            return;
        }

        console.log(`CONTROLLER DEBUG (getUserRecordingsForLesson): Caut înregistrări pentru userId: ${userId}, lessonId: ${lessonId}`);
        const recordings = await getUserRecordingsByLessonAndUserService(userId, lessonId);

        res.status(200).json({
            message: `Înregistrările utilizatorului pentru lecția ${lessonId} au fost recuperate cu succes.`,
            data: recordings,
        });

    } catch (error) {
        console.error('CONTROLLER ERROR (getUserRecordingsForLesson): Eroare la preluarea înregistrărilor utilizatorului pentru lecție:', error);
        next(error);
    }
};


/**
 * @route GET /api/user-recordings/me
 * @desc Obține toate înregistrările audio ale utilizatorului autentificat.
 * @access Privat (necesită autentificare)
 */
export const getUserRecordingsMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id; 

        if (!userId) {
            res.status(401).json({ message: 'Nu sunteți autentificat.' });
            return;
        }

        console.log(`USER RECORDING CONTROLLER DEBUG: Tentativă de a obține înregistrări pentru userId: ${userId}`);
        const recordings = await getUserRecordingsByUserService(userId);

        res.status(200).json({
            message: 'Înregistrările utilizatorului au fost recuperate cu succes.',
            data: recordings,
        });

    } catch (error: any) {
        console.error('USER RECORDING CONTROLLER ERROR (getUserRecordingsMe): Eroare la obținerea înregistrărilor utilizatorului:', error);
        res.status(500).json({ message: 'Eroare internă a serverului la obținerea înregistrărilor.' });
    }
};

/**
 * @route DELETE /api/user-recordings/:recordingId
 * @desc Șterge o înregistrare audio a utilizatorului.
 * @access Privat (necesită autentificare, doar proprietarul poate șterge)
 */
export const deleteUserRecording = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const recordingId = req.params.recordingId;

        if (!userId) {
            res.status(401).json({ message: 'Nu sunteți autentificat pentru a șterge o înregistrare.' });
            return;
        }

        if (!recordingId) {
            res.status(400).json({ message: 'ID-ul înregistrării nu a fost furnizat.' });
            return;
        }
        
        console.log(`USER RECORDING CONTROLLER DEBUG: Tentativă de ștergere înregistrare ${recordingId} de către utilizatorul ${userId}`);

        // Preluăm înregistrarea pentru a obține calea fișierului înainte de a o șterge din DB
        // Utilizăm getUserRecordingByIdService pentru a obține detaliile exacte ale înregistrării
        const recordingDetails = await getUserRecordingByIdService(recordingId); // <-- Această linie este corectă

        // Verificăm dacă înregistrarea există și dacă utilizatorul este proprietarul
        if (!recordingDetails || recordingDetails.userId !== userId) {
            res.status(404).json({ message: 'Înregistrarea nu a fost găsită sau nu sunteți autorizat să o ștergeți.' });
            return;
        }

        const deleted = await deleteUserRecordingService(recordingId, userId);

        if (deleted) {
            // Dacă ștergerea din DB a avut succes, ștergem și fișierul fizic
            deleteUserRecordingFileIfExists(recordingDetails?.audioUrl);
            res.status(200).json({ message: 'Înregistrarea a fost ștearsă cu succes.' });
        } else {
            res.status(404).json({ message: 'Înregistrarea nu a fost găsită sau nu a putut fi ștearsă.' });
        }

    } catch (error: any) {
        console.error('USER RECORDING CONTROLLER ERROR (deleteUserRecording): Eroare la ștergerea înregistrării:', error);
        if (error instanceof Error) {
            const statusCode = error.message.includes('nu a fost găsită') ? 404 :
                               error.message.includes('Nu sunteți autorizat') ? 403 : 500;
            res.status(statusCode).json({ message: `Eroare: ${error.message}` });
        } else {
            res.status(500).json({ message: 'Eroare internă a serverului la ștergerea înregistrării.' });
        }
    }
};
