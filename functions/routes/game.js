const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

const app = express();

const admin = require('firebase-admin');

const helper = require('../helper.js');

app.engine('hbs',engines.handlebars);

app.set('views','./views');

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/../public'));

app.use(function timeLog (req,res,next) {
  console.log('Time: ',Date.now());
  next();
});

app.get(/[A-Z]{4}/,async function(req,res) {

  var games = await helper.getFirestore('Games');
  var codes = helper.getCodes(games);

  console.log("Found Games: " + codes);

  var gameCode = req.url.substring(1);

  console.log("Joining Game: " + gameCode);

  if (codes.includes(gameCode))
  {
    // admin.auth().signInAnonymously().catch(function(error) {
    //   // Handle Errors here.
    //   var errorCode = error.code;
    //   var errorMessage = error.message;
    //   // ...
    // });
    //
    // admin.auth().onAuthStateChanged(function(user) {
    //   if (user) {
    //     // User is signed in.
    //     var isAnonymous = user.isAnonymous;
    //     var id = user.uid;
    //
    //     res.render('game',
    //       {
    //         gameCode: req.url.substring(1),
    //         uid: id
    //       });
    //   } else {
        res.render('game',
          {
            gameCode: req.url.substring(1),
            uid: '0'
          });
    //   }
    //   // ...
    // });
  }
  else {
    res.redirect("/");
  }
});

module.exports = app;
