import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import cors from "cors";

//Import Routes
import userRoutes from "./routes/userRoute.js";
import bookRoutes from "./routes/bookRoute.js";
import authRoutes from "./routes/authRoutes.js";
import shelfRoutes from "./routes/shelfRoutes.js";

config();
connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://libry-beta.vercel.app/",
      "https://libry-beta.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/users", userRoutes);
app.use("/books", bookRoutes);
app.use("/auth", authRoutes);
app.use("/shelf", shelfRoutes);

const PORT = 5002;
const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});

// Handle unhadled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

//Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.log("Uncaught Exception:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
