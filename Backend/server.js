const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const setupSocket = require("./middlewares/socketSetup");
const { createServer } = require("http");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const { setupPlanSyncSchedule } = require("./services/schedulerService");

// Load environment variables
require("dotenv").config();
dotenv.config();

//Routes Imports.
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const networkDesignRoutes = require("./routes/designRoutes");
const reportRoutes = require("./routes/reportRoutes");
const reportTemplateRoutes = require("./routes/reportTemplateRoutes");
const optimizationRoutes = require("./routes/optimizationRoutes");
const configurationRoutes = require("./routes/configurationRoutes");
const versionRoutes = require("./routes/versionRoutes");
const generatedConfigRoutes = require("./routes/generatedConfigRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const teamRoutes = require("./routes/teamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statsRoutes = require("./routes/statsRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const loginHistoryRoutes = require("./routes/loginHistoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const visualizationRoutes = require("./routes/visualizationRoutes");

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = setupSocket(httpServer);
app.set("io", io);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Handle preflight requests
app.options("*", cors());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/networkdesign", networkDesignRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/reporttemplate", reportTemplateRoutes);
app.use("/api/optimize", optimizationRoutes);
app.use("/api/configs", configurationRoutes);
app.use("/api/design-version", versionRoutes);
app.use("/api/genconfigs", generatedConfigRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/invites", invitationRoutes);
app.use("/api/loginhistory", loginHistoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/topology", visualizationRoutes);

// Serve static files
app.use("/report", express.static(path.join(__dirname, "reports")));

// File upload validation
app.use((req, res, next) => {
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return res.status(400).json({ error: "Invalid file type" });
    }
  }
  next();
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO ready on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Paystack plan synchronization
setupPlanSyncSchedule();

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Network Designer platform. Let's plan together..");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
