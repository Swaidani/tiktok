import express from "express";
import cors from "cors";
import { registerRoutes } from "./simpleRoutes";

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    const server = await registerRoutes(app);
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`TikTok Bot server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();