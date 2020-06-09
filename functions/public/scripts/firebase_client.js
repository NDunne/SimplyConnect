$(function() {

  //Database reference
  let db = firebase.firestore();

  //GameID from nodeJS template
  const gameID = $('#head').text().split(" ").pop();

  //Make changes to firestore
  function updateFirestore(uid, dname, team=1, ready=0)
  {
    console.log("updating record: " + uid + "\nto:" + {
      DisplayName: dname,
      Game: gameID,
      Team: team,
      Ready: ready
    });

    db.collection("Users").doc(uid).set({
      DisplayName: dname,
      Game: gameID,
      Team: team,
      Ready: ready
    })
    .then(function() {
      console.log("Success!");
    })
    .catch(function(err) {
      console.log("Failed!" + err);
    });

    updatePage(dname);
  }

  //Update page text
  function updatePage(dname)
  {
    $('#dname').text(dname);
    $('#changeDName').prop('disabled', false);
    $('#readyUp').prop('disabled', false);
  }

  function handleLoggedInUser(uid)
  {
    db.collection("Users").doc(uid).get()
    .then(function(record) {
      if (record.exists)
      {
        console.log("User Record exists! \n" + record.data());
        //Signed in already
        console.log("Now signed in as " + record.data().DisplayName);

        if (record.data().Game == gameID)
        {
          console.log("User for this game");
          //Unready if was ready before
          updateFirestore(uid, record.data().DisplayName, record.data().Team, 0);
        }
        else
        {
          console.log("User for another game");
          //update to defaults with old name and new GameID
          updateFirestore(uid, record.data().DisplayName);
        }
      }
      else
      {
        console.log("User Record does not exist");
        updateFirestore(uid, uid.substring(1,6));
      }
    });
  }

  //On Page Load
  $(document).ready( function () {
    //Persists with Session
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

    //Get logged in User
    var user = firebase.auth().currentUser;

    console.log("currentUser: " + user);

    if (user) {
      handleLoggedInUser(user.uid)
    }
    else {
      console.log("not signed in");
      //Sign in or create new anon identity
      firebase.auth().signInAnonymously();
    }
  });

  //Listener for Login
  firebase.auth().onAuthStateChanged(function(user) {
    console.log("AUTH STATE CHANGED: " + user);
    if (user) {
      handleLoggedInUser(user.uid);
    }
  });

  //Click change name button
  $('#changeDName').click(function() {
    var user = firebase.auth().currentUser;

    //Jquery get new name
    var newDName = $('#newDName').val();

    updatePage(newDName);
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
  });
  $('#joinT2').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Team: 2
    });
  });

  //Ready toggle increments int, mod 2 to check
  $('#readyUp').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Ready: firebase.firestore.FieldValue.increment(1)
    });
  });

  //Observer for query of users in Game
  db.collection("Users").where("Game","==",gameID)
    .onSnapshot(function(querySnapshot) {
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

      //For each User in game
      querySnapshot.forEach(function(doc) {
        //get name
        var dname = doc.data().DisplayName;

        var tick = "";
        if (doc.data().Ready % 2)
        {
          //set tick string (ascii)
          tick = "&#10004;";
        }

        //Add to list based on team
        if (doc.data().Team == 1)
        {
          t1.push(dname + tick);
          if (doc.id == user.uid)
          {
            //enable only other team's button
            $('#joinT2').prop('disabled', false);
            $('#joinT1').prop('disabled', true);
          }
        }
        else
        {
          t2.push(tick + dname);
          if (doc.id == user.uid)
          {
            $('#joinT1').prop('disabled', false);
            $('#joinT2').prop('disabled', true);
          }
        }
      });
      console.log("Team 1:", t1.join(", "));
      console.log("Team 2:", t2.join(", "));

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

    });
})
