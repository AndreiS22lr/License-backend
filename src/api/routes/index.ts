import express from "express";
import carRoutes from "./carRoutes";
import productRoutes from "./productRoutes";
import lessonRoutes from "./lessonRoutes";
import quizRoutes from "./quizRoutes";
import userCompletedQuizRoutes from './userCompletedQuizRoutes';
import authRoutes from './authRoutes';
import userRecordingRoutes from './userRecordingRoutes';


const router = express.Router();

router.use("/cars", carRoutes);
router.use("/products", productRoutes);
router.use("/lessons", lessonRoutes);
router.use("/quizzes", quizRoutes);
router.use('/user-completed-quizzes', userCompletedQuizRoutes);
router.use('/auth', authRoutes);
router.use('/user-recordings', userRecordingRoutes);
export default router;
