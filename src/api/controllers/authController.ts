// src/api/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import { registerUser, authenticateUser } from '../../domain/services/authService'; 
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv'; 

dotenv.config(); 

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
  const { firstName, lastName, email, password, role } = req.body; // MODIFICAT: Preluăm firstName și lastName din body

  // Validare de bază a input-ului (acum include nume și prenume)
  if (!firstName || !lastName || !email || !password) { 
    res.status(400).json({ message: 'Toate câmpurile (Nume, Prenume, Email, Parolă) sunt obligatorii.' });
    return;
  }
  if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || (role && typeof role !== 'string')) {
      res.status(400).json({ message: 'Tipuri de date invalide pentru câmpurile de înregistrare.' });
      return;
  }
  // MODIFICAT: Lungimea minimă a parolei la 8 caractere pentru o securitate sporită
  if (password.length < 8) { 
      res.status(400).json({ message: 'Parola trebuie să aibă cel puțin 8 caractere.' });
      return;
  }

  try {
    // Rolul implicit va fi 'user' dacă nu este specificat sau este invalid
    // Permitem crearea de admini doar în development, pentru a evita abuzurile în producție
    const userRole = (role === 'admin' && process.env.NODE_ENV === 'development') ? 'admin' : 'user'; 
    
    // MODIFICAT: Apelăm registerUser cu firstName și lastName
    const newUser = await registerUser(firstName, lastName, email, password, userRole);

    if (!newUser) {
      res.status(409).json({ message: 'Utilizatorul cu acest email există deja.' }); 
      return;
    }

    // Generează un token JWT pentru noul utilizator și îl trimite automat autentificat
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role }, 
      JWT_SECRET as string, 
      { expiresIn: '1h' } 
    );

    // Returnăm utilizatorul creat (fără parolă) și token-ul
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      message: 'Utilizator înregistrat cu succes!', 
      user: userWithoutPassword,
      token 
    }); 

  } catch (error) {
    console.error('CONTROLLER ERROR (register):', error);
    next(error); 
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
      res.status(401).json({ message: 'Email sau parolă incorectă.' }); 
      return;
    }

    // Generează un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET as string, 
      { expiresIn: '1h' } 
    );

    // Returnează token-ul și detaliile utilizatorului (fără parolă)
    res.status(200).json({ message: 'Autentificare reușită!', token, user });

  } catch (error) {
    console.error('CONTROLLER ERROR (login):', error);
    next(error); 
  }
};
