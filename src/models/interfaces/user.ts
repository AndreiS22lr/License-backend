
import { ObjectId } from 'mongodb';


export type UserRole = 'user' | 'admin';


export interface User {
  _id?: ObjectId; 
  id?: string;    
  firstName: string; 
  lastName: string;  
  email: string;
  password: string; 
  role: UserRole;   
  createdAt?: Date; 
  updatedAt?: Date; 
}
