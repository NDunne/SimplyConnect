const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

var hbs = require('handlebars');

const admin = require('./firebase_admin');
const db = admin.firestore();

const cookieParser = require('cookie-parser');

const app = express();

app.engine('hbs',engines.handlebars);

app.set('views','./views');

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

var game = require('./routes/game');

async function insertFormData(request){
  const writeResult = await
  db.collection('Questions').add({
    Clue1: request.body.clue1,
    Clue2: request.body.clue2,
    Clue3: request.body.clue3,
    Clue4: request.body.clue4,
  })
  .then(function() {console.log("Document write success!");})
  .catch(function(err) {console.error("Error writing document: ", error);});
}

async function deleteCollection(db, collectionPath, batchSize=500) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function clearTestData(){

 console.log("Clearing test data");
 var collections = ["Chats", "Games", "Users"];
  collections.forEach((coll) => {
    deleteCollection(db,coll).then( function() {
      console.log("Deleted " + coll);
    });
  });


}

app.get('/',async (req,res) => {
  res.render('index');
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
