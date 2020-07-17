const express = require('express');
const http = require('http');
const socket = require('socket.io');
const queues = new Map();

const port = process.env.PORT || 8080;

const mysql = require('mysql');
const con = mysql.createConnection({
    host: "localhost",
    user: "ChessUser",
    password: "Queen123",
    database: "chessstudy"
});

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

app.get('/profilePage',(req,res) => {
    res.sendFile(__dirname + '/profile.html');
});

app.get('/login', function(request, response) {
    var username = request.query.userName;
    var password = request.query.passWord;
    if(username && password) {
        var sql = 'select * from player where username="' + username + '" and password="' + password + '";';
        console.log(sql);
        con.query('select * from player where username="' + username + '" and password="' + password + '";', function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
                response.redirect(`/homepage?username=${username}&password=${password}`);
            } else { // no user found
                response.redirect('/?status=false');
            }
            response.end();
        });
    }
});


app.get('/signup', function(request,response){
    let username = request.query.userName;
    let password = request.query.passWord;
    let email = request.query.email;
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
                if (err) con.rollback();
            });

            // create the ELO_rating column for the user
            sql = `INSERT INTO elo_rating (ELO_ID) VALUES ("${username}");`;
            con.query(sql, function(err, result){
                if (err) con.rollback();
                response.redirect('/?status=created');
            });

            con.commit();
        } else { // user already existed
            response.redirect('/createuser?status=existed');
        }
    })

});

app.get('/verify',function (request, response) {
    var mysql = require('mysql');
    let username = request.query.username;
    let password = request.query.password;
    if(username && password) {
        let sql = `SELECT Username FROM player WHERE username="${username}" AND password="${password}";`;

            con.query(sql, function (err, result) {
                try {
                    if (err) throw err;
                    if (result.length > 0){ // user verified
                        let gameType = request.query.gameType;
                        let startTime = request.query.startTime;
                        let timeIncrement = request.query.timeIncrement;
                        let forkAvailable = request.query.forkAvailable;
                        let rate_type = request.query.rate_type;
                        let elo_col = request.query.elo_col;
                        response.redirect(`/game?gameType=${gameType}&startTime=${startTime}&timeIncrement=${timeIncrement}&forkAvailable=${forkAvailable}&rate_typ=${rate_type}&username=${username}&elo_col=${elo_col}`);
                    }
                } catch (e) {
                    console.log(e);
                    response.redirect('/');
                }
            })

    } else { // redirect user to login page
        response.redirect('/');
    }
});

var playerDetails;
app.get('/profile', function(request, response) {
    var mysql = require('mysql');
    let username = request.query.username;
    let password = request.query.password;
    let playerDetails= fetchPlayerDetails(username);
     // let email= playerDetails.email;
    console.log(playerDetails);
    // console.log(email);
    var con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",//"root",
        password: "Queen123", //"950824",
        database: "chessstudy"
    });
    if(username) {
        con.connect(function(err) {
            if (err) throw err;
            var sql = 'SELECT * from elo_rating WHERE ELO_ID="'+username+'";';
            con.query(sql, function (err, result) {
                if (err) throw err;
                if(result.length>0) {
                    console.log("****PLAYER PROFILE***");
                    let data = {
                        username: username,
                        Blitz_ChessF0: result[0].Blitz_ChessF0,
                        Bullet_ChessF0:result[0].Bullet_ChessF0,
                        Rapid_ChessF0:result[0].Rapid_ChessF0,
                        Long_ChessF0:result[0].Long_ChessF0,
                        Blitz_Chess960F0: result[0].Blitz_Chess960F0,
                        Bullet_Chess960F0: result[0].Bullet_Chess960F0,
                        Rapid_Chess960F0: result[0].Rapid_Chess960F0,
                        Long_Chess960F0: result[0].Long_Chess960F0,
                        Blitz_ChessF1: result[0].Blitz_ChessF1,
                        Bullet_ChessF1:result[0].Bullet_ChessF1,
                        Rapid_ChessF1:result[0].Rapid_ChessF1,
                        Long_ChessF1:result[0].Long_ChessF1,
                        Blitz_Chess960F1: result[0].Blitz_Chess960F1,
                        Bullet_Chess960F1: result[0].Bullet_Chess960F1,
                        Rapid_Chess960F1: result[0].Rapid_Chess960F1,
                        Long_Chess960F1: result[0].Long_Chess960F1,
                        Blitz_ChessF2: result[0].Blitz_ChessF2,
                        Bullet_ChessF2:result[0].Bullet_ChessF2,
                        Rapid_ChessF2:result[0].Rapid_ChessF2,
                        Long_ChessF2:result[0].Long_ChessF2,
                        Blitz_Chess960F2: result[0].Blitz_Chess960F2,
                        Bullet_Chess960F2: result[0].Bullet_Chess960F2,
                        Rapid_Chess960F2: result[0].Rapid_Chess960F2,
                        Long_Chess960F2: result[0].Long_Chess960F2,
                    };
                    // console.log(data);
                    //&password=${password}
                    response.redirect(`/profilePage?username=${username}&password=${password}&Blitz_ChessF0=${data.Blitz_ChessF0}&Bullet_ChessF0=${data.Bullet_ChessF0}&Rapid_ChessF0=${data.Rapid_ChessF0}&Long_ChessF0=${data.Long_ChessF0}&Blitz_Chess960F0=${data.Blitz_Chess960F0}&Bullet_Chess960F0=${data.Bullet_Chess960F0}&Rapid_Chess960F0=${data.Rapid_Chess960F0}&Long_Chess960F0=${data.Long_Chess960F0}&Blitz_ChessF1=${data.Blitz_ChessF1}&Bullet_ChessF1=${data.Bullet_ChessF1}&Rapid_ChessF1=${data.Rapid_ChessF1}&Long_ChessF1=${data.Long_ChessF1}&Blitz_Chess960F1=${data.Blitz_Chess960F1}&Bullet_Chess960F1=${data.Bullet_Chess960F1}&Rapid_Chess960F1=${data.Rapid_Chess960F1}&Long_Chess960F1=${data.Long_Chess960F1}  &Blitz_ChessF2=${data.Blitz_ChessF2}&Bullet_ChessF2=${data.Bullet_ChessF2}&Rapid_ChessF2=${data.Rapid_ChessF2}&Long_ChessF2=${data.Long_ChessF2}&Blitz_Chess960F2=${data.Blitz_Chess960F2}&Bullet_Chess960F2=${data.Bullet_Chess960F2}&Rapid_Chess960F2=${data.Rapid_Chess960F2}&Long_Chess960F2=${data.Long_Chess960F2}`);
                    // response.redirect(`/profilePage?data=${data}`);
                    // response.sendFile(__dirname + '/profile.html');
                    // localStorage.setItem("result", result);
                }
            });
        });
    }
});
app.get('/challenges', function(request, response){
    // response.sendFile(__dirname + '/challenges.html');
});

app.get('/topRankings', function(request, response){
    response.sendFile(__dirname + '/top_ranking.html');
});

app.get('/topRank', (request, response) => {
    let username = request.query.username;
    let password = request.query.password;
    let columnName=request.query.columnName;

    //Similar Code for Chess960
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",
        password: "Queen123",
        database: "chessstudy"
    });
    con.connect(function (err) {
        if (err) throw err;
        let sql = 'select ELO_ID from elo_rating order by '+ columnName+' desc limit 0,10;';
        console.log(sql);
        con.query(sql,function (err, result) {
            if (err)  throw err;
            if(result.length>0) {
                console.log("****Top Ranks***");
                //todo: How to avoid hardcoding for each type of game?
                console.log(result);
                let rankData= {
                    rank1: result[0].ELO_ID,
                    rank2: result[1].ELO_ID,
                    rank3: result[2].ELO_ID,
                    rank4: result[3].ELO_ID,
                    rank5: result[4].ELO_ID,
                    // rank6: result[5].Bullet_ChessF0,
                    // rank7: result[6].Bullet_ChessF0,
                    // rank8: result[7].Bullet_ChessF0,
                    // rank9: result[8].Bullet_ChessF0,
                    // rank10: result[9].Bullet_ChessF0
                };
                console.log(rankData);
                response.redirect(`/topRankings?username=${username}&password=${password}&rank1=${rankData.rank1}&rank2=${rankData.rank2}&rank3=${rankData.rank3}&rank4=${rankData.rank4}&rank5=${rankData.rank5}&rank6=${rankData.rank6}&rank7=${rankData.rank7}&rank8=${rankData.rank8}&rank9=${rankData.rank9}&rank10=${rankData.rank10}`);
            }
        })
    })


});

io.on('connection', function (socket) {
    var color;
    var playerId;


    socket.on('joined', function (data) {
        playerId = data.username;
        let qName = data.qName;
        console.log(playerId + ' Connected');
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
        socket.broadcast.emit('timeUp', msg);
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

    socket.on('score', function(msg){
        let elo;
        let sql = `SELECT ${msg.elo_col} AS result FROM elo_rating WHERE ELO_ID = "${msg.username}";`;
        con.query(sql,function(err, result){
            try{
                if(err) throw err;
                elo = result[0].result;
                msg = {
                    username: msg.username,
                    roomId: msg.roomId,
                    score: msg.score,
                    old_elo: elo
                };
                socket.broadcast.emit('opponentScore', msg);
            }catch (e) {
                console.log(e);
            }
        });

    });

    socket.on('calcELO', function (msg) {
        let elo_col = msg.elo_col;
        let username = msg.username;
        let self_score = msg.self_score;
        let opponent_score = msg.opponent_score;
        let opponent_name = msg.opponent_name;
        let type = msg.type;
        let r2 = msg.opponent_elo;

        let r1; // r1 is the self-elo, r2 is the opponent elo
        // retrieve elo stored
        let sql = `SELECT ${elo_col} AS result FROM elo_rating WHERE ELO_ID = "${username}";`;
        con.query(sql, function (err, result) {
            try {
                if (err) throw err;
                r1 = result[0].result;
                // calculate new elo
                if(r1 && r2) {
                    let R1 = Math.pow(10, r1 / 400);
                    let R2 = Math.pow(10, r2 / 400);
                    let E1 = R1 / (R1 + R2);
                    let E2 = R2 / (R1 + R2);
                    let flag;
                    if (self_score > opponent_score) flag = 1;
                    else if(self_score < opponent_score) flag = 0;
                    else flag = 0.5;
                    let new_elo = Math.round(r1 + 24*(flag - E1));
                    sql = `UPDATE elo_rating SET ${elo_col}=${new_elo} WHERE ELO_ID="${username}";`;
                    con.query(sql,function (err,result) {
                        try{
                            if(err) throw err;
                            console.log(result.affectedRows + " record(s) updated");
                            con.commit();
                            msg = {
                                roomId: msg.roomId,
                                old_elo: r1,
                                new_elo: new_elo,
                                type: type
                            };
                            socket.emit('new_elo',msg)
                        } catch (e) {
                            con.rollback();
                            console.log(e);
                        }
                    })
                }
            } catch (e){
                console.log(e);
            }
        });
    });

    socket.on('independent_score', function (msg) {
        let sql = `SELECT ${msg.elo_col} AS result FROM elo_rating WHERE ELO_ID = "${msg.username}";`;
        let elo;
        con.query(sql,function (err, result) {
            try{
                if (err) throw err;
                elo = result[0].result;
                msg = {
                    username: msg.username,
                    roomId: msg.roomId,
                    score: msg.score,
                    old_elo: elo
                };
                io.emit('opponent_independent_score', msg);
            } catch (e) {
                console.log(e)
            }
        });
    });

    socket.on('calc_independent_elo', function (msg) {
        let score = msg.score;
        let username=msg.username;
        let r1 = msg.self_elo;
        let r2 = msg.opponent_elo;
        let old_elo = r1;
        for (let i = 0; i <score.length ; i++) {
            let flag = score[i];
            let R1 = Math.pow(10, r1 / 400);
            let R2 = Math.pow(10, r2 / 400);
            let E1 = R1 / (R1 + R2);
            let E2 = R2 / (R1 + R2);
            r1 = Math.round(r1 + 24*(flag - E1));
        }
        let new_elo = r1;
        let sql = `UPDATE elo_rating SET ${msg.elo_col}=${new_elo} WHERE ELO_ID="${username}";`;

        con.query(sql,function(err,result){
            try{
                if(err) throw err;
                console.log(result.affectedRows + " record(s) updated");
                con.commit();
                msg = {
                    roomId: msg.roomId,
                    old_elo: old_elo,
                    new_elo: new_elo,
                };
                socket.emit('new_elo',msg);
            } catch (e) {
                console.log(e);
                con.rollback();
            }
        })
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
});

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
        database: "chessstudy"
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

function fetchPlayerDetails(username){
    var mysql = require('mysql');
    var con = mysql.createConnection({
        host: "localhost",
        user: "ChessUser",
        password: "Queen123",
        database: "chessstudy"
    });

    con.connect(function(err) {
        if (err) throw err;
        var sql = 'SELECT * from player WHERE username="'+username+'";';
        con.query(sql, function (err, result) {
            if (err) throw err;
            playerDetails={
                playerID:result[0].Player_ID,
                username: result[0].Username,
                password: result[0].Password,
                email:result[0].Email
            };
            console.log(playerDetails);
            return playerDetails;
        });
    });


}
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