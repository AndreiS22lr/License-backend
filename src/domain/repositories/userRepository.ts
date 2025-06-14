// src/domain/repositories/userRepository.ts

import { Collection, ObjectId } from 'mongodb';
import { getDb } from "../../core/database/mongoClient"; 
import { User } from "../../models/interfaces/user"; // CORECTAT: Calea importului către modelul User (interfață)

/**
 * Returnează colecția MongoDB pentru utilizatori.
 */
const getUsersCollection = (): Collection<User> => {
  return getDb().collection<User>('users');
};

/**
 * Creează un nou utilizator în baza de date.
 * @param user - Obiectul utilizatorului de creat (cu parola deja hashuită, incluzând firstName și lastName).
 * @returns Utilizatorul creat, inclusiv ID-ul din baza de date și datele complete.
 */
export const createUser = async (user: User): Promise<User> => {
  const collection = getUsersCollection();
  
  // Asigură-te că _id, createdAt și updatedAt sunt gestionate corect.
  // firstName și lastName sunt deja în obiectul 'user' primit.
  const userToInsert = { 
    ...user, 
    _id: user._id || new ObjectId(), // Generează un nou ObjectId dacă nu există
    createdAt: user.createdAt || new Date(), // Setăm data creării dacă nu e deja specificată
    updatedAt: user.updatedAt || new Date()  // Setăm data actualizării dacă nu e deja specificată
  };
  
  // Inserăm documentul în colecție
  const result = await collection.insertOne(userToInsert as any); 
  console.log(`REPOSITORY: User created with ID: ${result.insertedId}`);
  
  // Găsim documentul proaspăt inserat pentru a-l returna cu toate câmpurile populate
  const createdDoc = await collection.findOne({ _id: result.insertedId });
  if (!createdDoc) {
      throw new Error("Failed to retrieve the newly created user.");
  }

  return { 
      ...createdDoc, 
      id: createdDoc._id.toHexString() // Convertim ObjectId în string pentru ID-ul public
  };
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
    // Convertim _id la string pentru consistență
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
