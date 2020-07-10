
//Fetching values from the URL

const urlParams = new URLSearchParams(window.location.search);
let username = urlParams.get('username');
Blitz_Chess= urlParams.get('Blitz_Chess');
Bullet_Chess=urlParams.get('Bullet_Chess');
Rapid_Chess=urlParams.get('Rapid_Chess');
Long_Chess=urlParams.get('Long_Chess');
Blitz_Chess960=urlParams.get('Blitz_Chess960');
Bullet_Chess960=urlParams.get('Bullet_Chess960');
Rapid_Chess960=urlParams.get('Rapid_Chess960');
Long_Chess960=urlParams.get('Long_Chess960');
if(username) {
    $('#user').text(`User Name: ${username}`);
}


function newGameOnClick() {

}

function displayChallenges() {

}

function displayTopRankings() {

}

function onLogOut() {
    location.href = "/?" + $.param("");
}