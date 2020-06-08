const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

const app = express();

const admin = require('../firebase_admin');
const db = admin.firestore();

const helper = require('../helper.js');

app.engine('hbs',engines.handlebars);

app.set('views','./views');

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/../public'));

app.get(/[A-Z]{4}/,async function(req,res) {

  var games = await helper.getCollection('Games',db);
  var codes = helper.getCodes(games);

  console.log("Found Games: " + codes);

  var gameCode = req.url.substring(1);

  console.log("Joining Game: " + gameCode);

  if (codes.includes(gameCode))
  {
    res.render('game', { gameCode: req.url.substring(1) });
  }
  else {
    res.redirect("/");
  }
});

module.exports = app;
