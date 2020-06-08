$(function() {

  let db = firebase.firestore();

  const gameID = $('#head').text().split(" ").pop();

  $(document).ready( function () {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    //
    // var user = firebase.auth().currentUser;
    //
    // if (user) {
    //   console.log("Started signed in as " + user.uid);
    // }
    // else {

      console.log("anonymous sign in");
      firebase.auth().signInAnonymously();

    // }
  });

  async function getNameFromFirestore(uid)
  {
    db.collection("Users").get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.id == uid)
        {
          $('#dname').text(doc.data().DisplayName);
        }
      });
    });
  }

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var pholder = user.uid.substring(0,6);
      $('#dname').text(pholder);
      $('#changeDName').prop('disabled', false);
      $('#readyUp').prop('disabled', false);

      db.collection("Users").doc(user.uid).set({
        DisplayName: pholder,
        Game: gameID,
        Team: 1
      })
    }
    // else {
    //   console.log("Signed out: " + user);
    //   $('#dname').text("SIGNED OUT");
    //   //window.location.replace("/");
    // }
  })

  $('#changeDName').click(function() {
    var user = firebase.auth().currentUser;

    var newDName = $('#newDName').val();

    $('#dname').text(newDName);
    $('#newDName').val("");

    db.collection("Users").doc(user.uid).set({
      DisplayName: newDName,
      Game: gameID,
      Team: 1,
      Ready: 0
    })
  });

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

  $('#readyUp').click(function() {
    var user = firebase.auth().currentUser;
    db.collection("Users").doc(user.uid).update({
      Ready: firebase.firestore.FieldValue.increment(1)
    });
  });

  db.collection("Users").where("Game","==",gameID)
    .onSnapshot(function(querySnapshot) {
      var t1 = [];
      var t2 = [];

      var user = firebase.auth().currentUser;

      if (!user)
      {
        $('#joinT2').prop('disabled', true);
        $('#joinT1').prop('disabled', true);
        return;
      }

      querySnapshot.forEach(function(doc) {
        var dname = doc.data().DisplayName;

        var tick = "";
        if (doc.data().Ready % 2)
        {
          tick = "&#10004;";
        }

        if (doc.data().Team == 1)
        {
          t1.push(dname + tick);
          if (doc.id == user.uid)
          {
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

      var loop = Math.max(t1.length, t2.length);

      $('#teamsTab').find("tr:gt(1)").remove();

      for (var i = 0; i < loop; i++)
      {
        var n1 = "";
        var n2 = "";

        if (i < t1.length) n1 = t1[i];
        if (i < t2.length) n2 = t2[i];

        $('#teamsTab').append('<tr><td>'+ n1 + '</td><td>' + n2 + '</td></tr>');
      }

    });



})
