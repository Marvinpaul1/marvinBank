const dotenv = require("dotenv");

// Load environment variables from .env file

dotenv.config({ path: "./config.env" });
const result = dotenv.config({ path: "./config.env" });
if (result.error) {
  console.error("Error loading config.env file:", result.error);
  process.exit(1); // Exit the process if environment variables can't be loaded
}

const mongoose = require("mongoose");

const cron = require("node-cron");
const axios = require("axios");

const app = require("./app");

cron.schedule(" */10 * * * * *", async () => {
  try {
    const response = await axios.get(
      "https://nibssbyphoenix.onrender.com/api/docs",
    );
    // console.log("[CRON] Pinged NIBSS server - kept alive:", response.data);
  } catch (error) {
    // console.error("[CRON ERROR]:", error.message);
  }
});

mongoose
  .connect(process.env.DATABASE_LOCAL)
  .then(() => {
    console.log("DB connection successful");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running on ${port}...`);
});
