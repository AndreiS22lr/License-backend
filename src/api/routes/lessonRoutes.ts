import express from "express";
import {
  createLesson,
  deleteLessonById,
  getLessonById,
  getLessonList,
  updateLesson,
} from "../controllers/lessonController";

const router = express.Router();

// Definirea rutelor HTTP și asocierea lor cu funcțiile controllerului
router.get("/", getLessonList); // GET /lessons - obține toate lecțiile
router.get("/:id", getLessonById); // GET /lessons/:id - obține o lecție după ID
router.post("/create", createLesson); // POST /lessons/create - creează o nouă lecție
router.put("/update/:id", updateLesson); // PUT /lessons/update/:id - actualizează o lecție după ID
router.delete("/delete/:id", deleteLessonById); // DELETE /lessons/delete/:id - șterge o lecție după ID

export default router;