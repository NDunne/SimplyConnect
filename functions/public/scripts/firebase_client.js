$(function() {

  //Database reference
  let db = firebase.firestore();

  //GameID from nodeJS template
  const gameID = $('#head').text().split(" ").pop();

  var last_doc = {};
  var loggedIn = false;
  var team = 0;
  var displayName = "";
  var isLeader = false;
  var g_voted = false;

  var g_points2score = [0, 5, 3, 2, 1];

  var ticker;

  doResize();

  function doResize()
  {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    var cw = $('.circle').width();
    $('.circle').css({'height':cw+'px'});

    //If keyboard shrinks view window hide certain elements
    if(( window.innerHeight/screen.availHeight)*100 < 60)
    {
        $('.keyboard-hide').css({display:"none"})
    }
    else
    {
      $('.keyboard-hide').removeAttr('style');
    }
  }

  // Resize listener
  $( window ).resize(function() {
    doResize();
  });

  // buzz or time out
  function endQuestion()
  {
    var user = firebase.auth().currentUser;

    db.collection("Games").doc(gameID).update({
      "timer.running": false,
      state: 1.2,
      buzzer: user.uid,
      score: g_points2score[new_doc.clues],
    });
  }

  //Swap too DOM elements
  jQuery.fn.swapWith = function(to) {
    return this.each(function() {
        var copy_to = $(to).clone(true);
        var copy_from = $(this).clone(true);
        $(to).replaceWith(copy_from);
        $(this).replaceWith(copy_to);
    });
  };

  function zeroDiv(x,y)
  {
      return ((y) ? (x/y):0);
  }

  function calcVotes(answers)
  {
    var t1_total = answers.votes1.total;
    var t2_total = answers.votes2.total;

    var teams_voted = !!t1_total + !!t2_total;
    var multiplier = zeroDiv(100, teams_voted);

    var t1_votes = multiplier * (zeroDiv(answers.votes1.for1, t1_total) + zeroDiv(answers.votes2.for1, t2_total));
    var t2_votes = multiplier * (zeroDiv(answers.votes1.for2, t1_total) + zeroDiv(answers.votes2.for2, t2_total));

    return [t1_votes, t2_votes];
  }

  function colourVotes(answers)
  {
    votes = calcVotes(answers);

    $('#result_team1').css("background","linear-gradient(90deg, #9bee9b " + votes[0] +"%, #ee9b9b 0)");
    $('#result_team2').css("background","linear-gradient(90deg, #9bee9b " + votes[1] +"%, #ee9b9b 0)");

    query = db.collection("Users")
      .where("Voted", "==", false)
      .where("Game", "==", gameID);

    query.get().then(function(querySnapshot) {
      if (!querySnapshot.size)
      {
        $('#nextQ').show();
      }
    });
  }

  function flashUpdate(elem, text)
  {
    if (elem.text() != text)
    {
      elem.text(text);
      elem.css('color',"9bee9b");
      setTimeout(function() {
        elem.css('color',"initial");
      }, 80);
    }
  }

  //Game document updated
  function gameUpdated(doc)
  {
    // console.log("Game Updated");
    if (doc.exists)
    //Updated game state recieved
    {
      new_doc = doc.data();
      //
      // console.log(last_doc);
      // console.log(new_doc);
      // console.log("");

      //State Changed!
      if (last_doc == {}               ||
          new_doc.state != last_doc.state)
      {
        new_doc = updateState(new_doc);
      }

      if (new_doc.state)
      {
        //Disable all question options
        $(".q").addClass("question-inactive");
        $(".q").removeClass("question-active");
        $(".q").removeClass("question-selected");

        until(_ => team != 0).then(function() {
          if (team == 1)
          {
            $('#head-t1').html("<b>Team 1</b>");
            $('#head-t2').html("Team 2");
          }
          else
          {
            $('#head-t1').html("Team 1");
            $('#head-t2').html("<b>Team 2</b>");
          }
        });

        // $('#score-t1').text(new_doc.scores.team1);
        // $('#score-t2').text(new_doc.scores.team2);

        flashUpdate($('#score-t1'), new_doc.scores.team1);
        flashUpdate($('#score-t2'), new_doc.scores.team2);
      }

      if (new_doc.state == 0)
      {
        last_doc = new_doc;
      }
      //Choice of question
      if (new_doc.state == 1)
      {
        last_doc = new_doc;

        //state 1 - choice of question
        until(_ => team != 0).then(function() {

          // It's my turn
          if ( (new_doc.turn % 2  && team == 1) ||
             (!(new_doc.turn % 2) && team == 2))
          {

            if (new_doc.questions != {}) //Questions have been selected
            {
              for (var key in new_doc.choices)
              {
                if (new_doc.choices[key])
                {
                  $("#q"+key).removeClass("question-inactive")
                  $("#q"+key).addClass("question-active")
                  if (new_doc.choices[key] == 2)
                  {
                    $("#q"+key).addClass("question-selected")
                  }
                }
              }
            }

            $("#helper-s1").text("Choose a Question");
          }
          // It's not my turn
          else
          {
            for (var key in new_doc.choices)
            {
              if (new_doc.choices[key] == 2)
              {
                $("#q"+key).addClass("question-selected")
              }
            }

            $("#helper-s1").text("Other team is choosing...");
          }
        });
      }
      else if (new_doc.state == 1.1 || new_doc.state == 1.2)
      {
        // $('.clue').removeClass("clue-flipped")

        //state 1 - choice of question
        until(_ => team != 0).then(function() {

          //Actually state 1.2
          if (new_doc.state == 1.2)
          {
            $('#answer_team1').text(new_doc.answers.team1);
            $('#result_team1').text(new_doc.answers.team1);
            $('#answer_team2').text(new_doc.answers.team2);
            $('#result_team2').text(new_doc.answers.team2);

            if (new_doc.answers.team1 != "" && new_doc.answers.team2 != "")
            {
              $('.solution-span').text(new_doc.questions.round1[new_doc.selected].answer);

              if (new_doc.clues < 4)
              {
                new_doc.clues = 4;
              }

              if (!g_voted)
              {
                $('.box').hide();
                $('#' + $.escapeSelector("VoteBox1.2")).show();
              }
              else
              {
                colourVotes(new_doc.answers);
              }
            }
            else if (new_doc.answers["team" + team] != "")
            //Submitted Guess
            {
              $('.box').hide();
              $('#' + $.escapeSelector('WaitBox1.2')).show();
            }
            else
            {
              var user = firebase.auth().currentUser;

              if ((((new_doc.turn % 2) && team == 2) || (!(new_doc.turn % 2) && team == 1)) && isLeader)
              //Team Leader and not my turn
              {
                $('.box').hide();
                $('#' + $.escapeSelector("AnswerBox1.2")).show();
              }
              else if (user.uid == new_doc.buzzer)
              //Buzzed and is my turn
              {
                $('.box').hide();
                $('#' + $.escapeSelector("AnswerBox1.2")).show();
              }
              else
              {
                $('.box').hide();
                $('#' + $.escapeSelector('WaitBox1.2')).show();
              }
            }
          }

          // v Back to 1.1 v

          // Show visible clues

          for (var i=1; i <= new_doc.clues; i++)
          {
            $('#clue' + i).addClass("clue-flipped").find(".back").text(new_doc.questions.round1[new_doc.selected]['clue' + i]);
          }

          // It's my turn
          if ( (new_doc.turn % 2  && team == 1) ||
             (!(new_doc.turn % 2) && team == 2))
          {
            var helptext;
            if(new_doc.clues)
            {
              helptext = "Buzz when ready!";
              $('#buzz-button').addClass('enabled');
            }
            else
            {
              helptext = "Click first clue to start time";
              $('#buzz-button').removeClass('enabled');
            }
            $('#' + $.escapeSelector("helper-s1.1")).text(helptext);
            $('#' + $.escapeSelector("helper-s1.1-msgs")).text("Discuss your answer");
            //Enable next clue
            $('#clue' + (new_doc.clues + 1)).removeClass("clue-inactive").addClass("clue-active");
            $('#clue' + (new_doc.clues + 1)).find(".front").text("Next")
            //Show Buzz button
            $('#buzz-button').css("visibility","visible");
          }
          // It's not my turn
          else
          {
            $('#' + $.escapeSelector("helper-s1.1")).text("Answer Correctly for a Bonus Point");
            $('#' + $.escapeSelector("helper-s1.1-msgs")).text("Discuss your bonus point answer");
            $('#buzz-button').css("visibility","hidden");
          }

          //Timer started
          if ((last_doc.timer == null || !(last_doc.timer.running)) && new_doc.timer.running)
          {
            ticker = window.setInterval(function(){
              var time = 45 - (firebase.firestore.Timestamp.now().seconds - new_doc.timer.start);
              $('#timer').find('h2').text(("0" +  Math.max(0, time)).slice(-2));
              if (time < 0){
                endQuestion();
              }

            }, 1000);
          }

            last_doc = new_doc;
        });
      }
    }
    else
    //Error State
    {
      $('#state-1').show();
    }
  }

  function until(conditionFunction) {

    const poll = resolve => {
      if(conditionFunction()) resolve();
      else setTimeout(_ => poll(resolve), 400);
    }

    return new Promise(poll);
  }

  //Update global and visible divs
  function updateState(new_doc)
  {
    // console.log("updateState");
    var newState = new_doc.state

    //Hide all state specific content
    $('.state-cont').hide();

    //Show constant header if game has started
    if (newState > 0)
    {
      $('#game-started').show();
      $('.clue').removeClass("clue-flipped").find(".front").text("?");
    }

    if (newState == 1)
    {
      //Reset Clues:
      $('.clue-flipped').removeClass('clue-flipped');
      $('.clue-active').removeClass('clue-active').addClass('clue-inactive');
      $('#timer').find('h2').text(45);
      $('#nextQ').hide();

      g_voted = false;

      //state 1 - choice of question
      until(_ => team != 0).then(function() {
        var user = firebase.auth().currentUser;

        db.collection("Users").doc(user.uid).update({ Voted: false });
      });
    }
    else if (newState == 1.1)
    {
      $('#timer').show();

      //Disable all question options
      $(".q").addClass("question-inactive");
      $(".q").removeClass("question-active");
      $(".q").removeClass("question-selected");

      new_doc.clues = 0;
    }
    else if (newState == 1.2)
    {
      $('#state' + $.escapeSelector(1.1)).show();
      clearInterval(ticker);

      $('.answer.right').removeClass('right').addClass('wrong');

      //state 1 - choice of question
      until(_ => team != 0).then(function() {
        $('.box').hide();
        var user = firebase.auth().currentUser;
        if (g_voted)
        {
          colourVotes(new_doc.answers)
          $('#' + $.escapeSelector("ResultsBox1.2")).show();
        }
        else
        {
          if (user.uid == new_doc.buzzer ||
             (((!(new_doc.turn) % 2 && team == 1) || ((new_doc.turn % 2) && team == 2)) &&
             isLeader))
          {
            $('#' + $.escapeSelector("AnswerBox1.2")).show();
          }
          else
          {
            $('#' + $.escapeSelector('WaitBox1.2')).show();
          }
        }
      });
    }
    else if (newState == 5)
    {
      $('#round-head').text("Final Scores");
      $('#round-desc').text("Thanks for Playing!");
    }

    //Show div based on state
    $('#state' + $.escapeSelector(newState)).show();

    // last_doc.state = new_doc.state;

    return new_doc;
  }

  //Listener: Game document
  db.collection("Games").doc(gameID)
    .onSnapshot(function(doc) {
      if (!(loggedIn)) loginUser();
      gameUpdated(doc);
    });

  until(_ => team != 0).then(function() {

    //Listener: Chat Messages
    db.collection("Chats").doc(gameID + "_" + team)
      .onSnapshot(function(doc) {

        $("#messages").html("");

        messages = doc.data()

        if (messages)
        {
          var h = $("#" + $.escapeSelector("chat-s1.1")).height();
          doc.data().msgs.forEach(msg => {

            $("#messages").append(`
              <div class="msg">
                <div class="icon ` + msg.shape + ` smaller" style="background: ` + msg.col + `"></div>
                <div class="msgname">` + msg.sender + `: </div>
                <div class="msgcontent">
                ` + msg.content + `
                </div>
               </div>
            `);
          });
          $("#" + $.escapeSelector("chat-s1.1")).height(h);
        }
      });
  });

  //Make changes to firestore
  function updateFirestoreUser(uid, dname, newTeam=1, ready=0, leader=false, voted=false)
  {
    db.collection("Users").doc(uid).set({
      DisplayName: dname,
      Game: gameID,
      Team: newTeam,
      Ready: ready,
      Leader: leader,
      Voted: voted
    })
    .catch(function(err) {
      console.log("Failed!" + err);
    });

    updateDname(dname);
    isLeader = leader;
    team = newTeam;
  }

  //Update page text
  function updateDname(dname)
  {
    $('#dname').text(dname);
    $('#changeDName').prop('disabled', false);
    $('#readyUp').prop('disabled', false);

    displayName = dname;
  }

  function handleLoggedInUser(uid)
  {
    loggedIn = true;
    db.collection("Users").doc(uid).get()
    .then(function(record) {
      if (record.exists)
      {
        // console.log("User Record exists! \n" + record.data());
        // //Signed in already
        // console.log("Now signed in as " + record.data().DisplayName);

        if (record.data().Game == gameID)
        {
          // console.log("User for this game");
          //Unready if was ready before
          updateFirestoreUser(uid, record.data().DisplayName, record.data().Team, 0, record.data().Leader, record.data().Voted);
        }
        else
        {
          // console.log("User for another game");
          //update to defaults with old name and new GameID
          updateFirestoreUser(uid, record.data().DisplayName);
        }
      }
      else
      {
        // console.log("User Record does not exist");
        updateFirestoreUser(uid, uid.substring(1,6));
      }
    });

    db.collection("Users").doc(uid).onSnapshot(function(doc) {
      if (doc.exists && doc.data().Voted)
      {
        // console.log("Updated voted");
        g_voted = true;
        $('#' + $.escapeSelector("VoteBox1.2")).hide();
        $('#' + $.escapeSelector("ResultsBox1.2")).show();

        if (last_doc.answers)
        {
          colourVotes(last_doc.answers);
        }
      }
      else
      {
        g_voted = false;
      }
    });
  }

  //Once state has been determined
  function loginUser() {
    //Persists with Session
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

    //Get logged in User
    var user = firebase.auth().currentUser;

    if (user) {
      handleLoggedInUser(user.uid)
    }
    else {
      //Sign in or create new anon identity
      firebase.auth().signInAnonymously();
    }
  }

  //Listener for Login
  firebase.auth().onAuthStateChanged(function(user) {
    // console.log("AUTH STATE CHANGED: " + user);
    if (user) {
      handleLoggedInUser(user.uid);
    }
  });

  function getColour(uid)
  {
    return ('#' + (uid.replace(/[^0-9A-F]/g, "") + "000000").substring(0,6));
  }

  function batchUpdateLeader(batch, uid, value)
  {
    var user = firebase.auth().currentUser;

    if (user.uid == uid) isLeader = value;

    batch.update(db.collection("Users").doc(uid),
                 { Leader: value }
                );
  }

  function updateTeams(querySnapshot)
  {
    // console.log("updateTeams");

    var t1 = [];
    var t2 = [];

    var user = firebase.auth().currentUser;

    if (!user)
    {
      //Don't allow team change until logged in
      $('#joinT2').prop('disabled', true);
      $('#joinT1').prop('disabled', true);
      return;
    }

    var readyCount = 0;

    var batch = db.batch();

    //For each User in game
    querySnapshot.forEach(function(doc) {
      //get name
      var dname = doc.data().DisplayName;

      var tick = "";
      if (doc.data().Ready % 2)
      {
        //set tick string (ascii)
        tick = "&#10004;";
        readyCount++;
      }

      var col = getColour(doc.id);

      //Add to list based on team
      if (doc.data().Team == 1)
      {
        var shape = `circle`;
        if (!(t1.length))
        {
          shape = `crown`;
          batchUpdateLeader(batch, doc.id, true);
        }
        else
        {
          batchUpdateLeader(batch, doc.id, false);
        }
        t1.push(
        `<div id="` + doc.id + `" class="name">
          <div class="icon ` + shape + `" style="background: ` + col + `"></div>
          <div>&nbsp;` + dname + tick + `</div>
        </div>`
        );
        if (doc.id == user.uid)
        {
          //enable only other team's button
          $('#joinT2').prop('disabled', false);
          $('#joinT1').prop('disabled', true);
        }
      }
      else
      {
        var shape = `circle`;
        if (!(t2.length))
        {
          shape = `crown`;
          batchUpdateLeader(batch, doc.id, true);
        }
        else
        {
          batchUpdateLeader(batch, doc.id, false);
        }
        t2.push(
        `<div id="` + doc.id + `" class="name-end">
          <div>` + tick + dname + `&nbsp;</div>
          <div class="icon ` + shape + `" style="background: ` + col + `"></div>
        </div>`
        );
        if (doc.id == user.uid)
        {
          $('#joinT1').prop('disabled', false);
          $('#joinT2').prop('disabled', true);
        }
      }
    });

    batch.commit();

    if (readyCount == querySnapshot.size &&
        t1.length > 0                    &&
        t2.length > 0                      )
    {
      $('#start').prop('disabled', false);
    }
    else
    {
      $('#start').prop('disabled', true);
    }

    //Loop length longest team list
    var loop = Math.max(t1.length, t2.length);

    //remove all but first two rows
    $('#teamsTab').find("tr:gt(1)").remove();

    for (var i = 0; i < loop; i++)
    {
      var n1 = "";
      var n2 = "";

      if (i < t1.length) n1 = t1[i];
      if (i < t2.length) n2 = t2[i];

      //Add row with names
      $('#teamsTab').append('<tr><td>'+ n1 + '</td><td></td><td>' + n2 + '</td></tr>');
    }
  }

  //Observer for query of users in Game
  db.collection("Users")
    .orderBy('Leader', 'desc')
    .where("Game","==",gameID)
    .onSnapshot(function(querySnapshot) {
      //Race condition
      until(_ => !(jQuery.isEmptyObject(last_doc))).then(function() {
        if (last_doc.state == 0)
        {
          updateTeams(querySnapshot);
        }
      });
    });

function shuffleArray(arr)
{
  //Fisher-yates shuffle
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * i)
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr;
}

async function selectQuestions()
{
  var qs = [];

  for (var i=0; i<4; i++)
  {
    qs[i] = db.collection("Questions").doc("round"+(i+1)).get();
  }

  qs = await Promise.all(qs);

  const letters = "ABCDEF";

  qs = qs.map(function(q) { return q.data().questions.text; });

  var r1 = shuffleArray(qs[0])
            .slice(0,6)
            .reduce(function(result, item, index, array) {
              result[letters[index]] = item;
              return result;
            }, {});

  var qs_obj = {
    round1: r1,
    round2: {},
    round3: {},
    round4: {}
  };

  db.collection("Games").doc(gameID).update({
    // turn: turn,
    // state: 1,
    questions: qs_obj
  });
}


//------Input-Listeners------//
//----------State -1---------//

  //Return Home
  $('.home-but').click(function() {
    $(location).attr('href', "/");
  });

  $('.restart-but').click(function() {

  });

  $('#top').click(function() {
    $(location).attr('href', "/");
  });

//------------end------------//
//----------State 0----------//

  //Click change name button
  $('#changeDName').click(function() {
    var user = firebase.auth().currentUser;

    //Jquery get new name
    var newDName = $('#newDName').val();

    updateDname(newDName);
    $('#newDName').val("");

    db.collection("Users").doc(user.uid).update({
      DisplayName: newDName
    });
  });

  //Join Teams
  $('#joinT1').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Team: 1,
      Leader: false
    });
    team = 1;
  });
  $('#joinT2').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Team: 2,
      Leader: false
    });
    team = 2;
  });

  //Ready toggle increments int, mod 2 to check
  $('#readyUp').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Ready: firebase.firestore.FieldValue.increment(1)
    });
  });

  $('#start').click(function() {

    var turn = (Math.floor(Math.random() * 2))

    // if (turn) alert("TEAM 1 goes first");
    // else alert("TEAM 2 goes first");

    db.collection("Games").doc(gameID).update({
      turn: turn,
      state: 1,
    });

    selectQuestions();
  });

  $('#makeLeader').click(function() {
    var users = db.collection("Users");

    users.where('Team','==',team)
         .where('Leader','==', true)
         .get()
         .then(response => {
           var batch = db.batch();
           response.docs.forEach((doc) => {
             batchUpdateLeader(batch, doc.id, false);
           })
           var user = firebase.auth().currentUser;
           batchUpdateLeader(batch, user.uid, true);

           batch.commit();
         });
  });

  //------------end------------//
  //----------State 1----------//

  $(document).on('click', '.question-active', function() {
    $('.question-selected').removeClass("question-selected");
    $(this).addClass("question-selected");

    for (var key in last_doc.choices) {
       if (last_doc.choices[key] == 2 )
       {
         last_doc.choices[key] = 1;
       }
    }

    var newIdx = $(this).attr("id").substring(1);

    last_doc.choices[newIdx] = 2;

    db.collection("Games").doc(gameID)
      .update({
        choices: last_doc.choices
      });
  });

  $(document).on('click', '.question-selected', function() {
    var qletter = $(this).attr("id").substring(1);
    db.collection("Games").doc(gameID).update({
      selected: qletter,
      ['choices.' + qletter]: 0,
      state: 1.1
    });
  });

  //------------end------------//
  //----------State 1.1--------//

  $(document).on('click', '.clue-active', function() {
    $(this).removeClass('clue-active').addClass('clue-inactive');

    // db.collection("Games").doc(gameID)
    //   .update({
    //     choices: last_doc.choices
    //   });

    db.collection("Games").doc(gameID).update({
      clues: firebase.firestore.FieldValue.increment(1)
    });
  });

  $(document).on('click', '#clue1.clue-active', function() {
    db.collection("Games").doc(gameID).update({
      timer: {
        running: true,
        start: firebase.firestore.Timestamp.now().seconds
      }
    });
  });

  $(document).on('click', '#buzz-button.enabled', function() {
    endQuestion();
  });

  //------------end------------//
  //----------State 1.2--------//

  $('#submitAnswer').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Games").doc(gameID).update({
      ['answers.team' + team]: $('#answerBox').val()
    });
    $('#answerBox').val("");
  });

  $(document).on('click', '.answer.wrong, .answer.right', function() {
    $(this).toggleClass('wrong').toggleClass('right');
  });

  $('#confirmVote').click(function() {
    var b = db.batch();

    var gameRef = db.collection("Games").doc(gameID);
    $('.answer.right').each(function(index) {
      b.update(gameRef, {["answers.votes" + team + ".for" + ($(this).attr('id').slice(-1))]:firebase.firestore.FieldValue.increment(1)})
    });

    b.update(gameRef, {["answers.votes" + team + ".total"]:firebase.firestore.FieldValue.increment(1)})

    var user = firebase.auth().currentUser;
    b.update(db.collection("Users").doc(user.uid), {Voted: true});

    b.commit();
  });

  $('#skipVote').click(function() {
    var b = db.batch();

    var user = firebase.auth().currentUser;

    var gameRef = db.collection("Games").doc(gameID);
    b.update(gameRef, {["answers.votes" + team + ".total"]:firebase.firestore.FieldValue.increment(0)})

    b.update(db.collection("Users").doc(user.uid), {Voted: true});

    b.commit();
  });

  $('#nextQ').click(function() {

    var votes = calcVotes(last_doc.answers);

    // Create a reference to the SF doc.
    var gameDocRef = db.collection("Games").doc(gameID);

    gameDocRef.update({
      state: 1,
      turn: firebase.firestore.FieldValue.increment(1),
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
        },
      },
      selected: "",
    });

    return db.runTransaction(function(transaction) {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(gameDocRef).then(function(gameDoc) {

        var choices_map = gameDoc.data().choices;
        choices_map[gameDoc.data().selected] = 0;

        var sum = Object.values(choices_map).reduce((t, n) => t + n);
        if (!sum)
        {
          //END GAME TODO
          transaction.update(gameDocRef, {state: 5});
        }

        var score1diff = (votes[0] >= 50)? ((!(gameDoc.data().turn % 2))? gameDoc.data().score : 1 ): 0;
        var score2diff = (votes[1] >= 50)? (  (gameDoc.data().turn % 2)? gameDoc.data().score : 1 ): 0;

        transaction.update(gameDocRef, {
          clues: 0,
          scores: {
            team1: gameDoc.data().scores.team1 + score1diff,
            team2: gameDoc.data().scores.team2 + score2diff,
          }
        });
      });
    }).then(function() {
        console.log("Transaction successfully committed!");
    }).catch(function(error) {
        console.log("Transaction failed: ", error);
    });
  });

  //------------end------------//
  //---------Key-Listener------//

  $(document).keyup(function(event) {
    if ($("#sendbox").is(":focus") && event.key == "Enter") {

      var user = firebase.auth().currentUser;

      db.collection("Chats").doc(gameID + "_" + team)
        .set({
            msgs: firebase.firestore.FieldValue.arrayUnion({
              col: getColour(user.uid),
              sender: displayName,
              content: " " + $("#sendbox").val(),
              shape: (isLeader)? "crown":"circle"
            })
          },
          {
            merge: true
          }
        );

      $("#sendbox").val("");
    }
});

  //------------end------------//

});
