function startPlay() {
    let btn = $('input[name="style_time"]:checked').val().split("_");
    let gameType = btn[0];
    btn = btn[1].split("+");
    let startTime = btn[0];
    btn = btn[1].split("*");
    let timeIncrement = btn[0];
    let forkAvailable = btn[1];
    let data = {
        gameType: gameType,
        startTime: startTime,
        timeIncrement: timeIncrement,
        forkAvailable: forkAvailable
    };
    location.href = "/game?" + $.param(data);
}

const urlParams = new URLSearchParams(window.location.search);
let username = urlParams.get('username');
if(username) {
    $('#user').text(`User Name: ${username}`);
}

function displayPlayerProfile() {
    var username= "johnHeinz1";//urlParams.get('username');////document.getElementById("userID").value;
    console.log("****PLAYER PROFILE***");
    console.log(username);
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",
        password: "Queen123",
        database: "chessstudyschema"
    });
    con.connect(function(err) {
        if (err) throw err;
        var sql = "SELECT * from elo_rating WHERE ELO_ID="+username+")";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("****PLAYER PROFILE***");
            console.log(result);
        });
    });
}

function displayChallenges() {

}

function displayTopRankings() {

}

function onLogOut() {
    location.href = "/?" + $.param("");
}
