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
      buzzer: user.uid
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

  console.log(last_doc);

  function colourVotes()
  {

    var answers = new_doc.answers;
    console.log(answers);

    var t1_total = answers.votes1.from1 + answers.votes2.from1;
    var t2_total = answers.votes1.from2 + answers.votes2.from2;

    var teams_voted = !!t1_total + !!t2_total;
    var multiplier = (teams_voted)? (100/teams_voted):0;


    var t1_votes = multiplier * (( (t1_total) ? (answers.votes1.from1/t1_total):0) + ((t2_total) ? (answers.votes1.from2/t2_total):0));
    var t2_votes = multiplier * (( (t1_total) ? (answers.votes2.from1/t1_total):0) + ((t2_total) ? (answers.votes2.from2/t2_total):0));

    console.log(t1_votes + " " + t2_votes);

    $('#result_team1').css("background","linear-gradient(90deg, #9bee9b " + t1_votes +"%, #ee9b9b 0)");
    $('#result_team2').css("background","linear-gradient(90deg, #9bee9b " + t2_votes +"%, #ee9b9b 0)");

  }


  //Game document updated
  function gameUpdated(doc)
  {
    console.log("Game Updated");
    if (doc.exists)
    //Updated game state recieved
    {
      new_doc = doc.data();

      console.log(last_doc);
      console.log(new_doc);
      console.log("");

      //State Changed!
      if (last_doc == {}               ||
          new_doc.state != last_doc.state)
      {
        updateState(new_doc);
      }

      if (new_doc.turn % 2)
      {
        $('#head-t1').html("<b>Team 1</b>");
        $('#head-t2').html("Team 2");
      }
      else
      {
        $('#head-t1').html("Team 1");
        $('#head-t2').html("<b>Team 2</b>");
      }

      //Choice of question
      if (last_doc.state == 1)
      {
        //state 1 - choice of question
        until(_ => team != 0).then(function() {

          //Disable all question options
          $(".q").addClass("question-inactive");
          $(".q").removeClass("question-selected");

          // It's my turn
          if ( (new_doc.turn % 2  && team == 1) ||
             (!(new_doc.turn % 2) && team == 2))
          {
            for (var i=0; i < new_doc.choices.length; i++)
            {
              if (new_doc.choices[i])
              {
                $("#q"+i).removeClass("question-inactive")
                $("#q"+i).addClass("question-active")
                if (new_doc.choices[i] == 2)
                {
                  $("#q"+i).addClass("question-selected")
                  console.log("selected: " + i);
                }
              }
            }

            $("#helper-s1").text("Choose a Question");
          }
          // It's not my turn
          else
          {
            for (var i=0; i < new_doc.choices.length; i++)
            {
              if (new_doc.choices[i] == 2)
              {
                $("#q"+i).addClass("question-selected")
              }
            }

            $("#helper-s1").text("Other team is choosing...");
          }

          last_doc = doc.data();
        });
      }
      else if (last_doc.state == 1.1 || last_doc.state == 1.2)
      {
        //state 1 - choice of question
        until(_ => team != 0).then(function() {

          // Show visible clues
          for (var i=1; i <= new_doc.clues; i++)
          {
            $('#clue' + i).addClass("clue-flipped").find(".back").text("CLUE GOES HERE");
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
          }

          console.log(last_doc.timer);
          console.log(new_doc.timer);

          //Timer started
          if ((last_doc.timer == null || !(last_doc.timer.running)) && new_doc.timer.running)
          {
            ticker = window.setInterval(function(){
              console.log("TICK");
              var time = 45 - (firebase.firestore.Timestamp.now().seconds - new_doc.timer.start);
              $('#timer').find('h2').text(("0" +  Math.max(0, time)).slice(-2));
              if (time < 0){
                endQuestion();
              }

            }, 1000);
          }

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
            })

            if (last_doc.state == 1.2)
            {
              $('#answer_team1').text(new_doc.answers.team1);
              $('#result_team1').text(new_doc.answers.team1);
              $('#answer_team2').text(new_doc.answers.team2);
              $('#result_team2').text(new_doc.answers.team2);

              if (new_doc.answers.team1 != "" && new_doc.answers.team2 != "")
              {
                if (!g_voted)
                {
                  $('.box').hide();
                  $('#' + $.escapeSelector("VoteBox1.2")).show();
                }
                else
                {
                  colourVotes();
                }
              }
              else if (new_doc.answers["team" + team] != "")
              {
                $('#' + $.escapeSelector('WaitBox1.2')).show();
                $('#' + $.escapeSelector("AnswerBox1.2")).hide();
              }
            }

            last_doc = doc.data();
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
    var newState = new_doc.state

    //Hide all state specific content
    $('.state-cont').hide();

    //Show constant header if game has started
    if (newState > 0) $('#game-started').show();

    if (newState == 1.1) $('#timer').show();

    if (newState == 1.2)
    {
      $('#state' + $.escapeSelector(1.1)).show();
      clearInterval(ticker);

      //state 1 - choice of question
      until(_ => team != 0).then(function() {
        $('.box').hide();
        var user = firebase.auth().currentUser;
        if (g_voted)
        {
          $('#' + $.escapeSelector("ResultsBox1.2")).show();
          colourVotes();
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

    //Show div based on state
    $('#state' + $.escapeSelector(newState)).show();

    //Update local state
    last_doc.state = newState;
  }

  //Listener: Game document
  db.collection("Games").doc(gameID)
    .onSnapshot(function(doc) {
      if (!(loggedIn)) loginUser();
      gameUpdated(doc);
    })

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
      if (doc.data().Voted)
      {
        g_voted = true;
        $('#' + $.escapeSelector("VoteBox1.2")).hide();
        $('#' + $.escapeSelector("ResultsBox1.2")).show();
        colourVotes();
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
    console.log("AUTH STATE CHANGED: " + user);
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

      if (last_doc.state == 0)
      {
        updateTeams(querySnapshot);
      }
      else if (last_doc.state == 1.1)
      {
        // console.log("Update Guesses!");
        // updateGuesses(querySnapshot);
      }
    });

//------Input-Listeners------//
//----------State -1---------//

  //Return Home
  $('#home-but').click(function() {
    $(location).attr('href', "/");
  })
  $('#top').click(function() {
    $(location).attr('href', "/");
  })

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

    if (turn) alert("TEAM 1 goes first");
    else alert("TEAM 2 goes first");

    db.collection("Games").doc(gameID).update({
      turn: turn,
      state: 1
    });
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

    var findIdx = $.inArray(2,last_doc.choices)

    if (findIdx >= 0) last_doc.choices[findIdx] = 1;

    var newIdx = parseInt($(this).attr("id").substring(1));

    last_doc.choices[newIdx] = 2;

    db.collection("Games").doc(gameID)
      .update({
        choices: last_doc.choices
      });
  });

  $(document).on('click', '.question-selected', function() {
    var qnumber = parseInt($(this).attr("id").substring(1));
    db.collection("Games").doc(gameID).update({
      selected: qnumber,
      state: 1.1
    });
  });

  //------------end------------//
  //----------State 1.1--------//

  $(document).on('click', '.clue-active', function() {
    $(this).removeClass('clue-active').addClass('clue-inactive');
    db.collection("Games").doc(gameID)
      .update({
        choices: last_doc.choices
      });

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
  });

  $(document).on('click', '.answer.wrong, .answer.right', function() {
    $(this).toggleClass('wrong').toggleClass('right');
  });

  $('#confirmVote').click(function() {
    var btch = db.batch();

    var gameRef = db.collection("Games").doc(gameID);
    $('.answer.right').each(function(index) {
      btch.update(gameRef, {["answers.votes" + ($(this).attr('id').slice(-1)) + ".from" + team]:firebase.firestore.FieldValue.increment(1)})
      console.log();
    });

    var user = firebase.auth().currentUser;
    btch.update(db.collection("Users").doc(user.uid), {Voted: true});

    btch.commit();
  });

  $('#skipVote').click(function() {
    var btch = db.batch();

    var user = firebase.auth().currentUser;
    btch.update(db.collection("Users").doc(user.uid), {Voted: true});

    btch.commit();
  });

  //------------end------------//
  //---------Key-Listener------//

  $(document).keyup(function(event) {
    if ($("#sendbox").is(":focus") && event.key == "Enter") {

      var user = firebase.auth().currentUser;

      console.log(isLeader);

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
