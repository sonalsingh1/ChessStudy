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
    queues.get(qName).push("1"); // 1 is going to be replaced by the player ID
    console.log(queues);
    res.sendFile(__dirname + '/games.html');
    // if (queues.get(qName).length >= 2) {
    //     let player1 = queues.get(qName).pop();
    //     let player2 = queues.get(qName).pop();
    //     let roomId = totalRoom++;
    //     games[roomId].players = 2;
    //     games[roomId].pid = [player1, player2];
    //
    //     socket.emit('player', { player1, players: 1 ,color: 'white', roomId });
    //     socket.emit('player', { player2, players: 2, color: 'black', roomId });
    //
    //     console.log('send files');
    //     res.sendFile(__dirname + '/games.html');
    // }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/homepage.html');
    // console.log(__dirname + '/homepage.html');
});

io.on('connection', function (socket) {
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1);
    

    console.log(playerId + ' connected');

    socket.on('joined', function (roomId) {
        // games[roomId] = {}
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        }
        else{
            socket.emit('full', roomId);
            return;
        }
        
        console.log(games[roomId]);
        players = games[roomId].players;
        

        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;

        
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

    socket.on('resign', function(msg){
        socket.broadcast.emit('opponentResign', msg)
    });

    socket.on('offerDraw', function(msg){
        socket.broadcast.emit('opponentOfferDraw',msg)
    });

    
});

server.listen(port);
console.log('Connected');