// src/domain/repositories/lessonRepository.ts

import { getDb } from "../../core/database/mongoClient"; // Ensure this import is correct
import { Lesson } from "../../models/interfaces/lesson";
import { Collection, ObjectId, OptionalId } from "mongodb"; // Import ObjectId and OptionalId

// Helper function to get the 'lessons' collection
const getLessonsCollection = (): Collection<Lesson> => {
  return getDb().collection<Lesson>("lessons");
};

// Function to create a lesson
export const createLesson = async (
  lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lesson> => {
  const collection = getLessonsCollection();
  const newLesson = {
    ...lessonData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newLesson as OptionalId<Lesson>);

  return { ...newLesson, id: result.insertedId.toHexString() };
};

// Function to get all lessons
export const getLessonList = async (): Promise<Lesson[]> => {
  const collection = getLessonsCollection();
  const lessons = await collection.find({}).sort({ order: 1 }).toArray();

  return lessons.map(lesson => ({
    ...lesson,
    id: lesson._id ? lesson._id.toHexString() : undefined,
  }));
};

// Function to get a lesson by ID
export const getLessonById = async (id: string): Promise<Lesson | null> => {
  const collection = getLessonsCollection();
  let foundLesson: Lesson | null = null;
  try {
    const objectId = new ObjectId(id);
    const lesson = await collection.findOne({ _id: objectId });
    if (lesson) {
      foundLesson = {
        ...lesson,
        id: lesson._id ? lesson._id.toHexString() : undefined
      };
    }
  } catch (error) {
    console.error("REPOSITORY ERROR: Error converting ID or finding lesson:", error);
    return null;
  }
  return foundLesson;
};

// Function to update a lesson (with debug logs and type corrections)
export const updateLesson = async (
  id: string,
  partialLesson: Partial<Lesson>
): Promise<Lesson | null> => {
  const collection = getLessonsCollection();
  let objectId: ObjectId;

  // --- DEBUG LOGS ---
  console.log("\n--- REPOSITORY UPDATE DEBUG START ---");
  console.log("REPOSITORY DEBUG: ID received:", id);
  console.log("REPOSITORY DEBUG: Partial Lesson Data:", partialLesson);
  // --- END DEBUG LOGS ---

  try {
    objectId = new ObjectId(id);
    console.log("REPOSITORY DEBUG: ID converted to ObjectId:", objectId.toHexString());
  } catch (error) {
    console.error("REPOSITORY ERROR: Invalid ID format during ObjectId conversion:", id, error);
    console.log("--- REPOSITORY UPDATE DEBUG END (Invalid ID) ---\n");
    return null;
  }

  // Create an update object that excludes 'id' and other fields that shouldn't be updated
  const updateFields: Omit<Partial<Lesson>, 'id' | 'createdAt' | 'updatedAt'> = { ...partialLesson };
  delete (updateFields as any).id; // Remove 'id' from the update object

  try {
    console.log("REPOSITORY DEBUG: Querying for _id:", objectId);
    console.log("REPOSITORY DEBUG: Fields to update with $set:", { ...updateFields, updatedAt: new Date() });

    // The key correction here: the return type of findOneAndUpdate is directly the document (or null)
    const updatedDocument = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updateFields, updatedAt: new Date() } },
      { returnDocument: 'after' } // Ensure MongoDB driver returns the document after the update
    );

    console.log("REPOSITORY DEBUG: Complete result from findOneAndUpdate:", updatedDocument);


    // Check 'updatedDocument' directly
    if (updatedDocument) {
      console.log("REPOSITORY DEBUG: Lesson found and updated successfully. _id:", updatedDocument._id.toHexString());
      const mappedLesson: Lesson = {
        ...updatedDocument, // This is already the Lesson object with _id
        id: updatedDocument._id.toHexString() // Map _id to id
      };
      console.log("REPOSITORY DEBUG: Mapped document to return:", mappedLesson);
      console.log("--- REPOSITORY UPDATE DEBUG END (Success) ---\n");
      return mappedLesson;
    } else {
      console.log("REPOSITORY DEBUG: findOneAndUpdate did not find the lesson or the update failed. ID:", objectId.toHexString());
      console.log("--- REPOSITORY UPDATE DEBUG END (Not Found) ---\n");
      return null;
    }
  } catch (error) {
    console.error(`REPOSITORY ERROR: Error during findOneAndUpdate call for ID ${id}:`, error);
    console.log("--- REPOSITORY UPDATE DEBUG END (Catch Error) ---\n");
    throw error;
  }
};

// Function to delete a lesson by ID (Corrected return statement)
export const deleteLessonById = async (id: string): Promise<boolean> => {
  const collection = getLessonsCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  } catch (error) {
    console.error("REPOSITORY ERROR: Error deleting lesson:", error);
    return false; // Ensure a return statement here
  }
};