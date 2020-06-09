//Add new game to firebase backend
function insertNewGame (gameCode) {
  const writeResult = db.collection('Games').doc(gameCode).set({
    started: false,
    test: true
  })
  .then(function() {console.log("Document write success!");})
  .catch(function(err) {console.error("Error writing document: ", error);});
}

function newUniqueCode()
{
  var codes = getCodes();

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
};

function getCodes()
{
  var codes = [];
  db.collection("Games").get()
    .then(function(querySnapshot) {
      querySnapshot.forEach(game => {
        //Clear old games?
        console.log(game.id);

        codes.push(game.id);
      });
    });
  return codes;
}
