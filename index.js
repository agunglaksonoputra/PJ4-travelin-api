require("dotenv").config({
    path: process.env.ENV_FILE || ".env",
});

const express = require("express");
const cors = require("cors");
const app = express();

const db = require("./models");

// ===== CORS =====
const allowedOrigins = ["http://localhost:5173"];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn("CORS blocked:", origin);
                callback(new Error("Not allowed by CORS: " + origin));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
    })
);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Endpoint API Travelin');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
    try {
        await db.sequelize.authenticate();
        console.log("Database connected!");
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
});