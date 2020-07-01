const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

const app = express();

const admin = require('../firebase_admin');
const db = admin.firestore();

app.engine('hbs',engines.handlebars);

app.set('views','./views');

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/../public'));

async function getCodes()
{
  var codes = [];

  await db.collection("Games").get()
    .then(snapshot => {
      snapshot.forEach(game => {
        console.log(game.id);
        codes.push(game.id);
      });
    })
    .catch(err => { console.log('Error', err); });

  return codes;
}

app.get(/[A-Z]{4}/,async function(req,res) {

  var gameCode = req.url.substring(1);

  console.log("Game id: " + gameCode + " requested");

  res.render('game', { gameCode: req.url.substring(1) });
});

module.exports = app;
