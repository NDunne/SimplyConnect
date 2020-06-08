const admin = require('firebase-admin');

//--- Local Auth ---//

var serviceAccount = require("./simplyConnectKey.json");

module.exports = admin.initializeApp({
  apiKey: "AIzaSyBEHF0H5Xtl4DhuE78GvwGnhZsxfVKzxfc",
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://simplyconnect-1f939.firebaseio.com",
  authDomain: "simplyconnect-1f939.firebaseapp.com",
  projectId: "simplyconnect-1f939"
})

//admin.auth().setPersistence(admin.auth.Auth.Persistence.Session);

//--- Deploy Auth ---//

// admin.initializeApp(functions.config.firebase);

//------- End -------//
