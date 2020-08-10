const urlParams = new URLSearchParams(window.location.search);
// the order of elements in this array is: gameType, startTime, timeIncrement, forkAvailable, rateType, userName, Chess game type
var param = Array(10);
//This variable contains the total number of boards where the game is over
var gameOverBoardCount=0;
var self_elo, opponent_elo;
var final_pgn_content = "";
var oppo_content;
var pgn_file_name;
var old_elo, new_elo;
var started = false;
var challenge = urlParams.get('challenge');
var secondPlayer = urlParams.get('second')
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
$('#game_type').text(`Game Type: ${param[0]}_${param[1]}+${param[2]}*${param[3]}`);

var games = Array(parseInt(param[3]) * 2 + 1);
// initialize all games in the games array
for (let i = 0; i <games.length; i++) {
    games[i] = new Chess();
}
var winners = [];
var boards = Array(games.length); // Same length boards array contains all game boards corresponding to games.
var timers = Array(games.length); // Same length timers array contains all timers corresponding to each board.
var opponentTimers = Array(games.length); // Same length timers array contains all opponent timers corresponding to each board.
var gameOverBoards = Array(games.length).fill(false);
var timeUpStatusArray = Array(games.length).fill(false);
var resignStatusArray = Array(games.length).fill(false);

var socket = io(); // calls the io.on('connection') function in server.

var pgn_file_content = Array(games.length); // array to record pgn movement and timestamps
for (let i = 0; i <pgn_file_content.length ; i++) {
    pgn_file_content[i] = "";
}
// console.log(pgn_file_content);

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
// let timeUp=false;
// let resigned= false;
let isGameOver= false;

var connect = function(){
    let qName = param[0] + "_" + param[1] + "_" + param[2] + "_" + param[3]+"_"+param[7]+"_"+param[4];// should be of format: bullet_1_0_0_chess
    console.log("qName in game.js="+qName);
    room.remove();
    button.remove();
    let data = {
        qName: qName,
        username: param[5]
    };
    if (!challenge) {
        socket.emit('joined', data);
    } else{
        if (secondPlayer){
            roomId = urlParams.get('roomId');
            data = {
                qName: qName,
                username: param[5],
                roomId: roomId,
                from: secondPlayer
            }
            socket.emit('second_challenge',data);
        } else {
            roomId = urlParams.get('roomId');
            data = {
                qName: qName,
                username: param[5],
                roomId: roomId
            }
            socket.emit('challenge', data);
        }
    }
};

// manually call the connect function
connect();

socket.on('full', function (msg) {
    if(roomId === msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('move', function (msg) {
    if (msg.room === roomId) {
        if (!started){
            started = true;
            document.querySelector('#AbortBtn').hidden = true;
            document.querySelector('#AbortLab').hidden = true;
            $('#resignButton_1').prop('disabled',false);
            $('#drawButton_1').prop('disabled',false);
        }
        let fork = document.querySelector("#forkButton_"+msg.boardId);
        pgn_file_content[msg.boardId-1] = msg.pgn;
        games[msg.boardId-1].move(msg.move);
        boards[msg.boardId-1].position(games[msg.boardId-1].fen());
        updateStatus(msg.boardId);

        let oppo_time = msg.oppo_time;
        replaceOppoTime(oppo_time, msg.boardId);
        opponentTimers[msg.boardId-1].pause(); // pause the opponent timer
        timers[msg.boardId-1].start(); // resume the timer

        // if there still more fork for the user
        if (parseInt(param[3]) > 0) {
            fork.disabled = false; // active the fork
        }
    }
});

function replaceOppoTime(oppoTime, id){
    let timer = opponentTimers[id-1];
    let new_min = oppoTime.minutes, new_sec = oppoTime.seconds, new_tenth = oppoTime.secondTenths;
    timer.stop();
    timer.start({countdown: true, startValues: {minutes: new_min,
            seconds: new_sec,
            secondTenths: new_tenth}, precision: 'secondTenths'});
    $('#opponentTimer_'+ id + ' .values').html(timer.getTimeValues().toString());
}

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
        socket.emit('gameOver', roomId);
    }

    // illegal move
    if (move === null) return 'snapback';
    else {
        if(!started){
            // game started, hide the abort button
            started = true;
            document.querySelector('#AbortBtn').hidden = true;
            document.querySelector('#AbortLab').hidden = true;
            $('#resignButton_1').prop('disabled',false);
            $('#drawButton_1').prop('disabled',false);
        }
        if (!timeUpStatusArray[id - 1]) {
            pgn_file_content[id - 1] += '@' + timers[id - 1].getTimeValues().toString() + " ";
            updateStatus(id);
            // increase my own timer
            increaseTime(id);
            timers[id - 1].pause(); // pause the timer immediately
            socket.emit('move', {
                move: move,
                board: games[0].fen(),
                room: roomId,
                boardId: this.ID,
                pgn: pgn_file_content[id - 1],
                oppo_time: timers[id - 1].getTimeValues()
            });
            opponentTimers[id - 1].start();
            fork.disabled = true; // disable the fork
        }
    }
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
    let elo = msg.eloRating;

    plno.innerHTML = `Player: ${param[5]} - ${elo} : ${color}`;
    players = msg.players;

    if(players === 2){
        play = false;
        let msg = {
          roomId:roomId
        };
        socket.emit('start', msg);
        state.innerHTML = "Game in Progress";
        forkButton.disabled=false;
        forkButton.hidden=false;
        document.querySelector('.hidden').hidden=false;

        // show fork count
        document.querySelector("#forkCount").hidden = false;
        document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";
        //hide cancel button
        document.querySelector('#cancelButton').hidden = true;
        document.querySelector("#forkButton_1").disabled = parseInt(param[3]) === 0;
        // Start the timer (first game) for this player
        startTimer(1, {minutes: parseInt(param[1])});
        timers[0].pause();
        startOpponentTimer(1,{minutes: parseInt(param[1])});
        opponentTimers[0].pause();
        if (color === 'black') forkButton.disabled = true;
        $('#resignButton_1').prop('disabled',true);
        $('#drawButton_1').prop('disabled',true);

        document.querySelector('#AbortBtn').hidden = false;
        document.querySelector('#AbortLab').hidden = false;
    }
    else {
        state.innerHTML = "Waiting for Second player";
    }
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

socket.on('start', function (msg){
   if(msg.roomId === roomId){
       play = false;
       let msg = {
           roomId:roomId
       };
       state.innerHTML = "Game in Progress";
       // document.querySelector(".msg").hidden = true;
       forkButton.disabled=false;
       forkButton.hidden=false;
       document.querySelector('.hidden').hidden=false;

       // show fork count
       document.querySelector("#forkCount").hidden = false;
       document.querySelector("#forkCount").innerHTML = "<strong> Fork Available: " + param[3] + "</strong>";
       document.querySelector("#forkButton_1").disabled = parseInt(param[3]) === 0;
       document.querySelector('#cancelButton').hidden = true;
       // Start the timer (first game) for this player
       startTimer(1, {minutes: parseInt(param[1])});
       timers[0].pause();
       startOpponentTimer(1,{minutes: parseInt(param[1])});
       opponentTimers[0].pause();
       if (color === 'black') forkButton.disabled = true;

       document.querySelector('#AbortBtn').hidden = false;
       document.querySelector('#AbortLab').hidden = false;
       setTimeout(function (){
           if(!started){
               abort();
           }
       }, 20000);
       $('#resignButton_1').prop('disabled',true);
       $('#drawButton_1').prop('disabled',true);
   }
});


socket.on('player_fork', function (msg){
    fork(msg.ID);
});


socket.on('opponentDisconnected', function (msg){
    if(roomId===msg.roomId && !isGameOver) {
        let opponentELO = msg.opponentElo;
        let opponentName = msg.playerIdDisconnected;
        msg = {
            username: param[5],
            opponentName: opponentName,
            opponentELO: opponentELO,
            elo_col: param[6],
            roomId: roomId
        }
        socket.emit('calc_dc_elo', msg);
    }
});

socket.on('dc_elo_done', function (msg){
    alert('Opponent Disconnected, you win!');
    location.href = `/homepage?username=${param[5]}&password=${param[8]}`;
})


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
        console.log("Game Over!");
        status = 'Game over for board '+ id;
    }else if(resignStatusArray[id-1]){
        console.log("Resigned board= ", id);
        status = 'Resigned! Game over!';
    }else if(timeUpStatusArray[id-1]){
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
    if(!started){
        // game started, hide the abort button
        started = true;
        document.querySelector('#AbortBtn').hidden = true;
        document.querySelector('#AbortLab').hidden = true;
        $('#resignButton_1').prop('disabled',false);
        $('#drawButton_1').prop('disabled',false);
        if (color === 'white') {
            timers[id - 1].start();
        } else{
            opponentTimers[id - 1].start();
        }
    }
    // var fen = $('#fen_'+id)[0].innerText;
    let fen = games[id-1].fen();
    totalGame++;
    let new_id = totalGame;
    var container = document.querySelector(".container");
    var new_div = document.querySelector("#game_"+id).cloneNode(true);
    var new_board = new_div.querySelector("#board_"+id);
    let new_timer = new_div.querySelector("#timer_"+id);
    let new_opponentTimer = new_div.querySelector("#opponentTimer_"+id);
    let new_board_label = new_div.querySelector('#bn_'+id);

    // setting up new id (incremented by 1) for all copied elements
    new_div.querySelector("#fen_"+id).setAttribute("id","fen_"+new_id);
    new_div.querySelector("#status_"+id).setAttribute("id","status_"+new_id);
    new_div.querySelector("#pgn_"+id).setAttribute("id","pgn_"+new_id);
    new_div.querySelector("#forkButton_"+id).setAttribute("id","forkButton_"+new_id);
    new_div.querySelector("#resignButton_"+id).setAttribute("id","resignButton_"+new_id);
    new_div.querySelector("#drawButton_"+id).setAttribute("id","drawButton_"+new_id);
    new_div.querySelector('#bn_'+id).setAttribute('id','bn_'+new_id);
    new_div.querySelector('#bn_'+new_id).innerText = `Board #: ${new_id}`;
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
    pgn_file_content[new_id-1] += `F${id}-${new_id}: `;
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
    timer.start({countdown: true, startValues: timeObject, precision:'secondTenths'});
    $('#timer_' + id + ' .values').html(timer.getTimeValues().toString());
    timer.addEventListener('secondsUpdated', function (e) {
        $('#timer_'+ id + ' .values').html(timer.getTimeValues().toString());
    });

    timer.addEventListener('targetAchieved', function (e) {
        $('#timer_' + id + ' .values').html('TIME UP!!');
        let msg = {roomId: roomId, ID:id};
        winners.push(0);
        gameOverForBoard(msg);
        // timeUp=true;
        timeUpStatusArray[id-1]=true;
        console.log("targetAchieved timeUpStatusArray="+timeUpStatusArray);
        updateStatus(msg.ID);
        socket.emit('timeUp', msg);
    });
}

function startOpponentTimer(id, timeObject) {
    opponentTimers[id-1] = new easytimer.Timer();
    let timer = opponentTimers[id-1];
    timer.start({countdown: true,precision:'secondTenths' ,startValues: timeObject});
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
        totalGameOver();
        socket.emit('totalGameOver',roomId);
    }
    timers[msg.ID-1].pause();
    opponentTimers[msg.ID-1].pause();
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
        console.log("Received opponent time up for ", msg.ID);
        // timeUp=true;
        timeUpStatusArray[msg.ID-1]=true;
        winners.push(1);
        gameOverForBoard(msg);
    }
});

socket.on('gameOver', function (msg) {
    if(msg.roomId===roomId) {
        let id = msg.ID;
        if(games[id-1].in_checkmate()){
            winners.push(1);
        } else if (games[id-1].in_draw() || games[id-1].in_stalemate() || games[id-1].in_threefold_repetition()){
            winners.push(0.5);
        } else {
            winners.push(0);
        }
        gameOverForBoard(msg);
        isGameOver = true;
    }
});

function sendResignRequest(parentHtml){
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    let resignConfirm = confirm("You are about to resign. Do you confirm?");
    if (resignConfirm) {
        socket.emit('resign', msg);
        // resigned=true;
        resignStatusArray[id - 1] = true;
        winners.push(0);
        gameOverForBoard(msg);
    }
}

socket.on('opponentResign', function(msg){
    resignStatusArray[msg.ID-1]=true;
    winners.push(1);
    gameOverForBoard(msg);
});

function offerDraw(parentHtml) {
    let id = parseInt(parentHtml.querySelector('.board').getAttribute('id').split('_')[1]);
    let msg = {roomId: roomId, ID:id};
    let drawConfirm = confirm("You are about to offer a draw. Do you confirm?");
    if (drawConfirm) {
        socket.emit('offerDraw', msg);
    }
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
        winners.push(0.5);
        gameOverForBoard(msg);
    }
});

function increaseTime(id){
    if (timeUpStatusArray[id-1]) return;
    let timer = timers[id - 1];

    let timeIncrement = parseInt(param[2]);
    let new_time = timer.getTimeValues();
    let new_min = new_time.minutes, new_sec = new_time.seconds, new_tenth = new_time.secondTenths;
    let s = new_time.seconds + timeIncrement;
    if (s >= 60) { //need increase in minutes
        new_min += Math.floor(s / 60);
        new_sec = s % 60;
    } else {
        new_sec += timeIncrement;
    }
    timer.stop();
    timer.start({countdown: true, startValues: {minutes: new_min,
                                                seconds: new_sec,
                                                secondTenths: new_tenth}, precision: 'secondTenths'});
    $('#timer_' + id + ' .values').html(timer.getTimeValues().toString());
}

// The entire game is over, including all boards.
// Execute total game over logic for this client, change the state and show DL game button.
socket.on('totalGameOver', function(msg){
    if(msg.roomId === roomId) {
        totalGameOver();
    }
});

function totalGameOver(){
    state.innerHTML = 'GAME OVER!';
    let rate_type = param[4];
    if (rate_type === "aggregate"){
        let sum = 0;
        for (let i = 0; i < winners.length ; i++) {
            sum += winners[i];
        }
        let msg = {
            roomId: roomId,
            username: param[5],
            score: sum,
            elo_col: param[6]
        };
        socket.emit('score', msg);
    } else if (rate_type === "independent"){
        let msg = {
            roomId: roomId,
            username: param[5],
            score: winners,
            elo_col: param[6]
        };
        socket.emit('independent_score', msg);
    }
}
// create_pgn_content();
function create_pgn_content(){
    let re = `${color} ${param[5]}: ELO - ${old_elo}` + "\n";
    for (let i = 0; i <games.length ; i++) {
        let timestamp = pgn_file_content[i].trim().split(' ');
        if(i !== 0){
            re += timestamp[0] + " ";
            timestamp.splice(0,1);
        }
        // let pgn =
        //     '[SetUp "1"] [FEN "rnbqkbnr/pppppppp/8/8/P7/8/1PPPPPPP/RNBQKBNR b KQkq a3 0 1"] 1. ... f5 2. Nh3 h5 3. Ng5 e5 4. Nh7 Rxh7 5. Nc3 Kf7'.trim();
        let pgn = games[i].pgn();
        // move [] from pgn
        if(pgn.includes('[')){
            pgn = pgn.slice(pgn.lastIndexOf(']')+1,pgn.length);
        }
        let regex = /[0-9]+\./g;
        let index_array = pgn.match(regex);
        regex = /(\.\.\.)|([a-zA-Z]+[0-9]+\+?)/g;
        let move_array = pgn.match(regex);
        if (!move_array) continue;
        let k = 0, z = 0;
        for (let j = 0; j <move_array.length ; j++) {
            if(j%2 === 0){
                re += index_array[k]+' ';
                k++;
            }
            if (move_array[j] === '...'){
                re += move_array[j] + " ";
            } else {
                if (z < timestamp.length) {
                    re += move_array[j] + timestamp[z] + " ";
                    z++;
                } else {
                    re += move_array[j] + " ";
                }
            }
        }
        re += "\n";
    }
    re = re.trim() + "\n";
    re += `${color} ${param[5]}: ELO - ${new_elo}`;
    final_pgn_content = re;
    console.log(re);
}

socket.on('opponentScore', function (msg) {
    if(msg.roomId === roomId){
        let sum = 0;
        for (let i = 0; i < winners.length ; i++) {
            sum+=winners[i];
        }
        let opponentScore = msg.score;
        msg = {
            roomId: roomId,
            username: param[5],
            opponent_name: msg.username,
            elo_col: param[6],
            self_score: sum,
            opponent_score: opponentScore,
            opponent_elo: msg.old_elo
        };
        socket.emit('calcELO',msg);
    }
});


socket.on('new_elo',function (msg) {
    if(roomId === msg.roomId) {
        old_elo = msg.old_elo;
        new_elo = msg.new_elo;
        if (old_elo < new_elo) { // increase value
            let str = `ELO: ${old_elo} + ${new_elo - old_elo} = ${new_elo}`;
            $('#elo').text(str);
            $('#elo').attr('hidden', false);
            $('#elo').css('color', 'green');
        } else if (old_elo > new_elo) { // decrease value
            let str = `ELO: ${old_elo} - ${old_elo - new_elo} = ${new_elo}`;
            $('#elo').text(str);
            $('#elo').attr('hidden', false);
            $('#elo').css('color', 'red');
        } else {
            let str = `ELO: ${old_elo} = ${new_elo}`;
            $('#elo').text(str);
            $('#elo').attr('hidden', false);
            $('#elo').css('color', 'orange');
        }

        create_pgn_content();
        msg = {
            file_content: final_pgn_content,
            roomId:roomId
        };
        socket.emit('file_content',msg);
        console.log(final_pgn_content);
    }
});

socket.on('opponent_file_content', function (msg) {
    if(msg.roomId === roomId){
        oppo_content = msg.file_content;
        waitForElo();
    }
});


function waitForElo(){
    if(old_elo && new_elo){
        //variable exists, do what you want
        let content = `${color} ${param[5]}: ELO - ${old_elo}`+"\n"+oppo_content;
        content = content + '\n'+`${color} ${param[5]}: ELO - ${new_elo}`;
        let msg = {
            file_content: content,
            username: param[5],
            game_type: `${param[1]}_${param[2]}_${param[3]}`
        };
        socket.emit('pgn_file',msg);
    }
    else{
        setTimeout(waitForElo, 250);
    }
}

socket.on('opponent_independent_score', function(msg){
    if(msg.roomId === roomId) {
        // message from myself
        if(msg.username === param[5]) {
            self_elo = msg.old_elo;
        } else opponent_elo = msg.old_elo;

        if (self_elo && opponent_elo){ // if both messages received
            let msg = {
                roomId: roomId,
                score: winners,
                username: param[5],
                self_elo: self_elo,
                opponent_elo: opponent_elo,
                elo_col: param[6]
            };
            socket.emit('calc_independent_elo', msg);
        }

    }
});

socket.on('file_created', function (msg) {
    pgn_file_name = msg.pgn_file_name;
    document.querySelector('#DLButton').hidden = false;
    document.querySelector('#mainMenu').hidden = false;
});

socket.on('abort', function (msg){
   if(roomId === msg.roomId){
       alert('This game has been ABORTED!' +
           '\n\nYou will be redirected to your home page.');
       isGameOver = true;
       window.history.back();
   }
});

// window.addEventListener('beforeunload', function (e) {
//     e.preventDefault();
//     e.returnValue = '';
//     let username= param[5];
//     let password= param[8];
//     msg={
//         qName : param[0] + "_" + param[1] + "_" + param[2] + "_" + param[3]+"_"+param[7]+"_"+param[4],
//         username: username,
//         password: password
//     };
//     location.href = "/disconnected?" + $.param(msg);
//
// });

function downloadGame(){
    location.href = "/download?" + $.param({file_name: pgn_file_name});
}

function cancelGame(){
        let username = param[5];
        let password = param[8];
        let msg = {
            qName: param[0] + "_" + param[1] + "_" + param[2] + "_" + param[3] + "_" + param[7] + "_" + param[4],
            username: username,
            password: password
        };
    if (!challenge) {
        location.href = "/cancel?" + $.param(msg);
    } else {
        location.href = "/removeChallenge?" + $.param(msg);
    }
}
function abort(){
    let msg = {
        roomId: roomId
    }
    socket.emit('abort',msg);
}

function mainMenu(){
    let username = param[5];
    let password = param[8];
    location.href = `/homepage?username=${username}&password=${password}`;
}
