import bodyParser from "body-parser";
import express from "express";
import { errorHandler } from "./core/middlewares/errorHandler";
import router from "./api/routes";
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORECTIE CHEIE AICI: Servirea fișierelor statice (upload-uri) ---
// Directorul rădăcină unde vor fi fișierele tale încărcate.
// Acum, calea va indica 'your-project/uploads' (din rădăcina proiectului).
// `__dirname` în `src/app.ts` este 'your-project/src/'
// '..' te duce un nivel mai sus, la 'your-project/'. Apoi adăugăm 'uploads'.
const UPLOADS_BASE_DIR = path.join(__dirname, '..', 'uploads'); // <-- MODIFICAT AICI

// Creează directorul 'uploads' (în rădăcina proiectului) dacă nu există
if (!fs.existsSync(UPLOADS_BASE_DIR)) {
    fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
    console.log(`Directorul de bază 'uploads' a fost creat la: ${UPLOADS_BASE_DIR}`);
}

// Servim directorul de upload-uri sub calea '/uploads'
app.use('/uploads', express.static(UPLOADS_BASE_DIR)); // Această cale URL rămâne neschimbată pentru frontend

// Rute API
app.get("/", (req, res) => {
  res.send("Hello World - Backend API is running!");
});

app.use("/api", router);

// Middleware - Route
// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
