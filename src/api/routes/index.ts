import express from "express";
import carRoutes from "./carRoutes";
import productRoutes from "./productRoutes";
import lessonRoutes from "./lessonRoutes";
import quizRoutes from "./quizRoutes";
import userCompletedQuizRoutes from './userCompletedQuizRoutes';
import authRoutes from './authRoutes';

const router = express.Router();

router.use("/cars", carRoutes);
router.use("/products", productRoutes);
router.use("/lessons", lessonRoutes);
router.use("/quizzes", quizRoutes);
router.use('/quiz-results', userCompletedQuizRoutes);
router.use('/auth', authRoutes);
export default router;
