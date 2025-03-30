const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json"); // Adjust path accordingly

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: "https://firebase-adminsdk-fbsvc@cloud-config-mgt.iam.gserviceaccount.com"
});

module.exports = admin;
