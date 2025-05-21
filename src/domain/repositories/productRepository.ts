import { ObjectId } from "mongodb";
import { getDb } from "../../core/database/mongoClient";
import { Product } from "../../models/interfaces/product";

export async function getAllProductsRepository() {
  const db = getDb();
  return db.collection("products").find().toArray();
}

export async function getProductByIdRepository(id: string) {
  const db = getDb();
  const objectId = new ObjectId(id);

  // Return the updated document
  const product = await db
    .collection<Product>("products")
    .findOne({ _id: objectId });

  if (!product) {
    return null;
  }

  return product;
}

export async function createProductRepository(
  product: Product
): Promise<Product & { _id: ObjectId }> {
  const db = getDb();

  const result = await db.collection<Product>("products").insertOne({
    ...product,
    createdAt: new Date(),
  });

  return {
    ...product,
    _id: result.insertedId,
  };
}

export async function deleteProductByIdRepository(
  id: string
): Promise<boolean> {
  const db = getDb();
  const result = await db
    .collection("products")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function updateProductByIdRepository(
  id: string,
  data: Partial<Product>
): Promise<Product | null> {
  const db = getDb();
  const objectId = new ObjectId(id);

  const updateResult = await db
    .collection<Product>("products")
    .updateOne({ _id: objectId }, { $set: data });

  if (updateResult.matchedCount === 0) {
    return null; // No matching document found
  }

  // Return the updated document
  const updatedProduct = await db
    .collection<Product>("products")
    .findOne({ _id: objectId });

  return updatedProduct;
}
