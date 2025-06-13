// src/api/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import { registerUser, authenticateUser } from '../../domain/services/authService';
import jwt from 'jsonwebtoken'; // Importăm jsonwebtoken
import dotenv from 'dotenv'; // Pentru a încărca JWT_SECRET din .env

dotenv.config(); // Încarcă variabilele de mediu din .env

// Asigură-te că JWT_SECRET este definit
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Eroare: Variabila de mediu JWT_SECRET nu este definită!');
  // În aplicații de producție, ar trebui să oprești serverul sau să arunci o eroare
  // throw new Error('JWT_SECRET not defined');
}

/**
 * @route POST /api/auth/register
 * @desc Înregistrează un nou utilizator.
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, role } = req.body; // Poți prelua și rolul dacă vrei să permiți înregistrarea de admini direct

  // Validare de bază a input-ului
  if (!email || !password) {
    res.status(400).json({ message: 'Email-ul și parola sunt obligatorii.' });
    return;
  }
  if (typeof email !== 'string' || typeof password !== 'string' || (role && typeof role !== 'string')) {
      res.status(400).json({ message: 'Tipuri de date invalide pentru email, parolă sau rol.' });
      return;
  }
  if (password.length < 6) { // O simplă verificare a lungimii minime a parolei
      res.status(400).json({ message: 'Parola trebuie să aibă cel puțin 6 caractere.' });
      return;
  }

  try {
    // Rolul implicit va fi 'user' dacă nu este specificat sau este invalid
    const userRole = (role === 'admin' && process.env.NODE_ENV === 'development') ? 'admin' : 'user'; // Permite înregistrarea de admini doar în dev, pentru producție se face altfel
    const newUser = await registerUser(email, password, userRole);

    if (!newUser) {
      res.status(409).json({ message: 'Utilizatorul cu acest email există deja.' }); // 409 Conflict
      return;
    }

    // Returnăm utilizatorul creat (fără parolă)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Utilizator înregistrat cu succes!', user: userWithoutPassword }); // 201 Created

  } catch (error) {
    console.error('CONTROLLER ERROR (register):', error);
    next(error); // Trimite eroarea către un eventual middleware global de erori
  }
};

/**
 * @route POST /api/auth/login
 * @desc Autentifică un utilizator și returnează un token JWT.
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email-ul și parola sunt obligatorii.' });
    return;
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ message: 'Tipuri de date invalide pentru email sau parolă.' });
      return;
  }

  try {
    const user = await authenticateUser(email, password);

    if (!user) {
      res.status(401).json({ message: 'Email sau parolă incorectă.' }); // 401 Unauthorized
      return;
    }

    // Generează un token JWT
    // Conține payload-ul (datele utilizatorului), secretul și opțiunile (ex: expirare)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // Payload-ul token-ului
      JWT_SECRET as string, // Secretul
      { expiresIn: '1h' } // Token-ul expiră după 1 oră
    );

    // Returnează token-ul și detaliile utilizatorului (fără parolă)
    res.status(200).json({ message: 'Autentificare reușită!', token, user });

  } catch (error) {
    console.error('CONTROLLER ERROR (login):', error);
    next(error); // Trimite eroarea către un eventual middleware global de erori
  }
};