//Add new game to firebase backend
async function insertNewGame (gameCode) {
  await db.collection('Games').doc(gameCode).set({
    state: 0,     //Lobby
    turn: 0,      //Default
    test: true,    //Debug info
    choices: [1, 1, 1, 1, 1, 1], //initialise all available
    selected: -1,
    questions: [],
    clues: 0,
    timer: {
      running: false,
      start: 0
    }
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
