import { Request, Response } from "express";
import {
  createLessonService,
  deleteLessonByIdService,
  getLessonByIdService,
  getLessonListService,
  updateLessonService,
} from "../../domain/services/lessonService"; // Importă funcțiile din service
import { Lesson } from "../../models/interfaces/lesson"; // Importă interfața Lesson

// Controller pentru a obține lista de lecții
export const getLessonList = async (req: Request, res: Response) => {
  try {
    const lessons: Lesson[] = await getLessonListService();

    res.status(200).json({ // Fără 'return' aici, la fel ca la productController
      message: "Lista de lecții recuperată cu succes.",
      data: lessons,
    });
  } catch (error) {
    console.error("Eroare la obținerea listei de lecții:", error);
    res.status(500).json({ // Fără 'return' aici, la fel ca la productController
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
      throw new Error("ID-ul lecției nu a fost furnizat în cerere."); // Folosim throw new Error, ca la product
    }

    const lesson: Lesson | null = await getLessonByIdService(id);

    // Verificăm dacă lecția a fost găsită. Dacă nu, aruncăm o eroare care va fi prinsă de blocul catch.
    if (!lesson) {
        throw new Error(`Lecția cu ID ${id} nu a fost găsită.`); // Folosim throw new Error
    }

    res.status(200).json({
      message: "Lecție găsită.",
      data: lesson,
    });
  } catch (error) {
    console.error(`Eroare la obținerea lecției cu ID ${id}:`, error);
    // Verificăm dacă eroarea este de tip 404 (nu a fost găsită lecția)
    const statusCode = error instanceof Error && error.message.includes("nu a fost găsită") ? 404 : 500;
    res.status(statusCode).json({
      error: `A eșuat obținerea lecției cu ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Controller pentru a crea o nouă lecție
export const createLesson = async (req: Request, res: Response) => {
  const lessonData = req.body;
  try {
    const newLesson: Lesson = await createLessonService(lessonData); // Folosim service-ul, nu direct repository

    res.status(201).json({ // Fără 'return' aici
      message: "Lecție creată cu succes.",
      data: newLesson,
    });
  } catch (error) {
    console.error("Eroare la crearea unei noi lecții:", error);
    res.status(500).json({ // Fără 'return' aici
      error: "A eșuat crearea unei noi lecții.",
      details: error instanceof Error ? error.message : error,
    });
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


    // Verificăm dacă lecția a fost găsită și actualizată.
    if (!updatedLesson) { // <-- Aceasta este linia problematică
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
      throw new Error("ID-ul lecției nu a fost furnizat în cerere."); // Folosim throw new Error
    }

    const isDeleted: boolean = await deleteLessonByIdService(id);

    if (!isDeleted) {
      // Aceasta poate însemna fie că nu a fost găsită, fie că a eșuat ștergerea
      throw new Error(`Lecția cu ID ${id} nu a putut fi ștearsă sau nu a fost găsită.`); // Folosim throw new Error
    }

    res.status(200).json({ // Fără 'return' aici
      message: "Lecție ștearsă cu succes.",
      data: true,
    });
  } catch (error) {
    console.error(`Eroare la ștergerea lecției cu ID ${id}:`, error);
    // Verificăm dacă eroarea este de tip 404 (nu a fost găsită lecția)
    const statusCode = error instanceof Error && error.message.includes("nu a putut fi ștearsă sau nu a fost găsită") ? 404 : 500;
    res.status(statusCode).json({
      error: `A eșuat ștergerea lecției cu ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};