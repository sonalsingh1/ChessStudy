const urlParams = new URLSearchParams(window.location.search);
var username = urlParams.get('username');
var password = urlParams.get('password');
if(username && password) {
    $('#user').text(`User Name: ${username}`);
} else {
    location.href = '/';
}

function startPlay() {
    let btn = $('input[name="style_time"]:checked').val().split("_");
    let chessOrChess960=$('input[name="game_type"]:checked').val();
    let rate_type = $('input[name="rate_type"]:checked').val();
    let gameType = btn[0]; //bullet,blitz..etc
    btn = btn[1].split("+");
    let startTime = btn[0];
    btn = btn[1].split("*");
    let timeIncrement = btn[0];
    let forkAvailable = btn[1];
    let temp = $('input[name="style_time"]:checked').val().split('_');
    let elo_col = temp[0] + '_'+ $('input[name="game_type"]:checked').val() + 'F'+ temp[1].slice(-1);
//field for chess game type added
    let data = {
        gameType: gameType,
        startTime: startTime,
        timeIncrement: timeIncrement,
        forkAvailable: forkAvailable,
        rate_type: rate_type,
        username: username,
        password: password,
        elo_col: elo_col,
        chessOrChess960:chessOrChess960
    };
    //location.href = "/game?" + $.param(data);
    location.href = "/verify?" + $.param(data)
}


function displayPlayerProfile() {
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

function startChallenge(){
    let opponentUserName = prompt('Please enter opponent User Name: ', 'User Name');
    if(opponentUserName){ // not null input
        console.log(opponentUserName);
        let para = {
            username: username,
            challenge_user: opponentUserName
        }
        location.href = "/challenge?" + $.param(para);
        console.log(location.href);
    }
}

