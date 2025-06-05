import {
  createLesson as createLessonRepository,
  deleteLessonById as deleteLessonByIdRepository,
  getLessonById as getLessonByIdRepository,
  getLessonList as getLessonListRepository,
  updateLesson as updateLessonRepository,
} from "../repositories/lessonRepository"; // Importă funcțiile din repository
import { Lesson } from "../../models/interfaces/lesson"; // Importă interfața Lesson

// Funcție de creare a unei lecții
export const createLessonService = async (
  lessonData: Omit<Lesson, "id" | "createdAt" | "updatedAt"> // 'id' este omis, va fi generat de DB
): Promise<Lesson> => {
  // Aici ai putea adăuga logica de business înainte de a salva în DB
  // De exemplu: validări suplimentare, procesare de date, generare de slug-uri etc.
  const newLesson = await createLessonRepository(lessonData);
  return newLesson;
};

// Funcție pentru a obține toate lecțiile
export const getLessonListService = async (): Promise<Lesson[]> => {
  // Poți adăuga aici logică de business, cum ar fi filtrare bazată pe user permissions etc.
  const lessons = await getLessonListRepository();
  return lessons;
};

// Funcție pentru a obține o lecție după ID
export const getLessonByIdService = async (id: string): Promise<Lesson | null> => {
  // Aici poți adăuga validări pentru 'id' dacă este necesar
  const lesson = await getLessonByIdRepository(id); // Repository-ul se ocupă de conversia string -> ObjectId
  return lesson;
};

// Funcție pentru a actualiza o lecție
export const updateLessonService = async (
  id: string,
  partialLesson: Partial<Lesson>
): Promise<Lesson | null> => {
  // Aici poți adăuga validări sau transformări pentru partialLesson
  const updatedLesson = await updateLessonRepository(id, partialLesson); // Repository-ul se ocupă de conversia string -> ObjectId
  return updatedLesson;
};

// Funcție pentru a șterge o lecție după ID
export const deleteLessonByIdService = async (id: string): Promise<boolean> => {
  // Aici poți adăuga logică de business înainte de ștergere (ex: verifică permisiuni)
  const isDeleted = await deleteLessonByIdRepository(id); // Repository-ul se ocupă de conversia string -> ObjectId
  return isDeleted;
};