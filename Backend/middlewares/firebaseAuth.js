const admin = require("../config/firebse");
const User = require("../models/UserModel");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find the corresponding user in MongoDB
    const user = await User.findOne({ firebaseUID: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    // Attach all necessary user identifiers to the request
    req.user = {
      uid: decodedToken.uid, // Firebase UID
      _id: user._id.toString(), // MongoDB _id
      email: user.email, // User email
      fullUserDoc: user, // Entire user document
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
};

module.exports = verifyFirebaseToken;
