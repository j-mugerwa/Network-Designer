// routes/invitationRoutes.js
const express = require("express");
const router = express.Router();
const {
  createInvitation,
  getInvitations,
  acceptInvitation,
} = require("../controllers/invitationController");
const verifyFirebaseToken = require("../middlewares/firebaseAuth");

router.post("/", verifyFirebaseToken, createInvitation);
router.get("/", verifyFirebaseToken, getInvitations);
router.post("/accept", acceptInvitation);

module.exports = router;
