// src/domain/models/user.ts

import { ObjectId } from 'mongodb';

// Definim un tip union pentru rolurile posibile
export type UserRole = 'user' | 'admin';

/**
 * Interfața pentru un utilizator în aplicație.
 * Reprezintă structura documentului User în colecția MongoDB.
 */
export interface User {
  _id?: ObjectId; // ID-ul intern MongoDB
  id?: string;    // ID-ul public, sub formă de string (opțional, pentru conveniență)
  email: string;
  password: string; // Parola va fi stocată hashuită
  role: UserRole;   // NOU: Câmpul pentru rolul utilizatorului (ex: 'user', 'admin')
  createdAt: Date;
  updatedAt: Date;
}