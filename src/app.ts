import bodyParser from "body-parser";
import express from "express";
import { errorHandler } from "./core/middlewares/errorHandler";
import router from "./api/routes";
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOADS_BASE_DIR = path.join(__dirname, '..', 'uploads'); 


if (!fs.existsSync(UPLOADS_BASE_DIR)) {
    fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
    console.log(`Directorul de bază 'uploads' a fost creat la: ${UPLOADS_BASE_DIR}`);
}


app.use('/uploads', express.static(UPLOADS_BASE_DIR)); 


app.get("/", (req, res) => {
  res.send("Hello World - Backend API is running!");
});

app.use("/api", router);


app.use(errorHandler);

export default app;
