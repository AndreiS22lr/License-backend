import bodyParser from "body-parser";
import express from "express";
import { errorHandler } from "./core/middlewares/errorHandler";
import router from "./api/routes";

const app = express();

// Middleware
app.use(bodyParser.json());

app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api", router);

// Middleware - Route
// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
