import app from "./app";
import config from "./core/config/config";
import { connectToMongo } from "./core/database/mongoClient";

connectToMongo()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // exit app if DB Connection fails
  });
