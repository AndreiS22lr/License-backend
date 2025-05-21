import express from "express";
import multer from "multer"; // if you want to upload a file

import {
  createCar,
  getCarById,
  getCarList,
} from "../controllers/carController";

const router = express.Router();

// multer config for file uploads
const upload = multer({
  dest: "uploads/", // temp dir for uploaded files
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get("/", getCarList); // get all car
router.get("/:id", getCarById); // get single car by id
router.post("/create", createCar); // create new car
// router.delete("/delete/:id"); // delete car by id

export default router;
