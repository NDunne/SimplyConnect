const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

var hbs = require('handlebars');

const admin = require('./firebase_admin');
const db = admin.firestore();

const deleter = require('./deleter');

const app = express();

app.engine('hbs',engines.handlebars);

app.set('views','./views');

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

var game = require('./routes/game');
var updateDB = require('./routes/updateDB');

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

function deleteAllUsers() {
  // List batch of users, 1000 at a time.
  admin.auth().listUsers()
    .then(function(listUsersResult) {

      uid_list = [];

      listUsersResult.users.forEach(function(userRecord) {
        uid_list.push(userRecord.uid);
      });
      admin.auth().deleteUsers(uid_list)
      .then(function(deleteUsersResult) {
        console.log('Successfully deleted ' + deleteUsersResult.successCount + ' Users');
        console.log('Failed to delete ' +  deleteUsersResult.failureCount + ' Users');
        deleteUsersResult.errors.forEach(function(err) {
          console.log(err.error.toJSON());
        });
      })
      .catch(function(error) {
        console.log('Error deleting users:', error);
      });
    })
    .catch(function(error) {
      console.log('Error listing users:', error);
    });
}

async function clearTestData(){

 console.log("Clearing test data");
 var collections = ["Chats", "Games", "Users"];
  collections.forEach((coll) => {
    deleter.deleteCollection(db,coll).then( function() {
      console.log("Deleted " + coll + " table");
    });
  });

  deleteAllUsers();
}

app.get('/',async (req,res) => {
  res.render('index');
});

app.get('/clearTest',async (req,res) => {
  res.send(clearTestData());
});

app.use('/game', game);

app.use('/updateDB', updateDB);

app.all('*', function(req, res) {
  res.redirect("/");
});

exports.app = functions.https.onRequest(app);
