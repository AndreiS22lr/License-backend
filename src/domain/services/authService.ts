// src/domain/services/authService.ts

import * as bcrypt from 'bcryptjs'; // Importăm bcryptjs
import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository'; // Importăm funcțiile din repository
import { User, UserRole } from "../../models/interfaces/user";
 // Importăm modelul User

const SALT_ROUNDS = 10; // Numărul de runde de sărare pentru hash-uirea parolei (costul procesului)

/**
 * Hash-uiește o parolă dată.
 * @param password - Parola în text clar.
 * @returns Parola hashuită.
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compară o parolă în text clar cu o parolă hashuită.
 * @param plainPassword - Parola în text clar.
 * @param hashedPassword - Parola hashuită stocată.
 * @returns True dacă parolele se potrivesc, false altfel.
 */
const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Înregistrează un nou utilizator.
 * @param email - Email-ul utilizatorului.
 * @param password - Parola utilizatorului (în text clar).
 * @param role - Rolul utilizatorului (implicit 'user').
 * @returns Obiectul utilizatorului creat sau null dacă email-ul există deja.
 */
export const registerUser = async (email: string, password: string, role: UserRole = 'user'): Promise<User | null> => {
  console.log(`SERVICE: Attempting to register user with email: ${email}`);
  // Verifică dacă un utilizator cu acest email există deja
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.warn(`SERVICE WARNING: User with email ${email} already exists.`);
    return null; // Utilizatorul există deja
  }

  // Hash-uiește parola înainte de a o stoca
  const hashedPassword = await hashPassword(password);

  const newUser: User = {
    email: email,
    password: hashedPassword,
    role: role, // Atribuie rolul (implicit 'user')
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const createdUser = await createUser(newUser);
    console.log(`SERVICE: User ${createdUser.email} registered successfully.`);
    return createdUser;
  } catch (error) {
    console.error(`SERVICE ERROR: Failed to register user ${email}:`, error);
    throw new Error('A eșuat înregistrarea utilizatorului.');
  }
};

/**
 * Autentifică un utilizator.
 * @param email - Email-ul utilizatorului.
 * @param password - Parola utilizatorului (în text clar).
 * @returns Obiectul utilizatorului autentificat (fără parolă) sau null dacă autentificarea eșuează.
 */
export const authenticateUser = async (email: string, password: string): Promise<Omit<User, 'password'> | null> => {
  console.log(`SERVICE: Attempting to authenticate user with email: ${email}`);
  const user = await findUserByEmail(email);

  if (!user) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: User not found.`);
    return null; // Utilizatorul nu există
  }

  // Compară parola furnizată cu parola hashuită din baza de date
  const passwordMatch = await comparePasswords(password, user.password);

  if (!passwordMatch) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: Incorrect password.`);
    return null; // Parolă incorectă
  }

  console.log(`SERVICE: User ${email} authenticated successfully.`);
  // Returnează utilizatorul fără parola hashuită din motive de securitate
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};