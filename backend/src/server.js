import "dotenv/config";

import app from "./app.js";
import { connectMongoDB } from "./config/mongodb.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();