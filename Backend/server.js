const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { setupPlanSyncSchedule } = require("./services/schedulerService");

// Load environment variables
require("dotenv").config();

dotenv.config();

//Routes

const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const networkDesignRoutes = require("./routes/designRoutes");
const reportRoutes = require("./routes/reportRoutes");
// Initialize Express app
const app = express();

//Middle wares
app.use(express.json()); // Parse JSON requests
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*Cors set up
app.use(cors({
  origin: 'http://localhost:3000', //frontend URL
  //origin: '*',
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
*/

// Handle preflight requests
app.options("*", cors());

app.use((req, res, next) => {
  //console.log(`Incoming ${req.method} request to ${req.path}`);
  //console.log('Headers:', req.headers);
  next();
});

// Routes

app.use("/api/users", userRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/networkdesign", networkDesignRoutes);
app.use("/api/report", reportRoutes);

// Load SSL certificate and key
const privateKey = fs.readFileSync("./certs/cert.key", "utf8");
const certificate = fs.readFileSync("./certs/cert.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

const MONGO_URI = process.env.MONGO_URI;
// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    // Start HTTPS server
    httpsServer.listen(443, () => {
      console.log("MongoDB connected successfully");
      console.log("HTTPS Server running on https://localhost");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

//Synchronise the paystack plans with my local mongo plans
setupPlanSyncSchedule();
// Sample Route
app.get("/", (req, res) => {
  res.send("Welcome to the Network Designer platform.");
});
