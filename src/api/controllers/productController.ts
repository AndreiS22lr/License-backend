import { Request, Response } from "express";
import { Product } from "../../models/interfaces/product";
import {
  deleteProductByIdService,
  getProductByIdService,
  getProductListService,
  updateProductByIdService,
} from "../../domain/services/productService.ts";
import { createProductRepository } from "../../domain/repositories/productRepository";

export const getProductList = async (req: Request, res: Response) => {
  try {
    // call method to get
    const products: any[] = await getProductListService(); // await service function

    res.status(200).json({
      message: "List of all indexes retrieved successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get product list.",
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  // this is the product id sent to endpoint (API)
  // example: serverh-host:8080/cars/513513 -->> id = 513513
  const id = req.params.id;
  try {
    if (!id) {
      throw new Error("Product ID was not provided in request.");
    }

    // call method to get
    const product: Product | null = await getProductByIdService(id);

    res.status(200).json({
      message: "Product found.",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to get product with ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const productDto = req.body; // this will take the JSON object fromt the request

  // if you want to take only some fields from the body object
  // ex: const { productName } = req.body

  try {
    const response: any = await createProductRepository(productDto);

    const log = 1 + 1;
    console.log(log);

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to create a new product",
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const deleteProductById = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    if (!id) {
      throw new Error("Product ID was not provided in request.");
    }

    const productDeleted: boolean = await deleteProductByIdService(id);

    res.status(200).json({
      message: `Product ${productDeleted ? "deleted" : "not deleted"}.`,
      data: productDeleted,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to delete product with ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id;
  const partialProductDto = req.body;

  try {
    const response: any = await updateProductByIdService(id, partialProductDto);

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to update the product",
      details: error instanceof Error ? error.message : error,
    });
  }
};
