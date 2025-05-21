import express from "express";
import {
  createProduct,
  deleteProductById,
  getProductById,
  getProductList,
  updateProduct,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProductList); // get all products
router.get("/:id", getProductById); // get single product by id
router.post("/create", createProduct); // create new product
router.put("/update/:id", updateProduct); // update product by id
router.delete("/delete/:id", deleteProductById); // delete product by id

export default router;
