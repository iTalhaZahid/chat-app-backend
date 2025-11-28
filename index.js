import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors()); // Enable CORS for all routes(receive requests from different origins)


app.use("/auth",authRoutes)


app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);



connectDB().then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});