setInterval(function () {
  favicon.badge(messagesSinceFocus);
  if (messagesSinceFocus > 0) {
    document.title = 'Quik (Unread)';
  } else {
    document.title = 'Quik';
  }
}, 1000);
function quikClientStart() {
  /* Apply brand themeing */
  var xmlhttp, text;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', '/branding/theme', true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      text = xmlhttp.responseText;
      document.getElementById('loader-wrapper').style.display = 'none';
      var brandingColorClass = text.split(',')[0].split(':')[1];
      document.body.innerHTML = document.body.innerHTML.replace(new RegExp('branding_theme_class', 'g'), brandingColorClass);
      console.log('Branding color class: ' + brandingColorClass);
      var brandingColorHex = text.split(',')[1].split(':')[1];
      document.body.innerHTML = document.body.innerHTML.replace(new RegExp('branding_theme_hex', 'g'), brandingColorHex);
      console.log('Branding color hex: ' + brandingColorHex);
      var brandingAccentClass = text.split(',')[3].split(':')[1];
      document.body.innerHTML = document.body.innerHTML.replace(new RegExp('branding_accent_class', 'g'), brandingAccentClass);
      console.log('Branding accent class: ' + brandingAccentClass);
      var brandingAccentHex = text.split(',')[4].split(':')[1];
      document.body.innerHTML = document.body.innerHTML.replace(new RegExp('branding_accent_hex', 'g'), brandingAccentHex);
      console.log('Branding accent hex: ' + brandingAccentHex);
      var brandingTitle = text.split(',')[2].split(':')[1];
      document.title = brandingTitle;
      promptForUsername();
      /* End of brand themeing */
      usrdat = text.split('/#');
      userlist = document.getElementById('dropdown3');
      for (var i = 1; i < usrdat.length; i++) {
        userlist.innerHTML = userlist.innerHTML + '<li><a href=\'\'>' + usrdat[i].split(',')[1] + '</a></li>';
      }
      //define notification audio
      var audio = new Audio('notify.mp3');
      var isFocused = true;
      //Default to true so the noise isn't played if there is an error
      var messagesSinceFocus = 0;
      $('form').submit(function () {
        if ($('#m').val() === '') {
          swal({
            title: 'Error sending message!',
            text: 'Please ensure you have entered text',
            timer: 2000
          });
        } else {
          socket.emit('chat message', $('#m').val());
          $('#m').val('');
          var elem = document.getElementById('messages');
          elem.scrollTop = elem.scrollHeight;
        }
        return false;
      });
      var socket = io();
      socket.on('username rejected', function () {
        console.log('username rejected, reprompting');
        promptForUsername(true);
      });
      socket.on('chat message', function (usr, msg) {
        var elem = document.getElementById('messages');
        elem.scrollTop = elem.scrollHeight;
        $(window).focus(function () {
          isFocused = true;
          messagesSinceFocus = 0;
        }).blur(function () {
          isFocused = false;
        });
        if (!isFocused) {
          messagesSinceFocus++;
          //Alert user if they are not focused on the tab
          audio.play();
        }
        msg = twemoji.parse(msg);
        $('#messages').append($('<li class="msg_name">').text(usr + ' '));
        //$('#messages').append($('<li class="msg_text">').text(msg.split("--DELIM--")[1]));
        $('#messages').append(msg);
        $('#messages').append($('<p/>'));
      });
      socket.on('disconnectEvent', function (usr, msg) {
        document.getElementById('usrs_connected').text = 'User list (' + msg + ')';
        document.getElementById('usrs_connectedMobi').text = 'Users connected: ' + msg;
        document.getElementById('dropdown3').removeChild(document.getElementById(usr));
        $('#messages').append($('<li class="msg_name">').text('Notice '));
        $('#messages').append(usr + ' has disconnected');
        $('#messages').append($('<p/>'));
      });
      socket.on('connectEvent', function (usr, msg) {
        document.getElementById('usrs_connected').text = 'User list (' + msg + ')';
        document.getElementById('usrs_connectedMobi').text = 'Users connected: ' + msg;
        userlist.innerHTML = userlist.innerHTML + '<li id=' + usr + '><a href=\'\'>' + usr + '</a></li>';
        $('#messages').append($('<li class="msg_name">').text('Notice '));
        $('#messages').append(usr + ' has connected');
        $('#messages').append($('<p/>'));
      });
      $('.dropdown-button').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrain_width: true,
        hover: false,
        gutter: 0,
        belowOrigin: false
      });
    }
  };
}
function promptForUsername(showError) {
  if (showError) {
    promptText = 'Username taken, please choose another';
  } else {
    promptText = 'Enter  your desired username:';
  }
  //Prompt user for name
  swal({
    title: 'Welcome to Quik',
    text: promptText,
    type: 'input',
    showCancelButton: false,
    closeOnConfirm: false,
    confirmButtonColor: ' #ff5050 ',
    confirmButtonText: 'Continue',
    allowEscapeKey: false,
    inputPlaceholder: 'username'
  }, function (inputValue) {
    if (inputValue === false)
      window.close();
    if (inputValue.length < 1) {
      swal.showInputError('You need to write something!');
    } else if (inputValue.length > 10) {
      swal.showInputError('Name can\'t be longer than 10 characters!');
    } else if (twemoji.parse(inputValue) != inputValue) {
      swal.showInputError('You can\'t have emojis in your username! ' + '<img class="emoji" draggable="false" alt="\uD83D\uDE2A" src="http://twemoji.maxcdn.com/16x16/1f62a.png">');
    } else {
      swal('Welcome ' + inputValue + '!', 'We hope you enjoy Quik!', 'success');
      usr_name = inputValue;
      socket.emit('set username', inputValue);
    }
  });
}