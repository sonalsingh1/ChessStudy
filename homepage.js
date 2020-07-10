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
let password = urlParams.get('password');
if(username && password) {
    $('#user').text(`User Name: ${username}`);
} else {
    location.href = '/';
}

function displayPlayerProfile() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//

    console.log("****PLAYER PROFILE***");
    console.log(username);
    let data = {
        username: username,
        password:password
    };
    location.href = "/profile?" + $.param(data);
}

function displayChallenges() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//
    console.log("****PLAYER CHALLENGES***");
    console.log(username);
    let data = {
        username: username,
        password:password
    };
    location.href = "/challenges?" + $.param(data);
}

function displayTopRankings() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//
    console.log("****TOP RANKINGS***");
    console.log(username);
    let data = {
        username: username,
        password:password
    };
    location.href = "/topRankings?" + $.param(data);
}

function onLogOut() {
    location.href = "/?" + $.param("");
}
