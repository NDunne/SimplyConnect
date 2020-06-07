const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

var hbs = require('handlebars');

const admin = require('firebase-admin');

const helper = require('./helper.js');

const app = express();

app.engine('hbs',engines.handlebars);

app.set('views','./views');
//
// admin.initializeApp(functions.config.firebase);
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

var game = require('./routes/game');

//--- Local Auth ---//

var serviceAccount = require("./simplyConnectKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

  databaseURL: "https://simplyconnect-1f939.firebaseio.com"
})

//--- Deploy Auth ---//

// admin.initializeApp(functions.config.firebase);

//------- End -------//

async function insertFormData(request){
  const writeResult = await
  admin.firestore().collection('Questions').add({
    Clue1: request.body.clue1,
    Clue2: request.body.clue2,
    Clue3: request.body.clue3,
    Clue4: request.body.clue4,
  })
  .then(function() {console.log("Document write success!");})
  .catch(function(err) {console.error("Error writing document: ", error);});
}

async function clearTestData(){

  const db = await admin.firestore();

  db.collection('Games').where('test','==',true).get()
  .then(querySnapshot => {
    var batch = db.batch();

    querySnapshot.forEach(function(doc) {
      batch.delete(doc.ref);
    });

    return batch.commit();
  })
  .then(function() {
    return "Success";
  });
}

app.get('/',async (req,res) => {
  res.render('index');
});

app.get('/newgame',async (req,res) => {
  console.log("NEW GAME");

  var result = await helper.getFirestore('Games');

  var gameCode = helper.newUniqueCode(result);
  helper.insertNewGame(gameCode);

  console.log("CODE:" + gameCode);

  res.redirect(302, "/game/" + gameCode);
});

app.get('/clearTest',async (req,res) => {
  res.send(clearTestData());
});

app.use('/game', game);

app.all('*', function(req, res) {
  res.redirect("/");
});

// app.post('/insert_data',async (req,res) => {
//   var insert = await insertFormData(req);
//   res.sendStatus(200);
// });

exports.app = functions.https.onRequest(app);
