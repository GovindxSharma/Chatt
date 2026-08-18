const mongoose = require("mongoose");

const connectDB = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DB_URI;

  if (!uri) {
    console.warn(
      "⚠️ Warning: No MongoDB URI found in environment variables (MONGO_URI, MONGODB_URI, or DB_URI)."
    );
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not abruptly exit process in production to allow retry and health monitoring
    if (process.env.NODE_ENV !== "production") {
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected. Attempting reconnection...");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected.");
});

module.exports = connectDB;
