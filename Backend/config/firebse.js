const admin = require("firebase-admin");
//const serviceAccount = require("./firebase-adminsdk.json"); // Adjust path accordingly

//Create the service account with sdk values
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Fix multi-line private key
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT,
  universe_domain: "googleapis.com",
};
//Initialize the App.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: "https://firebase-adminsdk-fbsvc@cloud-config-mgt.iam.gserviceaccount.com"
});

module.exports = admin;
