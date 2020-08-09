function signUp(){
    let userName = document.querySelector('#userID').value;
    let email = document.querySelector('#email').value;
    let password = document.querySelector('#password').value;
    if (!userName || !email || !password){
        $('#msg').text('Username / Email / Password cannot be empty, please try again!');
        $('#msg').css('color','red');
    } else {
        let data = {
            userName: userName,
            email: email,
            passWord: password
        };
        location.href = '/signup?' + $.param(data);
    }
}

let loc = location.href.split('?');
if (loc.length > 1){
    let status = loc[1].split('=')[1];
    if(status === 'existed'){
        $('#msg').text('Username Already Exists, Please Try Another.');
        $('#msg').css('color','red');
    }
}