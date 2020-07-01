const functions = require('firebase-functions');

const express = require('express');

const engines = require('consolidate');

const fs = require('fs');

const app = express();

const admin = require('../firebase_admin');
const db = admin.firestore();

const deleter = require('../deleter');

const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://ocdb.cc/episodes/';

const letters = "ABCDEF";

function getClues(numClues, elem, obj)
{
  var clue;
  obj["type"] = "text";
  if (elem.find("a").length) obj["type"] = "music";
  if (elem.find(".picture_clue").length) obj["type"] = "picture";

  if (obj["type"] == "text")
  {
    for (var i=1; i<=numClues; i++)
    {
      clue = "clue"+i
      obj[clue] = elem.find("#"+clue).find("p").text();
    }
  }

  return obj;
}

function parse1(elem)
{
  var ans = elem.find(".answer-show.back");

  var res = {
    answer: ans.clone().children().remove().end().text().trim(),
    extra: ans.find("p").text()
            };

  return getClues(4, elem, res);
}

function parse2(elem)
{
  var ans = elem.find(".answer-show.back");

  var res = {
    answer: ans.clone().children().remove().end().text().trim(),
    extra: ans.find("p").text()
            };

  return getClues(3, elem, res);
}

function parse3(elem)
{
  res = {};
  for (var i=1; i<=4; i++)
  {
    var group = "group"+i;

    res[group] = {};

    for (var j=1; j<=4; j++)
    {
      var clue = "clue"+j;

      res[group][clue] = elem.find("."+group+"-"+clue+" > .clue").text();
    }
    res[group]["answer"] = elem.find("."+group+"-answer").find(".back").text();
  }
  return res;
}

function parse4(elem)
{
  var count = 0;

  var obj = []
  elem.find(".vowel-round").each(function() {

    obj.push({
      category: $(this).children().first().text().trim()
    });

    var count2 = 1;
    $(this).find(".card").each(function() {
      obj[count]["q"+count2] = {
        clue: $(this).find(".front").text(),
        answer: $(this).find(".back").text()
      };

      count2++;
    });

    count++;
  });

  return obj;
}

function parseEpisode(url)
{
  return rp(url)
    .then(function(html) {
      obj =  {
        name: $("#internaltext", html).text().trim(),
        ep: $(".episode_meta", html).text().replace(/\s+/g, ' '),
        rounds: {}
      };

      console.log("Processing: " + obj.name);

      for (var i=1; i<4; i++)
      {
        var round = "round" + i;

        obj.rounds[round] = [];

        var elem = $("#" + round, html)

        while (elem.next().hasClass("question"))
        {
          elem = elem.next();

          switch(i)
          {
            case 1:
              obj.rounds[round].push(parse1(elem));
              break;
            case 2:
              obj.rounds[round].push(parse2(elem));
              break;
            case 3:
              obj.rounds[round].push(parse3(elem));
              break;
          }
        }
      }

      obj.rounds["round4"] = parse4($(".content", html));

      return obj;
    })
    .catch(function(err) {
      console.log("ERR: " +  err);
    });
}

function formatUpload(res, questions)
{
  console.log("Beginning format");

  deleter.deleteCollection(db, 'Questions')
  .then(function() {

    console.log("Deleted existing Questions");

    questions_obj = {};
    var batch = db.batch();

    questions.forEach(function(episode) {

      var teams = episode.name;
      var nums = episode.ep.match(/Series (\d+), Episode (\d+)/);

      // console.log(nums[0] + ": " + nums[1] + " " + nums[2])

      Object.keys(episode.rounds).forEach(function(round) {

        console.log("  " + round);

        if (!(questions_obj.hasOwnProperty(round)))
        {
          console.log("Creating round: "+round);
          questions_obj[round] = {
            docRef: db.collection('Questions').doc(round),
            questions: {}
          };
        }

        episode.rounds[round].forEach(function(question) {

          if (!(questions_obj[round].questions.hasOwnProperty(question.type)))
          {
            questions_obj[round].questions[question.type] = []
          }

          var obj = question;
          console.log(obj);
          obj.teams = teams;
          obj.series = nums[1];
          obj.episode = nums[2];

          // console.log("    " + JSON.stringify(question, null, 4));

          // console.log(questions_obj[round]);
          questions_obj[round].questions[question.type].push(obj);
          // console.log(questions_obj[round]);
        });
      });
    });

    Object.keys(questions_obj).forEach(function(round) {
      console.log(questions_obj[round].docRef);
      batch.set(questions_obj[round].docRef, {
        questions: questions_obj[round].questions
      });
    });

    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(questions_obj, null, 4));

    batch.commit();

  });
}

app.get('/',async function(req,res) {
  // 
  // var series = {};
  //
  // console.log("started update");
  //
  // rp(url)
  //   .then(function(html) {
  //     episodes = new Array();
  //     $('.series_container', html).each(function() {
  //       $(this).find("a").each(function() {
  //         episodes.push($(this).attr("href"));
  //         // return false;
  //       });
  //       // return false;
  //     });
  //
  //     console.log("\n" + episodes + "\n");
  //
  //     var mapped = episodes.map(function(url) {
  //       return parseEpisode(url);
  //     });
  //
  //     Promise.all(mapped).then(function(questions) {
  //       console.log("Done");
  //       var string = JSON.stringify(questions, null, 4);

        /* Temp */

        var filename = 'questions.json';

        // fs.writeFileSync(filename, string);

        var questions_raw = fs.readFileSync(filename);
        var questions = JSON.parse(questions_raw);

        /* Temp End */

        formatUpload(res, questions);

    //   });
    //
    //   res.send("Waiting...")
    //
    // })
    // .catch(function(err) {
    //
    //   res.send("ERROR: " + err);
    // });
});

module.exports = app;
