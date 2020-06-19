const express = require('express');
const http = require('http');
const socket = require('socket.io');
const queues = new Map();

const port = process.env.PORT || 8080;
var totalRoom = 0;
var app = express();
const server = http.createServer(app);
const io = socket(server);
var players;
var joined = true;

app.use(express.static(__dirname + "/"));
// console.log(__dirname + "/");

var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
}


app.get('/game', (req, res) => {
    console.log(req.query);
    let qName = req.query.gameType + "_" + req.query.startTime + "_" + req.query.timeIncrement + "_" + req.query.forkAvailable;
    if (!queues.has(qName)){
        queues.set(qName,[]);
    }
    res.sendFile(__dirname + '/games.html');

});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/homepage.html');
    // console.log(__dirname + '/homepage.html');
});

io.on('connection', function (socket) {
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1); // extracted from DB


    console.log(playerId + ' connected');

    socket.on('joined', function (qName) {
        match(playerId, qName);

    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        // console.log(msg);
    });

    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        console.log(playerId + ' disconnected');

    });

    socket.on('fork', function (msg) {
        // console.log('fork received');
        io.emit('player_fork', msg)
    });

    socket.on('timeUp', function (msg) {
        io.emit('timeUp', msg);
        console.log("timeUp " + msg);
    });

    socket.on('gameOver', function (msg) {
        io.emit('gameOver', msg);
        console.log("gameOver " + msg);
    });

    socket.on('resign', function(msg){
        socket.broadcast.emit('opponentResign', msg)
    });

    socket.on('offerDraw', function(msg){
        socket.broadcast.emit('opponentOfferDraw',msg)
    });

    function match(playerId, qName){
        // empty queue
        let roomId = totalRoom;
        if (queues.get(qName).length === 0) {
            queues.get(qName).push(playerId); // PlayerId is going to be replaced by the player ID extracted from DB
            socket.emit('player', { playerId, players: 1 ,color: 'white', roomId });
            // console.log("first player send " + roomId);
        } else { // already someone in the room
            queues.get(qName).pop(); // pop the player on top
            socket.emit('player', { playerId, players: 2 ,color: 'black', roomId });
            // console.log("second player send " + roomId);
            totalRoom++;
        }
        console.log(queues);

    }
    
});



server.listen(port);
console.log('Connected');