import express from "express";
import {
  createProduct,
  getProductById,
  getProductList,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProductList); // get all products
router.get("/:id", getProductById); // get single product by id
router.post("/create", createProduct); // create new product
// router.delete("/delete/:id"); // delete product by id

export default router;
