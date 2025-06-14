// src/domain/services/authService.ts

import * as bcrypt from 'bcryptjs'; // Import bcryptjs
import { createUser, findUserByEmail } from '../repositories/userRepository'; // Import functions from repository
import { User, UserRole } from "../../models/interfaces/user"; // CORECTAT: Calea de import ajustată la "../../models/interfaces/user"

const SALT_ROUNDS = 10; // Number of salt rounds for password hashing (cost of the process)

/**
 * Hashes a given password.
 * @param password - The plain text password.
 * @returns The hashed password.
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compară o parolă în text clar cu o parolă hashuită.
 * @param plainPassword - The plain text password.
 * @param hashedPassword - The stored hashed password.
 * @returns True if the passwords match, false otherwise.
 */
const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Registers a new user.
 * @param firstName - User's first name.
 * @param lastName - User's last name.
 * @param email - User's email.
 * @param password - User's password (in plain text).
 * @param role - User's role (defaults to 'user').
 * @returns The created user object or null if the email already exists.
 */
export const registerUser = async (
    firstName: string,
    lastName: string,
    email: string, 
    password: string, 
    role: UserRole = 'user'
): Promise<User | null> => {
  console.log(`SERVICE: Attempting to register user with email: ${email}`);
  // Check if a user with this email already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.warn(`SERVICE WARNING: User with email ${email} already exists.`);
    return null; // User already exists
  }

  // Hash the password before storing it
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
 * Authenticates a user.
 * @param email - User's email.
 * @param password - User's password (in plain text).
 * @returns The authenticated user object (without password) or null if authentication fails.
 */
export const authenticateUser = async (email: string, password: string): Promise<Omit<User, 'password'> | null> => {
  console.log(`SERVICE: Attempting to authenticate user with email: ${email}`);
  const user = await findUserByEmail(email);

  if (!user) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: User not found.`);
    return null; // User does not exist
  }

  // Compare the provided password with the hashed password from the database
  const passwordMatch = await comparePasswords(password, user.password);

  if (!passwordMatch) {
    console.warn(`SERVICE WARNING: Authentication failed for ${email}: Incorrect password.`);
    return null; // Incorrect password
  }

  console.log(`SERVICE: User ${email} authenticated successfully.`);
  // Return the user without the hashed password for security reasons
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
