

let signedIn=false;


//TODO: Calls server to check if username and password is correct
function isUserPresent(username,password) {
    socket.emit('checkUserSignIn', username,password);
    return false;
}


//TODO: give call to database and fetch User information
var signIn = function(){
    var username= document.getElementById("userID").value;
    var password= document.getElementById("password").value;
    // if (isUserPresent(username, password)) {
    //     signedIn = true;
    // } else {
    //     signedIn = false;
    //     console.log("No such user! Incorrect Username!")
    // }
    let data = {
      userName : username,
      passWord : password
    };
    // console.log("Here");
    location.href = "/login?" + $.param(data);
    // console.log("After");

};

var signUp = function(){
    var username= document.getElementById("userID").value;
    var password= document.getElementById("password").value;


};