//Add new game to firebase backend
async function insertNewGame (gameCode) {
  await db.collection('Games').doc(gameCode).set({
    state: 0,     //Lobby
    turn: 0,      //Default
    choices: {
      A: 1,
      B: 1,
      C: 1,
      D: 1,
      E: 1,
      F: 1
    },
    selected: "",
    clues: 0,
    questions: {},
    timer: {
      running: false,
      start: 0
    },
    answers: {
      team1: "",
      votes1: {
        for1: 0,
        for2: 0,
        total: 0
      },
      team2: "",
      votes2: {
        for1: 0,
        for2: 0,
        total: 0
      }
    },
    scores: {
      team1: 0,
      team2: 0
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
