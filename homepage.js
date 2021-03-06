const urlParams = new URLSearchParams(window.location.search);
var username = urlParams.get('username');
var password = urlParams.get('password');
var disable = urlParams.get('disable');
var show = urlParams.get('show');
if(username && password) {
    $('#user').text(`User Name: ${username}`);
} else {
    location.href = '/';
}
if(urlParams.get('found')){
    alert('No player with this username, Please try again!');
}

if(urlParams.get('full')){
    alert('Chess Fork has currently reached its maximum capacity, please try again later!');
}

// disable all buttons and inputs, show the cancel button
if(disable){
    let btns = document.getElementsByTagName('button');
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].id === 'cancel'){
            btns[i].classList.replace('invisible','visible');
        } else {
            btns[i].classList.add('disabled');
            btns[i].disabled = true;
        }
    }

    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length ; i++) {
        inputs[i].disabled = true;
    }
}

// hide the cancel button, enable all other buttons and inputs.
if(show){
    let btns = document.getElementsByTagName('button');
    for (let i = 0; i < btns.length ; i++) {
        if (btns[i].id === 'cancel'){
            btns[i].classList.replace('visible','invisible');
        } else{
            btns[i].classList.remove('disabled');
            btns[i].disabled = false;
        }
    }

    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].disabled = false;
    }
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
    if  (opponentUserName === username) { //challenge himself
        alert('You cannot challenge yourself, Please Try Again!');
    } else if(opponentUserName){ // not null input
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

        let data = {
            to: opponentUserName,
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
        location.href = "/challenge?" + $.param(data);
    } else{ //null input
        alert(`Please introduce opponent's username!`);
    }
}
function removeChallenge(){
    let para = {
        username: username,
        password: password
    }
    location.href = '/removeChallenge?' + $.param(para);
}

