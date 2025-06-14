// src/api/controllers/userRecordingController.ts

import { Request, Response } from 'express';
import {
    saveUserRecordingService,
    getUserRecordingsByUserService,
    deleteUserRecordingService,
    getUserRecordingByIdService // Importat pentru a obține calea fișierului înainte de ștergere
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
        // Verificăm dacă utilizatorul este autentificat (middleware-ul 'authenticate' se ocupă de asta)
        // userId-ul este adăugat la obiectul Request de către middleware-ul de autentificare
        const userId = req.user?.id; // req.user este de tip `any` sau ar trebui extins tipul `Request`

        if (!userId) {
            res.status(401).json({ message: 'Nu sunteți autentificat pentru a încărca o înregistrare.' });
            return;
        }

        const lessonId = req.params.lessonId; // ID-ul lecției vine din URL
        
        if (!req.file) {
            res.status(400).json({ message: 'Niciun fișier audio nu a fost încărcat sau tipul fișierului este nepermis.' });
            return;
        }

        // Calea relativă în care fișierul va fi stocat în DB și expus prin URL
        const audioUrl = `/uploads/audio_recordings/${req.file.filename}`;

        console.log(`USER RECORDING CONTROLLER DEBUG: Tentativă de salvare înregistrare pentru userId: ${userId}, lessonId: ${lessonId}, audioUrl: ${audioUrl}`);

        const newRecording = await saveUserRecordingService(userId, lessonId, audioUrl);

        res.status(201).json({
            message: 'Înregistrarea utilizatorului a fost salvată cu succes!',
            data: newRecording,
        });

    } catch (error) {
        console.error('USER RECORDING CONTROLLER ERROR (uploadUserRecording): Eroare la încărcarea înregistrării utilizatorului:', error);
        if (error instanceof Error) {
            // Dacă service-ul a aruncat o eroare cu mesaj specific
            const statusCode = error.message.includes('nu a fost găsită') ? 404 : 500;
            res.status(statusCode).json({ message: `Eroare: ${error.message}` });
        } else {
            res.status(500).json({ message: 'Eroare internă a serverului la încărcarea înregistrării.' });
        }
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

    } catch (error) {
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
        const recordingDetails = await getUserRecordingByIdService(recordingId);

        const deleted = await deleteUserRecordingService(recordingId, userId);

        if (deleted) {
            // Dacă ștergerea din DB a avut succes, ștergem și fișierul fizic
            deleteUserRecordingFileIfExists(recordingDetails?.audioUrl);
            res.status(200).json({ message: 'Înregistrarea a fost ștearsă cu succes.' });
        } else {
            res.status(404).json({ message: 'Înregistrarea nu a fost găsită sau nu a putut fi ștearsă.' });
        }

    } catch (error) {
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
