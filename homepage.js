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