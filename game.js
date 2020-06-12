// the order of elements in this array is: gameType, startTime, timeIncrement, forkAvailable
var param = Array(4);
getPara();
console.log(param);
// function that get parameters from the URL
function getPara() {
    let loc = location.href;
    let para = loc.split("?")[1].split("&");
    for (let i = 0; i < para.length; i++) {
        param[i] = para[i].split("=")[1];
    }
}


var games = Array(parseInt(param[3]) * 2 + 1);
// initialize all games in the games array
for (let i = 0; i <games.length; i++) {
    games[i] = new Chess();
}

var boards = Array(games.length); // Same length boards array contains all game boards corresponding to games.
var timers = Array(games.length); // Same length timers array contains all timers corresponding to each board.
var socket = io(); // calls the io.on('connection') function in server.

var color = "white";
var players;
var roomId;
var play = true;
var totalGame = 1;
var room = document.getElementById("room");
var roomNumber = document.getElementById("roomNumbers");
var button = document.getElementById("button");
var state = document.getElementById('state');
var forkButton= document.getElementById('forkButton_1');


var connect = function(){
    roomId = room.value;
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove();
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove();
        socket.emit('joined', roomId);
    }
};

socket.on('full', function (msg) {
    if(roomId == msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress";
        // document.querySelector(".msg").hidden = true;
        
        // show fork button
        forkButton.hidden=false;

        // show pgn, fen, and status
        document.querySelector('.hidden').hidden=false;
        // change fork available counts
        document.querySelector("#forkCount").hidden = false;
        document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";

        // start timer (first game) for this player
        startTimer(1, {minutes: parseInt(param[1])});
        if (color === 'black') {
            timers[0].pause();
            forkButton.disabled = true;
        }
    }
    // console.log(msg)
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        let fork = document.querySelector("#forkButton_"+msg.boardId);
        games[msg.boardId-1].move(msg.move);
        boards[msg.boardId-1].position(games[msg.boardId-1].fen());
        console.log("moved with " + (msg.boardId-1));
        updateStatus(msg.boardId);
        timers[msg.boardId-1].start(); // resume the timer
        fork.disabled = false; // active the fork
    }
});

var removeGreySquares = function (id) {
    $('#board_' + id + ' .square-55d63').css('background', '');
};

var greySquare = function (square,id) {
    var squareEl = $('#board_'+ id + ' .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    let id = this.ID;
    if (games[id-1].game_over() === true || play ||
        (games[id-1].turn() === 'w' && piece.search(/^b/) !== -1) ||
        (games[id-1].turn() === 'b' && piece.search(/^w/) !== -1) ||
        (games[id-1].turn() === 'w' && color === 'black') ||
        (games[id-1].turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

var onDrop = function (source, target) {
    let id = this.ID;
    let fork = document.querySelector("#forkButton_"+id);
    removeGreySquares(id);
    // see if the move is legal
    var move = games[id-1].move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    if (games[id-1].game_over()) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
        timers[id-1].stop();
    }

    // illegal move
    if (move === null) return 'snapback';
    else
        updateStatus(id);
        socket.emit('move', { move: move, board: games[0].fen(), room: roomId, boardId: this.ID});
        timers[id-1].pause(); // pause the timer
        fork.disabled = true; // disable the fork
        // console.log(this.ID)
};

var onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    let id = this.ID;
    var moves = games[id-1].moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square,id);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to,id);
    }
};

var onMouseoutSquare = function (square, piece) {
    let id = this.ID;
    removeGreySquares(id);
};

var onSnapEnd = function () {
    let id = this.ID;
    boards[id-1].position(games[id-1].fen());
};


socket.on('player', (msg) => {
    var plno = document.getElementById('player');
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress";
        // document.querySelector(".msg").hidden = true;
        forkButton.disabled=false;
        forkButton.hidden=false;
        document.querySelector('.hidden').hidden=false;

        // show fork count
        document.querySelector("#forkCount").hidden = false;
        document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";

        // Start the timer (first game) for this player
        startTimer(1, {minutes: parseInt(param[1])});
        if (color === 'black') {
            timers[0].pause();
            forkButton.disabled = true;
        }
    }
    else
        state.innerHTML = "Waiting for Second player";


    var cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd,
        ID: 1
    };
    boards[0] = ChessBoard('board_1', cfg);
});

socket.on('player_fork', function (msg){
    // alert(123);
    fork(msg.ID);
    // this line is just for testing,
    // document.querySelector('#roomNumbers').style.backgroundColor = 'red';
});

function updateStatus (id) {
    var status = '';

    var $status = $('#status_' + id);
    var $fen = $('#fen_' + id);
    var $pgn = $('#pgn_' + id);

    var moveColor = 'White';
    if (games[id - 1].turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (games[id - 1].in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (games[id - 1].in_draw()) {
        status = 'Game over, drawn position'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (games[id - 1].in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    $status.html(status);
    $fen.html(games[id - 1].fen());
    $pgn.html(games[id - 1].pgn());
}

function fork(id){
    // var fen = $('#fen_'+id)[0].innerText;
    let fen = games[id-1].fen();
    totalGame++;
    let new_id = totalGame;
    console.log(new_id);
    var container = document.querySelector(".container");
    var new_div = document.querySelector("#game_"+id).cloneNode(true);
    var new_board = new_div.querySelector("#board_"+id);
    let new_timer = new_div.querySelector("#timer_"+id);

    // setting up new id (incremented by 1) for all copied elements
    new_div.querySelector("#fen_"+id).setAttribute("id","fen_"+new_id);
    new_div.querySelector("#status_"+id).setAttribute("id","status_"+new_id);
    new_div.querySelector("#pgn_"+id).setAttribute("id","pgn_"+new_id);
    new_div.querySelector("#forkButton_"+id).setAttribute("id","forkButton_"+new_id);
    new_board.setAttribute("id","board_"+new_id);
    new_div.setAttribute("class","game");
    new_div.setAttribute("id","game_"+new_id);
    new_timer.setAttribute("id", "timer_"+new_id);
    container.appendChild(new_div);

    // NOTE: this example uses the chess.js library:
    // https://github.com/jhlywa/chess.js

    // load the fen to new game
    games[new_id-1].load(fen);

    var config = {
        orientation: color,
        draggable: true,
        position: fen,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd,
        ID: new_id
    };

    boards[new_id-1] = ChessBoard(('board_'+ (new_id)), config);

    updateStatus(new_id);

    // get the timer from previous (forked) board and start the new timer based on the time remaining value
    let timeRemain = timers[id-1].getTimeValues(); // get the remaining time
    // console.log(timeRemain);
    startTimer(new_id, {
        days: timeRemain.days,
        minutes: timeRemain.minutes,
        seconds: timeRemain.seconds,
        secondTenths: timeRemain.secondTenths});
    if (!timers[id-1].isRunning()) timers[new_id-1].pause();

}

var sendForkRequest = function (parentHtml) {
    // alert('clicked')
    // console.log(parentHtml);
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    // console.log("this clicked id is " + id);
    let msg = {roomId: roomId, ID:id};
    socket.emit('fork', msg);

    param[3] = (parseInt(param[3]) - 1).toString(); // decrease fork count by 1

    // update the fork count
    document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";
    let allFork = document.querySelectorAll(".f_btn");

    // if fork available left is 0, disable all fork buttons
    if (param[3] === "0") {
        for (let i = 0; i < allFork.length; i++) {
            allFork[i].disabled = true;
        }
    }
};

function startTimer(id, timeObject) {
    timers[id-1] = new easytimer.Timer();
    let timer = timers[id-1];
    timer.start({countdown: true, startValues: timeObject});
    $('#timer_' + id + ' .values').html(timer.getTimeValues().toString());
    timer.addEventListener('secondsUpdated', function (e) {
        $('#timer_'+ id + ' .values').html(timer.getTimeValues().toString());
    });

    // this event listener needs to be CHANGED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    timer.addEventListener('targetAchieved', function (e) {
        $('#timer_' + id + ' .values').html('KABOOM!!');
    });
}

function sendResignRequest(parentHtml){
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    socket.emit('resign',msg);
    // followed by the game over logic (losing side)
}

socket.on("opponentResign", function(msg){
    alert(msg);
    // followed by the game over logic (winning side)
});

function offerDraw(parentHtml) {
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    socket.emit('offerDraw',msg);
}

socket.on('opponentOfferDraw', function(msg){
    let id = msg.ID;
    let re = confirm("Your opponent offered a draw on board #" + id + ". Do you accept?");
    if (re === true){
        // draw logic follows
    } else {
        // dont accept draw
    }
});
// console.log(color)

// var board;
