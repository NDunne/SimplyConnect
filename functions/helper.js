
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const admin = require('firebase-admin');

module.exports = {
  //Simple retrieve of a collection from the admin DB
  getFirestore: async function(coll){
    const firestore_con = await admin.firestore();

    const writeResult =
    firestore_con.collection(coll).get()
    .then(snapshot => {
      return snapshot.docs.map(doc => {
        return doc.data();
      });
    })
    .catch(err => { console.log('Error', err);});

    return writeResult
  },
  //Retrieve array of Game codes
  getCodes: function( gamesCol)
  {
    var codes = [];

    gamesCol.forEach(game => {
      //Clear old games?

      codes.push(game.ID);
    })
    return codes;
  },
  //Generate new Unique code
  newUniqueCode: function( gamesCol )
  {
    var codes = module.exports.getCodes(gamesCol);
    var charsLen = chars.length;
    var newCode;

    var X = 0;

    do {
      newCode = '';

      for (var i=0; i<4; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * charsLen));
      }
    }
    while (codes.includes(newCode));
    return newCode;
  },
  //Add new game to firebase backend
  insertNewGame: function(gameCode) {
    const writeResult = admin.firestore().collection('Games').add({
      ID: gameCode,
      started: false,
      test: true
    })
    .then(function() {console.log("Document write success!");})
    .catch(function(err) {console.error("Error writing document: ", error);});
  },
};
