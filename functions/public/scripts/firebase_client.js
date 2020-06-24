$(function() {

  //Database reference
  let db = firebase.firestore();

  //GameID from nodeJS template
  const gameID = $('#head').text().split(" ").pop();

  var last_doc = {};
  var loggedIn = false;
  var team = 0;

  // var teammate-block =


  $( window ).resize(function() {
    var cw = $('.circle').width();
    $('.circle').css({'height':cw+'px'});
  });

  function gameUpdated(doc)
  {
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
        });
      }
      else if (last_doc.state == 1.1)
      {
        //state 1 - choice of question
        until(_ => team != 0).then(function() {

          // It's my turn
          if ( (new_doc.turn % 2  && team == 1) ||
             (!(new_doc.turn % 2) && team == 2))
          {
            $('#' + $.escapeSelector("helper-s1.1")).text("Click first clue to start time");
          }
          // It's not my turn
          else
          {
            $('#' + $.escapeSelector("helper-s1.1")).text("Answer Correctly for a Bonus Point");
          }

          db.collection("Users")
            .where("Game","==",gameID)
            .where("Team","==",team).get()
            .then(updateGuesses);
        });
      }

      last_doc = doc.data();
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
  function updateFirestoreUser(uid, dname, newTeam=1, ready=0, guess="")
  {
    db.collection("Users").doc(uid).set({
      DisplayName: dname,
      Game: gameID,
      Team: newTeam,
      Ready: ready,
      Guess: guess
    })
    .catch(function(err) {
      console.log("Failed!" + err);
    });

    updateDname(dname);
    team = newTeam;
  }

  //Update page text
  function updateDname(dname)
  {
    $('#dname').text(dname);
    $('#changeDName').prop('disabled', false);
    $('#readyUp').prop('disabled', false);
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
          updateFirestoreUser(uid, record.data().DisplayName, record.data().Team, 0, record.data().Guess);
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

      var col = getColour(doc.data().id);

      //Add to list based on team
      if (doc.data().Team == 1)
      {
        t1.push('<div class="wrapper"><div class="circle" style="background: ' + col + '"></div><div>&nbsp;' + dname + tick + '</div></div>');
        if (doc.id == user.uid)
        {
          //enable only other team's button
          $('#joinT2').prop('disabled', false);
          $('#joinT1').prop('disabled', true);
        }
      }
      else
      {
        t2.push('<div class="end-wrapper"><div>' + tick + dname + '&nbsp;</div><div class="circle" style="background: #' + col + '"></div></div>');
        if (doc.id == user.uid)
        {
          $('#joinT1').prop('disabled', false);
          $('#joinT2').prop('disabled', true);
        }
      }
    });

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
      $('#teamsTab').append('<tr><td>'+ n1 + '</td><td>' + n2 + '</td></tr>');
    }

    var cw = $('.circle').width();
    $('.circle').css({'height':cw+'px'});
  }

  //Update Guesses from team
  function updateGuesses(querySnapshot)
  {
    $('#teambox').empty();
    querySnapshot.forEach(function(doc) {
      var playername = doc.data().DisplayName;

      if (doc.data().Team == team)
      {
        var col = getColour(doc.id);

        $('#teambox').append(`
          <div class="teammate-block">
            <div class="teammate">
              <div class="teammate-name">
                <div class="wrapper"><div class="nomargin circle" style="background: ` + col + `"></div><div>&nbsp; ` + playername +`</div></div>
              </div>
              <div class="teammate-form">
                <div class="teammate-textbox">
                  <input type="text" class="guessbox" value="` + doc.data().Guess + `" disabled/>
                </div>
                <div class="vote-wrapper">
                  <div class="circle"></div>
                  <div class="circle"></div>
                  <div class="circle"></div>
                  <div class="circle"></div>
                  <div class="circle"></div>
                  <div class="teammate-button">
                    <input type="button" class="smaller" value="Vote"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `);
      }
    });

    var cw = $('.circle').width();
    $('.circle').css({'height':cw+'px'});
  }


  //Observer for query of users in Game
  db.collection("Users").where("Game","==",gameID)
    .onSnapshot(function(querySnapshot) {

      if (last_doc.state == 0)
      {
        updateTeams(querySnapshot);
      }
      else if (last_doc.state == 1.1)
      {
        console.log("Update Guesses!");
        updateGuesses(querySnapshot);
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
      Team: 1
    });
    team = 1;
  });
  $('#joinT2').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Team: 2
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

  $(document).on('click', '#suggest-button', function() {
    db.collection("Users").doc(firebase.auth().currentUser.uid).update({
      Guess: $('#myguessbox').val()
    });
    $('#myguessbox').val('');
  });

  //------------end------------//

});
