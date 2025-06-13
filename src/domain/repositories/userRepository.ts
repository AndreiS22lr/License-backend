// src/domain/repositories/userRepository.ts

import { Collection, ObjectId } from 'mongodb';
import { getDb } from "../../core/database/mongoClient"; // Asigură-te că calea e corectă
import { User } from "../../models/interfaces/user";

/**
 * Returnează colecția MongoDB pentru utilizatori.
 */
const getUsersCollection = (): Collection<User> => {
  return getDb().collection<User>('users');
};

/**
 * Creează un nou utilizator în baza de date.
 * @param user - Obiectul utilizatorului de creat (cu parola deja hashuită).
 * @returns Utilizatorul creat, inclusiv ID-ul din baza de date.
 */
export const createUser = async (user: User): Promise<User> => {
  const collection = getUsersCollection();
  // Asigură-te că nu se trimite _id dacă există deja pentru o inserare nouă
  const userToInsert = { ...user, _id: user._id || new ObjectId() };
  const result = await collection.insertOne(userToInsert as any); // Adăugăm 'as any' pentru compatibilitate cu _id
  console.log(`REPOSITORY: User created with ID: ${result.insertedId}`);
  return { ...user, _id: result.insertedId, id: result.insertedId.toHexString() };
};

/**
 * Găsește un utilizator după adresa de email.
 * @param email - Email-ul utilizatorului.
 * @returns Obiectul utilizatorului sau null dacă nu este găsit.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const collection = getUsersCollection();
  console.log(`REPOSITORY: Searching for user with email: ${email}`);
  const user = await collection.findOne({ email: email });
  if (user) {
    console.log(`REPOSITORY: Found user with email: ${email}`);
    // Convertim _id la string pentru consistență, dacă nu e deja setat
    return { ...user, id: user._id.toHexString() };
  }
  console.log(`REPOSITORY: No user found with email: ${email}`);
  return null;
};

/**
 * Găsește un utilizator după ID-ul său.
 * @param id - ID-ul utilizatorului (string).
 * @returns Obiectul utilizatorului sau null dacă nu este găsit.
 */
export const findUserById = async (id: string): Promise<User | null> => {
  const collection = getUsersCollection();
  console.log(`REPOSITORY: Searching for user with ID: ${id}`);
  try {
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (user) {
      console.log(`REPOSITORY: Found user with ID: ${id}`);
      return { ...user, id: user._id.toHexString() };
    }
    console.log(`REPOSITORY: No user found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error(`REPOSITORY ERROR: Invalid ObjectId format for ID: ${id}`);
    return null; // Returnăm null dacă ID-ul nu este un format valid de ObjectId
  }
};