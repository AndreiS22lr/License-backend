// src/models/interfaces/userRecording.ts

import { ObjectId } from 'mongodb';


export interface UserRecording {
  _id?: ObjectId; 
  id?: string;    
  userId: string; 
  lessonId: string; 
  audioUrl: string; 
  createdAt: Date;
  updatedAt: Date;
}