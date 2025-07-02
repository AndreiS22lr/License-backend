// src/domain/services/authService.ts

import * as bcrypt from 'bcryptjs'; 
import { createUser, findUserByEmail } from '../repositories/userRepository'; 
import { User, UserRole } from "../../models/interfaces/user"; 

const SALT_ROUNDS = 10; 

/**
 
 * @param password 
 * @returns 
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 
 * @param plainPassword 
 * @param hashedPassword 
 * @returns
 */
const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 
 * @param firstName 
 * @param lastName 
 * @param email 
 * @param password 
 * @param role 
 * @returns 
 */
export const registerUser = async (
    firstName: string,
    lastName: string,
    email: string, 
    password: string, 
    role: UserRole = 'user'
): Promise<User | null> => {
  console.log(`SERVICE: Attempting to register user with email: ${email}`);
  
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.warn(`SERVICE WARNING: User with email ${email} already exists.`);
    return null; 
  }

  
  const hashedPassword = await hashPassword(password);

  const newUser: User = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: hashedPassword,
    role: role, 
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const createdUser = await createUser(newUser);
    console.log(`SERVICE: User ${createdUser.email} registered successfully.`);
    return createdUser;
  } catch (error) {
    console.error(`SERVICE ERROR: Failed to register user ${email}:`, error);
    throw new Error('User registration failed.');
  }
};

/**
 
 * @param email 
 * @param password 
 * @returns 
 */
export const authenticateUser = async (email: string, password: string): Promise<Omit<User, 'password'> | null> => {
  console.log(`SERVICE: Attempting to authenticate user with email: ${email}`);
  const user = await findUserByEmail(email);

  if (!user) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: User not found.`);
    return null; 
  }

  
  const passwordMatch = await comparePasswords(password, user.password);

  if (!passwordMatch) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: Incorrect password.`);
    return null; 
  }

  console.log(`SERVICE: User ${email} authenticated successfully.`);
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
