import express from "express";
import carRoutes from "./carRoutes";
import productRoutes from "./productRoutes";

const router = express.Router();

router.use("/cars", carRoutes);
router.use("/products", productRoutes);

export default router;
