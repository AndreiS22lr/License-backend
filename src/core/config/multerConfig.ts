// src/core/config/multerConfig.ts

import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const UPLOAD_DIR = 'uploads/audio_recordings';

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'audio-' + uniqueSuffix + fileExtension);
    }
});

// MODIFICARE AICI: Specifică explicit tipul pentru 'cb'
const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm']; // Tipuri MIME pentru audio
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true); // Acceptă fișierul
    } else {
        // Această linie ar trebui acum să fie acceptată de TypeScript
        cb(new Error('Tip de fișier nepermis. Doar fișiere audio sunt permise!'), false);
    }
};

// Inițializare Multer
const uploadAudio = multer({
    storage: storage,
 fileFilter: fileFilter as any,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limită dimensiune fișier: 10 MB
    }
});

export default uploadAudio;