// routes/loginHistoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserLoginHistory,
} = require("../controllers/loginHistoryController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

router.get("/:userId", verifyFirebaseToken, getUserLoginHistory);

module.exports = router;
