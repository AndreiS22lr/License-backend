// src/api/routes/lessonRoutes.ts

import express from "express";
import {
    createLesson,
    deleteLessonById,
    getLessonById,
    getLessonList,
    updateLesson,
    uploadLessonAudio, // Aceasta este pentru audio-ul utilizatorilor sau actualizări separate
} from "../controllers/lessonController";

import { authenticate, authorizeAdmin } from '../../core/middlewares/authMiddleware';
// NU mai importăm `uploadAudio` din `multerConfig` aici pentru ruta de creare,
// deoarece are un filtru specific doar pentru audio.
// import uploadAudio from '../../core/config/multerConfig'; 

import multer from 'multer'; // Importă multer
import path from 'path';     // Importă path
import fs from 'fs';         // Importă fs pentru a crea directorul

const router = express.Router();

// --- NOU: Configurare Multer specifică pentru fișierele lecției (imagine + audio) ---
// Directorul unde vor fi stocate fișierele pentru lecții (imagini și audio)
const LESSON_UPLOADS_DIR = path.join(__dirname, '../../uploads/lessons'); // Ajustează calea la rădăcina proiectului backend

// Creează directorul 'uploads/lessons' dacă nu există
if (!fs.existsSync(LESSON_UPLOADS_DIR)) {
    fs.mkdirSync(LESSON_UPLOADS_DIR, { recursive: true });
    console.log(`Directorul 'uploads/lessons' a fost creat la: ${LESSON_UPLOADS_DIR}`);
}

const lessonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, LESSON_UPLOADS_DIR); // Fișierele lecției vor fi salvate aici
    },
    filename: function (req, file, cb) {
        // Generează un nume de fișier unic bazat pe fieldname (image/audio)
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Instanța Multer pentru upload-uri de lecții (care poate gestiona multiple tipuri de fișiere)
const uploadLessons = multer({
    storage: lessonStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Limită dimensiune fișier: 20 MB (poți ajusta)
    },
    // Nu mai este nevoie de fileFilter aici, deoarece acceptăm mai multe tipuri de fișiere
    // Poți adăuga un filtru mai general dacă vrei să limitezi la imagini și audio
});


// Rute Publice (nu necesită autentificare)
router.get("/", getLessonList);
router.get("/:id", getLessonById);

// Rute Protejate (necesită autentificare și rol de admin)
router.post("/create",
    authenticate,
    authorizeAdmin,
    // Folosim noua instanță `uploadLessons` și `fields` pentru ambele fișiere
    uploadLessons.fields([
        { name: 'sheetMusicImage', maxCount: 1 }, // Câmpul pentru imagine
        { name: 'audioFile', maxCount: 1 }        // Câmpul pentru audio
    ]),
    createLesson // Controller-ul care va primi acum și fișierele
);

router.put("/update/:id", authenticate, authorizeAdmin, updateLesson);
router.delete("/delete/:id", authenticate, authorizeAdmin, deleteLessonById);

// IMPORTANT: Ruta existentă pentru upload audio (probabil pentru înregistrări utilizator)
// va folosi în continuare `uploadAudio` din `multerConfig.ts`
// Presupunând că `uploadAudio` este importat corect din `multerConfig.ts`
// Te rog să re-importezi `uploadAudio` dacă ai șters-o anterior.
import uploadAudio from '../../core/config/multerConfig'; // Re-importă uploadAudio

router.post("/:id/upload-audio", authenticate, authorizeAdmin, uploadAudio.single('audioFile'), uploadLessonAudio);


export default router;