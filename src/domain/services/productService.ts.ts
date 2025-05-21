import { Product } from "../../models/interfaces/product";
import {
  createProductRepository,
  deleteProductByIdRepository,
  getAllProductsRepository,
  getProductByIdRepository,
  updateProductByIdRepository,
} from "../repositories/productRepository";

export const getProductListService = async () => {
  try {
    return await getAllProductsRepository();
  } catch (error: any) {
    throw new Error(`Elasticsearch error: ${error.message}`);
  }
};

export const getProductByIdService = async (id: string) => {
  try {
    const existingProduct = await getProductByIdRepository(id);

    return existingProduct;
  } catch (error: any) {
    throw new Error(
      `Couldn't find the product with ID ${id}, ${error.message}`
    );
  }
};

export const createProductService = async (product: Product) => {
  try {
    const createdProduct = await createProductRepository(product);

    if (!createdProduct) {
      throw new Error("Product was not created.");
    }

    return createdProduct;
  } catch (error: any) {
    throw new Error(`Product creation fails: ${error.message}`);
  }
};

export const deleteProductByIdService = async (id: string) => {
  try {
    const productDeleted = await deleteProductByIdRepository(id);

    if (!productDeleted) {
      throw new Error("Product was not deleted. Please check your Product ID.");
    }

    return productDeleted;
  } catch (error: any) {
    throw new Error(
      `Couldn't find the product with ID ${id}, ${error.message}`
    );
  }
};

export const updateProductByIdService = async (
  id: string,
  data: Partial<Product>
) => {
  try {
    const updatedProduct = await updateProductByIdRepository(id, data);

    if (!updatedProduct) {
      throw new Error(
        "Product was not updated. Please check your fields or payload object."
      );
    }

    return updatedProduct;
  } catch (error: any) {
    throw new Error(
      `Couldn't update the product with ID ${id}, ${error.message}`
    );
  }
};
