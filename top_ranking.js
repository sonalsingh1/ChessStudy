const urlParams = new URLSearchParams(window.location.search);
var username = urlParams.get('username');
var password = urlParams.get('password');

$('#rank1').text(urlParams.get('rank1'));
$('#rank2').text(urlParams.get('rank2'));
$('#rank3').text(urlParams.get('rank3'));
$('#rank4').text(urlParams.get('rank4'));
$('#rank5').text(urlParams.get('rank5'));
$('#rank6').text(urlParams.get('rank6'));
$('#rank7').text(urlParams.get('rank7'));
$('#rank8').text(urlParams.get('rank8'));
$('#rank9').text(urlParams.get('rank9'));
$('#rank10').text(urlParams.get('rank10'));


if(username) {
    $('#user').text(`User Name: ${username}`);
}

function getTopRanks() {
    let gameType = $('input[name="game_type"]:checked').val();
    let forkType = $('input[name="fork_type"]:checked').val();
    let formatType = $('input[name="format_type"]:checked').val();
    let columnName= formatType+"_"+gameType+"f"+forkType;
    // alert(columnName);
    let data= {
        username:username,
        password:password,
        columnName:columnName
    }
    console.log(data);
    location.href = "/topRank?" + $.param(data);
}


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

function onLogOut() {
    location.href = "/?" + $.param("");
}