
const urlParams = new URLSearchParams(window.location.search);
var username = urlParams.get('username');
var password = urlParams.get('password');
if(username) {
    $('#user').text(`User Name: ${username}`);
}
if(urlParams.get('cancel')){
    alert('Sorry, This Challenge Has Been Canceled!');
}
let totalNum = urlParams.get('num');
if(totalNum){
    totalNum = parseInt(totalNum);
    let table = document.querySelector('#challengeTable').getElementsByTagName('tbody')[0];
    document.querySelector('#challengeTable').hidden = false;
    for (let i = 0; i < totalNum; i++) {
        let from = urlParams.get(`from_${i}`);
        let gameType = urlParams.get(`gameType_${i}`);
        let rateType = urlParams.get(`rateType_${i}`);
        let gameSpec = urlParams.get(`gameSpec_${i}`);
        gameSpec = gameSpec.replace(/_/,'+');

        let row = document.createElement('tr');
        row.innerHTML += `<td>${from}</td>`;
        row.innerHTML += `<td>${gameType}</td>`;
        row.innerHTML += `<td>${rateType}</td>`;
        row.innerHTML += `<td>${gameSpec}</td>`;
        row.innerHTML += `<button class="btn btn-success" onclick="acceptChallenge(this.parentNode)">ACCEPT</button>&nbsp`;
        row.innerHTML += `<button class="btn btn-default" onclick="declineChallenge(this.parentNode)">DECLINE</button>`
        table.appendChild(row);
    }
} else{
    document.querySelector('#noChallenge').hidden = false;
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

function displayTopRankings() {
    // var username= urlParams.get('username');////document.getElementById("userID").value; "johnHeinz1";//
    console.log("****TOP RANKINGS***");
    console.log(username);
    let data = {
        username: username,
    };
    location.href = "/topRankings?" + $.param(data);
}

function acceptChallenge(parentHtml){
    let from = parentHtml.getElementsByTagName('td')[0].innerText.trim();
    let data = {
        from: from,
        to: username,
        password: password
    }
    location.href = '/acceptChallenge?' + $.param(data);
}

function declineChallenge(parentHtml){
    let from = parentHtml.getElementsByTagName('td')[0].innerText.trim();
    let data = {
        from: from,
        to: username,
        password: password
    }
    location.href = '/declineChallenge?' + $.param(data);
}

function onLogOut() {
    location.href = "/?" + $.param("");
}