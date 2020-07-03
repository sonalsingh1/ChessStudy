const express = require('express');
const http = require('http');
const socket = require('socket.io');
const queues = new Map();

const port = process.env.PORT || 8080;
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

// array indicate if the room is full
var isRoomFull = new Array(100).fill(false);


app.get('/game', (req, res) => {
    let qName = req.query.gameType + "_" + req.query.startTime + "_" + req.query.timeIncrement + "_" + req.query.forkAvailable;
    if (!queues.has(qName)){
        queues.set(qName,[]);
    }
    res.sendFile(__dirname + '/games.html');
});

app.get('/homepage', (req, res) => {
    res.sendFile(__dirname + '/homepage.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/createuser',(req,res) => {
   res.sendFile(__dirname + '/signup.html');
});

app.get('/login', function(request, response) {
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",//"root",
        password: "Queen123", //"950824",
        database: "chessstudyschema"
    });
    var username = request.query.userName;
    var password = request.query.passWord;
    if(username && password) {
        var sql = 'select * from player where username="' + username + '" and password="' + password + '";';
        console.log(sql);
        con.connect(function (err) {
            if (err) throw err;
            let result;
            con.query('select * from player where username="' + username + '" and password="' + password + '";', function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    response.redirect(`/homepage?username=${username}`);
                } else { // no user found
                    response.redirect('/?status=false');
                }
                response.end();
            });
        });
    }
});


app.get('/signup', function(request,response){
    let mysql = require('mysql');
    let con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",//"root",
        password: "Queen123", //"950824",
        database: "chessstudyschema"
    });
    let username = request.query.userName;
    let password = request.query.passWord;
    let email = request.query.email;

    con.connect(function (err) {
        if (err) throw err;
        let sql = `SELECT Player_ID FROM player WHERE Username="${username}";`;
        con.query(sql,function (err, result) {
            if (err) {
                con.rollback(function(){
                    throw err;
                });
            }
            if (result.length === 0) { // no user found
                let id = create_UUID();
                sql = `INSERT INTO player VALUES ("${id}","${username}","${password}","${email}");`;
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    response.redirect('/?status=created');
                });
                con.commit();
            } else { // user already existed
                response.redirect('/createuser?status=existed');
            }
        })
    })

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
    });

    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId) {
                games[i].players--;
                if (games[i].players == 0){
                    isRoomFull[i] = false;
                }
            }
        }
        console.log(playerId + ' disconnected');

    });

    socket.on('fork', function (msg) {
        // console.log('fork received');
        io.emit('player_fork', msg)
    });

    socket.on('timeUp', function (msg) {
        io.emit('timeUp', msg);
    });

    socket.on('gameOver', function (msg) {
        io.emit('gameOver', msg);
    });

    socket.on('totalGameOver', function(msg){
        io.emit('totalGameOver', msg)
    });

    socket.on('resign', function(msg){
        socket.broadcast.emit('opponentResign', msg)
    });

    socket.on('offerDraw', function(msg){
        socket.broadcast.emit('opponentOfferDraw',msg)
    });

    socket.on('drawAccepted', function(msg){
        io.emit('drawAccepted', msg);
    });

    function match(playerId, qName){
        // empty queue
        let roomId = getID();
        if (queues.get(qName).length === 0) {
            queues.get(qName).push({playerId, roomId}); // PlayerId is going to be replaced by the player ID extracted from DB
            socket.emit('player', { playerId, players: 1 ,color: 'white', roomId });
            // console.log("first player send " + roomId);
        } else { // already someone in the room
            // the matching algo happens here, need a method that returns a playerId and a RoomId
            let previousRoomId = queues.get(qName).pop().roomId; // pop the player on top
            socket.emit('player', { playerId, players: 2 ,color: 'black', roomId: previousRoomId });
            console.log('sending to room:' + previousRoomId);
        }

        console.log(queues);

    }

    function getID(){
        for (let i = 0; i < isRoomFull.length ; i++) {
            if (!isRoomFull[i]) {
                isRoomFull[i] = true;
                return i;
            }
        }
    }

    function fetchPlayerDetails(player_ID){
        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: "localhost",
            user: "ChessUser",
            password: "Queen123",
            database: "chessstudyschema"
        });

        con.connect(function(err) {
            if (err) throw err;
            var sql = "SELECT * from player WHERE Player_ID="+player_ID+")";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log(result.affectedRows + " record(s) updated");
            });
        });
    }

    /**
     * This function updates the ELO Rating after the game is over for the player.
     * Input: Player ID
     * Output: All 4 types of ELO Ratings
     */
    function updateELORating(player_ID,game_type,new_rating){
        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: "localhost",
            user: "ChessUser",
            password: "Queen123",
            database: "chessstudyschema"
        });

        con.connect(function(err) {
            if (err) throw err;
            var sql = "UPDATE elo_rating SET"+ game_type+"="+new_rating+" WHERE ELO_ID IN (SELECT ELO_ID from player WHERE Player_ID="+player_ID+")";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log(result.affectedRows + " record(s) updated");
            });
        });
    }

});

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

server.listen(port);
console.log('Connected');