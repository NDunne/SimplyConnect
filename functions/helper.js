
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = {
  //Simple retrieve of a collection from the admin DB
  getCollection: async function(coll, db){
    const writeResult =
    db.collection(coll).get()
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
  insertNewGame: function(gameCode, db) {
    const writeResult = db.collection('Games').add({
      ID: gameCode,
      started: false,
      test: true
    })
    .then(function() {console.log("Document write success!");})
    .catch(function(err) {console.error("Error writing document: ", error);});
  },
};
