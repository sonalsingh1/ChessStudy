

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
    // console.log("Here");
    location.href = "/login?" + $.param(data);
    // console.log("After");

};


let loc = location.href.split('?');
if (loc.length > 1){
    let status = loc[1].split('=')[1];
    if(status === 'false'){
        $('#msg').text('Invalid Username and/or Password!');
        $('#msg').css('color','red');
    } else if (status === 'created'){
        $('#msg').text('User successfully created! Please Log In.');
        $('#msg').css('color','red');
    }
}