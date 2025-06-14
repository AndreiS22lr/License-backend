// src/models/interfaces/user.ts // <-- Aceasta este calea corectă conform erorii tale

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
  firstName: string; // ADĂUGAT: Numele utilizatorului
  lastName: string;  // ADĂUGAT: Prenumele utilizatorului
  email: string;
  password: string; // Parola va fi stocată hashuită
  role: UserRole;   // Câmpul pentru rolul utilizatorului (ex: 'user', 'admin')
  createdAt?: Date; // Data creării (opțional pentru tipare, va fi setată la creare)
  updatedAt?: Date; // Data ultimei actualizări (opțional pentru tipare, va fi setată la creare)
}
