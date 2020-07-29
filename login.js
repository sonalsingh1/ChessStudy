let signedIn=false;


var signIn = function(){
    var username= document.getElementById("userID").value;
    var password= document.getElementById("password").value;
    let data = {
      userName : username,
      passWord : password
    };
    location.href = "/login?" + $.param(data);
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