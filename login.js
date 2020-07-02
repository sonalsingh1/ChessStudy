
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
    let data = {
      userName : username,
      passWord : password
    };
    location.href = "/login?" + $.param(data);

};

var signUp = function(){
    var username= document.getElementById("userID").value;
    var password= document.getElementById("password").value;
};

let loc = location.href.split('?');
if (loc.length > 1){
    let suc = loc[1].split('=')[1];
    if(suc === 'false'){
        $('#msg').text('Invalid Username and/or Password!');
        $('#msg').css('color','red');
    }
}