// src/api/routes/lessonRoutes.ts

import express from "express";
import {
    createLesson,
    deleteLessonById,
    getLessonById,
    getLessonList,
    updateLesson,
    uploadLessonAudio,
} from "../controllers/lessonController";

import { authenticate, authorizeAdmin } from '../../core/middlewares/authMiddleware';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Definește directorul de bază unde Multer va salva fișierele uploadate.
const UPLOADS_ROOT_DIR = path.join(__dirname, '..', '..', '..', 'uploads');
const LESSONS_SPECIFIC_DIR = path.join(UPLOADS_ROOT_DIR, 'lessons'); 

// Creează directoarele dacă nu există
if (!fs.existsSync(UPLOADS_ROOT_DIR)) {
    fs.mkdirSync(UPLOADS_ROOT_DIR, { recursive: true });
    console.log(`Directorul de bază 'uploads' a fost creat la: ${UPLOADS_ROOT_DIR}`);
}
if (!fs.existsSync(LESSONS_SPECIFIC_DIR)) {
    fs.mkdirSync(LESSONS_SPECIFIC_DIR, { recursive: true });
    console.log(`Directorul specific 'uploads/lessons' a fost creat la: ${LESSONS_SPECIFIC_DIR}`);
}

const lessonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, LESSONS_SPECIFIC_DIR); 
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); 
    }
});

const uploadLessons = multer({
    storage: lessonStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Limită dimensiune fișier: 20 MB
    },
});


// Rute Publice (nu necesită autentificare)
router.get("/", getLessonList);
router.get("/:id", getLessonById);

// Rute Protejate (necesită autentificare și rol de admin)
router.post("/create",
    authenticate,
    authorizeAdmin,
    uploadLessons.fields([
        { name: 'sheetMusicImage', maxCount: 1 },
        { name: 'audioFile', maxCount: 1 },
        { name: 'title' },           // Adaugă câmpurile text
        { name: 'order' },           // Adaugă câmpurile text
        { name: 'theoryContent' },   // Adaugă câmpurile text
        { name: 'quizQuestions' }    // <-- CRUCIAL: Adaugă câmpul pentru quiz! (folosește numele din frontend)
    ]),
    createLesson
);

router.put("/:id",
    authenticate,
    authorizeAdmin,
    uploadLessons.fields([
        { name: 'sheetMusicImage', maxCount: 1 },
        { name: 'audioFile', maxCount: 1 },
        { name: 'title' },           // Adaugă câmpurile text
        { name: 'order' },           // Adaugă câmpurile text
        { name: 'theoryContent' },   // Adaugă câmpurile text
        { name: 'quizQuestions' }    // <-- CRUCIAL: Adaugă câmpul pentru quiz!
    ]),
    updateLesson
);

router.delete("/:id",
    authenticate,
    authorizeAdmin,
    deleteLessonById
);

import uploadAudio from '../../core/config/multerConfig';

// RUTA PENTRU ÎNCĂRCĂRILE AUDIO ALE UTILIZATORULUI
router.post("/:id/upload-audio", authenticate, uploadAudio.single('audioFile'), uploadLessonAudio);


export default router;