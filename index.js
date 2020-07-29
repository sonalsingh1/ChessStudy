const express = require('express');
const http = require('http');
const socket = require('socket.io');
const queues = new Map();
const fs = require('fs');

const port = process.env.PORT || 8080;
//Call for database;
const mysql = require('mysql');
const con = mysql.createConnection({
    host: "localhost",
    user: "ChessUser",
    password: "Queen123",
    database: "chessstudy"
});

/**
 the following configuration is for Heinz Server, DO NOT CHANGE.

 const port = process.env.PORT || 8081;
 //Call for database;
 const mysql = require('mysql');
 const con = mysql.createConnection({
    host: "127.0.0.1",
    user: "jiechenx",
    password: 'Phah"n0r',
    database: "chessstudy"
});

 */

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
    let qName = req.query.gameType + "_" + req.query.startTime + "_" + req.query.timeIncrement + "_" + req.query.forkAvailable+"_"+ req.query.chessOrChess960+"_"+req.query.rate_type;//+"_"+ req.query.username;
    console.log("qname in app.get /game="+qName);
    if (!queues.has(qName)){
        queues.set(qName,[]);
    }
    res.sendFile(__dirname + '/games.html');
});

app.get('/homepage', (req, res) => {
    res.sendFile(__dirname + '/homepage.html');
});

app.get('/cancel', (req, res) => {
    //Find the index of matched player
    let qName= req.query.qName;
    let playerID= req.query.username;
    let password= req.query.password;
    let index=undefined;
    let queueElementsArray = queues.get(qName);
    console.log("queue on cancel click:"+ queueElementsArray);
    for(let i=0;i<queueElementsArray.length;++i){
        if(playerID===queueElementsArray[i].playerId){
            index=i;
            break;
        }
    }
    console.log("cancel index="+index);
    if(index!=undefined){
        queues.get(qName).splice(index,1);
        console.log("Queue after removal of entry at index="+ index);
        isRoomFull[req.query.roomId]=false;   //Mark the room as not full
    }
    res.redirect(`/homepage?username=${playerID}&password=${password}`);
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
                        let chessOrChess960= request.query.chessOrChess960;
                        let password= request.query.password;
                        response.redirect(`/game?gameType=${gameType}&startTime=${startTime}&timeIncrement=${timeIncrement}&forkAvailable=${forkAvailable}&rate_type=${rate_type}&username=${username}&elo_col=${elo_col}&chessOrChess960=${chessOrChess960}&password=${password}`);
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
function fetchPlayerDetails(username){
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
}
let playerDetails;
app.get('/profile', function(request, response) {
    let username = request.query.username;
    let password = request.query.password;
    let email="";
    // let playerDetails= fetchPlayerDetails(username);
    // console.log(playerDetails);
    var sql1 = 'SELECT email from player WHERE username="'+username+'";';
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log(result);
        email= result[0].email;
        console.log(email);
    });

    if(username) {
            var sql = 'SELECT * from elo_rating WHERE ELO_ID="'+username+'";';
            con.query(sql, function (err, result) {
                if (err) throw err;
                if(result.length>0) {
                    console.log("****PLAYER PROFILE***");
                    let data = {
                        username: username,
                        email:email,
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
                    response.redirect(`/profilePage?username=${username}&password=${password}&email=${email}&Blitz_ChessF0=${data.Blitz_ChessF0}&Bullet_ChessF0=${data.Bullet_ChessF0}&Rapid_ChessF0=${data.Rapid_ChessF0}&Long_ChessF0=${data.Long_ChessF0}&Blitz_Chess960F0=${data.Blitz_Chess960F0}&Bullet_Chess960F0=${data.Bullet_Chess960F0}&Rapid_Chess960F0=${data.Rapid_Chess960F0}&Long_Chess960F0=${data.Long_Chess960F0}&Blitz_ChessF1=${data.Blitz_ChessF1}&Bullet_ChessF1=${data.Bullet_ChessF1}&Rapid_ChessF1=${data.Rapid_ChessF1}&Long_ChessF1=${data.Long_ChessF1}&Blitz_Chess960F1=${data.Blitz_Chess960F1}&Bullet_Chess960F1=${data.Bullet_Chess960F1}&Rapid_Chess960F1=${data.Rapid_Chess960F1}&Long_Chess960F1=${data.Long_Chess960F1}  &Blitz_ChessF2=${data.Blitz_ChessF2}&Bullet_ChessF2=${data.Bullet_ChessF2}&Rapid_ChessF2=${data.Rapid_ChessF2}&Long_ChessF2=${data.Long_ChessF2}&Blitz_Chess960F2=${data.Blitz_Chess960F2}&Bullet_Chess960F2=${data.Bullet_Chess960F2}&Rapid_Chess960F2=${data.Rapid_Chess960F2}&Long_Chess960F2=${data.Long_Chess960F2}`);
                }
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
    let rankData=new Map();
    let sql = 'select ELO_ID from elo_rating order by '+ columnName+' desc limit 0,10;';
        console.log(sql);
        con.query(sql,function (err, result) {
            if (err)  throw err;
            if(result.length>0) {
                console.log("****Top Ranks***");
                console.log(result);

                for(let i=1;i<=result.length;++i){
                    if(result[i]) {
                        rankData.set('rank' + i, result[i].ELO_ID);
                    }
                }
                    // rank1:,
                    // rank2: result[1].ELO_ID,
                    // rank3: result[2].ELO_ID,
                    // rank4: result[3].ELO_ID,
                    // rank5: result[4].ELO_ID,
                    // rank6: result[5].ELO_ID,
                    // rank7: result[6].ELO_ID,
                    // rank8: result[7].ELO_ID,
                    // rank9: result[8].ELO_ID,
                    // rank10: result[9].ELO_ID,
                console.log(rankData);
                response.redirect(`/topRankings?username=${username}&password=${password}&rank1=${rankData.get("rank1")}&rank2=${rankData.get("rank2")}&rank3=${rankData.get("rank3")}&rank4=${rankData.get("rank4")}&rank5=${rankData.get("rank5")}&rank6=${rankData.get("rank6")}&rank7=${rankData.get("rank7")}&rank8=${rankData.get("rank8")}&rank9=${rankData.get("rank9")}&rank10=${rankData.get("rank10")}`);
            }
        })
});

app.get('/download', function (request, response){
    response.sendFile(__dirname + `/cfn/${request.query.file_name}`);
});

// handle user sending challenges
app.get('/challenge', function (request, response){

});

io.on('connection', function (socket) {
    var color;
    var playerId;//var playerId =  Math.floor((Math.random() * 100) + 1); // extracted from DB


    socket.on('joined', function (data) {
        playerId = data.username;
        let qName = data.qName;
        console.log("qName on Joined="+data.qName);
        console.log(playerId + ' Connected');
        match(playerId, qName);

    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
    });

    socket.on('start', function (msg){
       socket.broadcast.emit('start', msg);
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
        console.log(queues)
    });

    socket.on('file_content', function (msg) {
        socket.broadcast.emit('opponent_file_content', msg);
    });

    socket.on('pgn_file', function (msg) {
        let username = msg.username;
        let game_type = msg.game_type;
        let content = msg.file_content;
        let date = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '');
        date = date.replace(/-|:/g,'_');
        let filename = `${username}_${game_type}_${date}.cfn`;
        let filepath = __dirname+`/cfn/`+ filename;
        fs.writeFile(filepath,content,{flag:"wx"}, function (err) {
            if (err) return console.log(err);
            console.log(filename+" created");
            msg = {
                pgn_file_name: filename
            };
            socket.emit('file_created', msg);
        })
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

    socket.on('abort',function (msg){
       io.emit('abort', msg);
    });

    function match(playerId, qName) {
        let roomId = getID();
        let qnameArray = qName.split("_");
        let column_name = qnameArray[0] + "_" + qnameArray[4] + "F" + qnameArray[3];//eg; Bullet_ChessF0
        // let qName= qnameArray[0] + "_" +qnameArray[1] + "_" +qnameArray[2] + "_" +qnameArray[3] + "_" +qnameArray[4];
        let username = playerId;//"johnHeinz1";
        let eloRating=0;
        console.log("qName in match=" + qName);
            let sql = 'SELECT ' + column_name + ' as col from elo_rating WHERE ELO_ID="' + playerId + '";';
            console.log(sql);
              con.query(sql,  function (err, result) {
                if (result.err) throw err;
                console.log(result[0].col);
                 eloRating=  result[0].col;
                  console.log("eloRating="+eloRating);
                  // If queue is empty
                  // If queue is not empty----- find matching player
                  // If no player matches the threshold, then add yourself to the queue
                  // Remove the player from the queue in case the player disconnects

                  if (queues.get(qName).length === 0) {
                      queues.get(qName).push({playerId, roomId, eloRating}); // PlayerId is going to be replaced by the player ID extracted from DB
                      socket.emit('player', {playerId, players: 1, color: 'white', roomId});
                      console.log("first player send " + roomId);

                      for (const [key, value] of queues.entries()) {
                          console.log(queues.get(key));
                      }
                  } else {
                      // already someone in the room
                      // the matching algo happens here, need a method that returns a playerId and a RoomId
                      for (const [key, value] of queues.entries()) {
                          console.log(queues.get(key));
                      }
                      let queueMembersMap = new Map();
                      let queueElementsArray = queues.get(qName);

                      //Store all the queue members whose difference is less than threshold in a map
                      for(let i=0;i<queueElementsArray.length;++i){
                          let diff = Math.abs(queueElementsArray[i].eloRating - eloRating);
                          if (diff < 100) {
                              console.log("player ID is="+queueElementsArray[i].playerId);
                              queueMembersMap.set(queueElementsArray[i].playerId, diff);
                          }
                      }

                      if (queueMembersMap.size > 0) {
                          let minDiff = Number.MAX_SAFE_INTEGER;
                          let matchedPlayerID;
                          for (const [key, value] of queueMembersMap.entries()) {
                              console.log("key="+key);
                              console.log("value="+value);
                              console.log("minDiff="+minDiff);
                              if (value < minDiff) {
                                  minDiff = value;
                                  matchedPlayerID = key;
                              }
                          }
                          //Find the index of matched player
                          let index=undefined;
                          for(let i=0;i<queueElementsArray.length;++i){
                              if(matchedPlayerID===queueElementsArray[i].playerId){
                                  index=i;
                              }
                          }
                          console.log("matched player ID="+matchedPlayerID);
                          console.log("Index="+index);
                          let previousRoomId=queues.get(qName)[index].roomId;
                          queues.get(qName).splice(index,1);
                          console.log("Queue after removal of entry at index="+ index);
                          for (const [key, value] of queues.entries()) {
                              console.log(queues.get(key));
                          }
                          // let previousRoomId = queues.get(qName).pop().roomId; // pop the player on top
                          socket.emit('player', {playerId, players: 2, color: 'black', roomId: previousRoomId});
                          console.log('sending to room:' + previousRoomId);
                      } else {
                          //Add current player to the queue
                          queues.get(qName).push({playerId, roomId, eloRating}); // PlayerId is going to be replaced by the player ID extracted from DB
                          console.log("Queue after queueMemberMap is empty");
                          for (const [key, value] of queues.entries()) {
                              console.log(queues.get(key));
                          }
                          socket.emit('player', {playerId, players: 1, color: 'white', roomId});
                      }

                  }
            });
        // });
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