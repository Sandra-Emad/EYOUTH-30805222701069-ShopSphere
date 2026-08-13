const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectMongoDB = require("./config/mongodb");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "E-Commerce API is running",
  });
});

const startServer = async () => {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();