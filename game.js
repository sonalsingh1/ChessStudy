// the order of elements in this array is: gameType, startTime, timeIncrement, forkAvailable
var param = Array(4);
//This variable contains the total number of boards where the game is over
var gameOverBoardCount=0;

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
var opponentTimers = Array(games.length); // Same length timers array contains all opponent timers corresponding to each board.
var gameOverBoards = Array(games.length).fill(false);

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
var timeUp=false;
var resigned= false;
var isGameOver= false;

var connect = function(){
    let qName = param[0] + "_" + param[1] + "_" + param[2] + "_" + param[3];
    room.remove();
    button.remove();
    socket.emit('joined', qName);
};

// manually call the connect function
connect();

socket.on('full', function (msg) {
    if(roomId === msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('play', function (msg) {
    if (msg === roomId) {
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
        if(parseInt(param[3]) === 0) {
            document.querySelector("#forkButton_1").disabled = true;
        } else {
            document.querySelector("#forkButton_1").disabled = false;
        }
        // start timer (first game) for this player
        startTimer(1, {minutes: parseInt(param[1])});
        startOpponentTimer(1,{minutes: parseInt(param[1])});
        if (color === 'black') {
            timers[0].pause();
            forkButton.disabled = true;
        } else opponentTimers[0].pause();
    }
    // console.log(msg)
});

socket.on('move', function (msg) {
    if (msg.room === roomId) {
        let fork = document.querySelector("#forkButton_"+msg.boardId);
        games[msg.boardId-1].move(msg.move);
        boards[msg.boardId-1].position(games[msg.boardId-1].fen());
        console.log("moved with " + (msg.boardId-1));
        updateStatus(msg.boardId);
        timers[msg.boardId-1].start(); // resume the timer
        increaseTime(msg.boardId,true); // increment opponent timer
        opponentTimers[msg.boardId-1].pause(); // pause the opponent timer

        // if there still more fork for the user
        if (parseInt(param[3]) > 0) {
            fork.disabled = false; // active the fork
        }
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
        (games[id-1].turn() === 'b' && color === 'white') ||
        (gameOverBoards[id-1])){
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
        opponentTimers[id-1].stop();
    }

    // illegal move
    if (move === null) return 'snapback';
    else
        updateStatus(id);
        socket.emit('move', { move: move, board: games[0].fen(), room: roomId, boardId: this.ID});
        increaseTime(id,false);
        timers[id-1].pause(); // pause the timer
        opponentTimers[id-1].start();
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
    roomId = msg.roomId; // setting up the roomID
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
        if(parseInt(param[3]) === 0) {
            document.querySelector("#forkButton_1").disabled = true;
        } else {
            document.querySelector("#forkButton_1").disabled = false;
        }
        // Start the timer (first game) for this player
        startTimer(1, {minutes: parseInt(param[1])});
        startOpponentTimer(1,{minutes: parseInt(param[1])});
        if (color === 'black') {
            timers[0].pause();
            forkButton.disabled = true;
        } else opponentTimers[0].pause();
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
    fork(msg.ID);
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
    if(isGameOver){
        console.log("Game Over!")
        status = 'Game over for board '+ id;
    }else if(resigned){
        console.log("Resigned board= ", id)
        status = 'Game over, resigned by ' + moveColor
    }else if(timeUp){
        console.log("Time Up for board ", id)
        status = 'Game over, time Up for ' + moveColor
    }else {
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
            status = moveColor + ' to move';

            // check?
            if (games[id - 1].in_check()) {
                status += ', ' + moveColor + ' is in check'
            }
        }
    }
    $status.html(status);
    $fen.html(games[id - 1].fen());
    $pgn.html(games[id - 1].pgn());
    if(parseInt(param[3]) === 0) document.querySelector("#forkButton_"+id).disabled = true;
}

function fork(id){
    // var fen = $('#fen_'+id)[0].innerText;
    let fen = games[id-1].fen();
    totalGame++;
    let new_id = totalGame;
    var container = document.querySelector(".container");
    var new_div = document.querySelector("#game_"+id).cloneNode(true);
    var new_board = new_div.querySelector("#board_"+id);
    let new_timer = new_div.querySelector("#timer_"+id);
    let new_opponentTimer = new_div.querySelector("#opponentTimer_"+id);

    // setting up new id (incremented by 1) for all copied elements
    new_div.querySelector("#fen_"+id).setAttribute("id","fen_"+new_id);
    new_div.querySelector("#status_"+id).setAttribute("id","status_"+new_id);
    new_div.querySelector("#pgn_"+id).setAttribute("id","pgn_"+new_id);
    new_div.querySelector("#forkButton_"+id).setAttribute("id","forkButton_"+new_id);
    new_div.querySelector("#resignButton_"+id).setAttribute("id","resignButton_"+new_id);
    new_div.querySelector("#drawButton_"+id).setAttribute("id","drawButton_"+new_id);

    new_board.setAttribute("id","board_"+new_id);
    new_div.setAttribute("class","game");
    new_div.setAttribute("id","game_"+new_id);
    new_timer.setAttribute("id", "timer_"+new_id);
    new_opponentTimer.setAttribute('id','opponentTimer_'+new_id);
    container.appendChild(new_div);

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

    let opponentTimeRemain = opponentTimers[id-1].getTimeValues();
    startOpponentTimer(new_id, {
        days: opponentTimeRemain.days,
        minutes: opponentTimeRemain.minutes,
        seconds: opponentTimeRemain.seconds,
        secondTenths: opponentTimeRemain.secondTenths});
    if (!opponentTimers[id-1].isRunning()) opponentTimers[new_id-1].pause();
}

var sendForkRequest = function (parentHtml) {
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    socket.emit('fork', msg);

    param[3] = (parseInt(param[3]) - 1).toString(); // decrease fork count by 1

    // update the fork count
    document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";

    // if fork available left is 0, disable all fork buttons
    if (param[3] === "0") {
        let allFork = document.querySelectorAll(".f_btn");
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

    timer.addEventListener('targetAchieved', function (e) {
        $('#timer_' + id + ' .values').html('TIME UP!!');
        let msg = {roomId: roomId, ID:id};
        socket.emit('timeUp', msg);
        timeUp=true;
    });
}

function startOpponentTimer(id, timeObject) {
    opponentTimers[id-1] = new easytimer.Timer();
    let timer = opponentTimers[id-1];
    timer.start({countdown: true, startValues: timeObject});
    $('#opponentTimer_' + id + ' .values').html(timer.getTimeValues().toString());
    timer.addEventListener('secondsUpdated', function (e) {
        $('#opponentTimer_'+ id + ' .values').html(timer.getTimeValues().toString());
    });

    // this event listener needs to be CHANGED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    timer.addEventListener('targetAchieved', function (e) {
        $('#opponentTimer_' + id + ' .values').html('TIME UP!!');
    });
}

// game over logic for a single board, when all board is over, send out total game over to the server.
function gameOverForBoard(msg){
    gameOverBoardCount++;
    if(gameOverBoardCount===totalGame){
        state.innerHTML = 'GAME OVER!';
        document.querySelector('#DLButton').hidden = false;
    }
        timers[msg.ID-1].stop();
        updateStatus(msg.ID);
        disableBoardButton(msg.ID);
        gameOverBoards[msg.ID-1] = true;
}

// disable all buttons for the specific board
function disableBoardButton(id){
    document.querySelector('#forkButton_'+id).disabled = true;
    document.querySelector('#resignButton_'+id).disabled = true;
    document.querySelector('#drawButton_'+id).disabled = true;
}


socket.on('timeUp', function (msg) {
    if(msg.roomId===roomId) {
        timeUp=true;
        gameOverForBoard(msg);
    }
});

socket.on('gameOver', function (msg) {
    if(msg.roomId===roomId) {
        gameOverForBoard(msg);
        isGameOver = true;
    }
});

function sendResignRequest(parentHtml){
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    socket.emit('resign',msg);
    resigned=true;
    gameOverForBoard(msg);
    // TODO: followed by the game over logic (losing side)
}

socket.on("opponentResign", function(msg){
    resigned= true;
    gameOverForBoard(msg);
    // TODO: followed by the game over logic (winning side)
});

function offerDraw(parentHtml) {
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    socket.emit('offerDraw',msg);
}

socket.on('opponentOfferDraw', function(msg){
    if(roomId === msg.roomId) {
        let id = msg.ID;
        let re = confirm("Your opponent offered a draw on board #" + id + ". Do you accept?");
        if (re === true) {
            // draw logic follows
            socket.emit('drawAccepted', msg);
        } else {
            // dont accept draw
        }
    }
});

socket.on('drawAccepted', function(msg){
    if(roomId === msg.roomId){
        gameOverForBoard(msg);
    }
});

function increaseTime(id,oppo){
    let timer;

    if(oppo === false) {
        timer = timers[id - 1];
    } else timer = opponentTimers[id-1];

    let timeIncrement = parseInt(param[2]);
    let new_time = timer.getTimeValues();
    let new_min = new_time.minutes, new_sec = new_time.seconds;
    let s = new_time.seconds + timeIncrement;
    if (s >= 60) { //need increase in minutes
        new_min += Math.floor(s / 60);
        new_sec = s % 60;
    } else {
        new_sec += timeIncrement;
    }
    timer.stop();
    timer.start({countdown: true, startValues: {minutes: new_min,
                                                seconds: new_sec}});
    $('#timer_' + id + ' .values').html(timer.getTimeValues().toString());

}


// console.log(color)

// var board;
