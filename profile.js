
//Fetching values from the URL

const urlParams = new URLSearchParams(window.location.search);
var username = urlParams.get('username');
var password = urlParams.get('password');
var email = urlParams.get('email');
//Fork 0
Blitz_ChessF0= urlParams.get('Blitz_ChessF0');
Bullet_ChessF0=urlParams.get('Bullet_ChessF0');
Rapid_ChessF0=urlParams.get('Rapid_ChessF0');
Long_ChessF0=urlParams.get('Long_ChessF0');
Blitz_Chess960F0=urlParams.get('Blitz_Chess960F0');
Bullet_Chess960F0=urlParams.get('Bullet_Chess960F0');
Rapid_Chess960F0=urlParams.get('Rapid_Chess960F0');
Long_Chess960F0=urlParams.get('Long_Chess960F0');
//Fork 1
Blitz_ChessF1= urlParams.get('Blitz_ChessF1');
Bullet_ChessF1=urlParams.get('Bullet_ChessF1');
Rapid_ChessF1=urlParams.get('Rapid_ChessF1');
Long_ChessF1=urlParams.get('Long_ChessF1');
Blitz_Chess960F1=urlParams.get('Blitz_Chess960F1');
Bullet_Chess960F1=urlParams.get('Bullet_Chess960F1');
Rapid_Chess960F1=urlParams.get('Rapid_Chess960F1');
Long_Chess960F1=urlParams.get('Long_Chess960F1');
//Fork 2
Blitz_ChessF2= urlParams.get('Blitz_ChessF2');
Bullet_ChessF2=urlParams.get('Bullet_ChessF2');
Rapid_ChessF2=urlParams.get('Rapid_ChessF2');
Long_ChessF2=urlParams.get('Long_ChessF2');
Blitz_Chess960F2=urlParams.get('Blitz_Chess960F2');
Bullet_Chess960F2=urlParams.get('Bullet_Chess960F2');
Rapid_Chess960F2=urlParams.get('Rapid_Chess960F2');
Long_Chess960F2=urlParams.get('Long_Chess960F2');

if(username) {
    $('#user').text(`User Name: ${username}`);
}
$('#email').text(`Email: ${email}`);

$('#fork0blitzELO').text(`${Blitz_ChessF0}`);
$('#fork0bulletELO').text(`${Bullet_ChessF0}`);
$('#fork0rapidELO').text(`${Rapid_ChessF0}`);
$('#fork0longELO').text(`${Long_ChessF0}`);

$('#fork1blitzELO').text(`${Blitz_ChessF1}`);
$('#fork1bulletELO').text(`${Bullet_ChessF1}`);
$('#fork1rapidELO').text(`${Rapid_ChessF1}`);
$('#fork1longELO').text(`${Long_ChessF1}`);

$('#fork2blitzELO').text(`${Blitz_ChessF2}`);
$('#fork2bulletELO').text(`${Bullet_ChessF2}`);
$('#fork2rapidELO').text(`${Rapid_ChessF2}`);
$('#fork2longELO').text(`${Long_ChessF2}`);



function newGameOnClick() {
    let data = {
        username: username,
        password: password
    };
    location.href ="/homepage?" + $.param(data);
}

function displayChallenges() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//
    console.log("****PLAYER CHALLENGES***");
    console.log(username);
    let data = {
        username: username,
        password: password
    };
    location.href = "/challenges?" + $.param(data);
}

function displayTopRankings() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//
    console.log("****TOP RANKINGS***");
    console.log(username);
    let data = {
        username: username,
        password: password
    };
    location.href = "/topRankings?" + $.param(data);
}

function onLogOut() {
    location.href = "/?" + $.param("");
}