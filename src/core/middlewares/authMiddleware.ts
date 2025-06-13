// src/api/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb'; // Import ObjectId pentru a reconstrui _id-ul

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Eroare: Variabila de mediu JWT_SECRET nu este definită!');
  //throw new Error('JWT_SECRET not defined'); // În producție, ar trebui să oprești serverul
}

// Extindem interfața Request din Express pentru a include proprietăți personalizate
declare global {
  namespace Express {
    interface Request {
      user?: { // user este opțional pentru a nu sparge rutele publice
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware pentru a verifica autentificarea utilizatorului pe baza unui token JWT.
 * Atașează informațiile utilizatorului (id, email, rol) la obiectul Request.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Verifică header-ul Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('MIDDLEWARE: Autentificare eșuată - Token lipsă sau format incorect.');
    res.status(401).json({ message: 'Autentificare eșuată: Tokenul de autentificare lipsește sau este invalid.' });
    return;
  }

  // 2. Extrage token-ul
  const token = authHeader.split(' ')[1]; // Extrage partea de după 'Bearer '

  try {
    // 3. Verifică și decodează token-ul
    const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string, email: string, role: string, iat: number, exp: number };

    // 4. Atașează informațiile utilizatorului la obiectul Request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    console.log(`MIDDLEWARE: Utilizator autentificat: ${req.user.email} (Rol: ${req.user.role})`);
    next(); // Continuă cu următoarea funcție middleware/controller
  } catch (error) {
    // 5. Gestionează erorile de verificare a token-ului (ex: token expirat, invalid)
    console.error('MIDDLEWARE ERROR (authenticate): Eroare la verificarea token-ului:', error);
    res.status(403).json({ message: 'Autentificare eșuată: Token invalid sau expirat.' });
  }
};

/**
 * Middleware pentru a verifica dacă utilizatorul autentificat are rolul de "admin".
 * Acest middleware ar trebui utilizat *după* middleware-ul 'authenticate'.
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Verifică dacă utilizatorul a fost atașat de middleware-ul 'authenticate'
  if (!req.user) {
    console.warn('MIDDLEWARE: Autorizare eșuată - Utilizator neautentificat. (authorizeAdmin)');
    // Acest caz nu ar trebui să se întâmple dacă 'authenticate' este folosit corect înainte
    res.status(401).json({ message: 'Acces neautorizat: Utilizatorul nu este autentificat.' });
    return;
  }

  // Verifică rolul utilizatorului
  if (req.user.role !== 'admin') {
    console.warn(`MIDDLEWARE: Autorizare eșuată - Utilizatorul ${req.user.email} (Rol: ${req.user.role}) nu este admin.`);
    res.status(403).json({ message: 'Acces interzis: Doar administratorii pot accesa această resursă.' });
    return;
  }

  console.log(`MIDDLEWARE: Utilizator ${req.user.email} autorizat ca admin.`);
  next(); // Utilizatorul este admin, continuă
};