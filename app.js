const express = require('express');
const app = express();
app.set('port',(process.env.PORT || 3000));
const http = require('http');
var fs = require('fs');
const { v4: uuidv4 } = require('uuid');
//about socket io
const server = http.createServer(app);
const { Server } = require("socket.io");
var io = new Server(server);
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
// database
var mysql = require("mysql");

// SQlite
const sqlite3 = require('sqlite3').verbose();
let sql;

//connect to DB
const db = new sqlite3.Database('data.sqlite',sqlite3.OPEN_READWRITE,(err)=>{
  if (err) return console.error(err.message);
  console.log("connected to sqlite database");
});

function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
};


// Peer js
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  port: 9000,
  path: '/peerjs',
  ssl: {
    key: fs.readFileSync('./certificates/key.pem', 'utf8'),
    cert: fs.readFileSync('./certificates/cert.pem', 'utf8')
  }
  ,
  debug: true
});
//

 


// session for login
var session = require('express-session');
const { render } = require('ejs');
//const { start } = require('discordie/lib/core/DiscordieProfiler');

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/libraries', express.static(__dirname + 'public/libraries'))
app.use('/scss', express.static(__dirname + 'public/scss'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use(express.static('media'))
app.use('/profilephotos', express.static(__dirname + 'media/profilephotos'))
// views and view engine
app.set('views', './views')
app.set('view engine', 'ejs')
//using peer server
app.use('/peerjs', peerServer);
//  Database Connection

var baglanti;
function handleDisconnect() {
  baglanti = mysql.createConnection({
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'b0668337f42ac2',
    password: 'f7b8a5b1',
    database: 'heroku_8736a1c86ded3a6',
  }); // Recreate the connection, since
                                                  // the old one cannot be reused.

  baglanti.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  baglanti.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}
handleDisconnect();


let pool = mysql.createPool({
  host: 'eu-cdbr-west-01.cleardb.com',
  user: 'b0668337f42ac2',
  password: 'f7b8a5b1',
  database: 'heroku_8736a1c86ded3a6',
});





// Defining session and usage of login
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// login get and post
app.get('/login', (req, res) => {
  res.render('login', {
    message: '',
  });
})
try {
  app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log("we are here"); 


   if (username && password) {
    // commented code of mysql login check
    sql = "SELECT * FROM user WHERE username ='"+username +"'AND password = SHA1('"+password +"')";
    console.log(sql);
      console.log(baglanti.query(sql, [], function (error, results, fields) {
        console.log(sql);
        if (results.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('/home');
        } else {
          res.render('login', {
            message: 'Your username or password is incorrect.'
          });
        }
      }).sql);
    }
  })
} catch (error) {
    console.log (error);
  }
  
  
//    password = sha1(password);
   
//    sql = "SELECT * FROM user WHERE username ='"+username + "' AND password ='"+password+"'";
//    console.log(sql);
//    db.get(sql,[], (err,row) => {
//     console.log(sql);
// if(err) return console.error(err.message);
// console.log("founded users");
// console.log(row);
// if (row != null) {
  
//         req.session.loggedin = true;
//         req.session.username = username;
//         res.redirect('/home');
//       } else {
//         res.render('login', {
//           message: 'Your username or password is incorrect.'
//         });
//       }
//     })
      
//     } else {
//       res.render('login', {
//         message: 'Please fill all of the blanks'
//       });
//     }
//   });
// } catch (error) {
//   console.log (error);
// }

//register get and post

app.get('/register', (req, res) => {
  res.render('register', {
    message: '',
  });
});

app.post('/register', function (req, res) {
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password_retype = req.body.password_retype;
  if (username && password && email && password_retype) {
    if (password == password_retype) {
      //looking for username matching
      
      baglanti.query('SELECT * FROM user WHERE username = ?', [username], function (error, results, fields) {
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          res.render('register', {
            message: 'Username is already taken.'
          });
        } else {
          //looking for email matching
          baglanti.query('SELECT * FROM user WHERE email = ?', [email], function (error, results1, fields) {
            if (results1.length > 0) {
              res.render('register', {
                message: 'Email is already taken.'
              });
            } else {
              // actual register

              console.log("register oldunuz");
              // database ekleme
              baglanti.query('INSERT INTO user(username,email,password) VALUES (?,?,SHA1(?));', [username, email, password], function (error, results, fields) {
                if (error) {
                  console.log(error);
                }
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/home');
              });
            }
          });
        }
      });

    } else {
      res.render('register', {
        message: 'Passwords should match.'
      });
    }

  } else {
    res.render('register', {
      message: 'You have to fill all of the blanks.'
    });
  }
});


// home and home login redirect
app.get('/', function (req, res) {
  if (req.session.loggedin) {
    res.redirect('/home')
  } else {
    res.redirect('/login');
  }
  res.end();
});
app.get('/home', function (req, res) {
  if (req.session.loggedin) {
    res.render('index',
      {
        username: req.session.username
      });
  } else {
    res.redirect('/login');
  }
  res.end();
});
// editprofile get and post
app.get('/editprofile', (req, res) => {
  if (req.session.loggedin) {
    var username = req.session.username;
    baglanti.query('SELECT * FROM user WHERE username = ?', [username], function (error, results, fields) {
      var photoa = "profilephotos/" + results[0].photo;
      console.log(results[0]);
      //convert int to string
      res.render('user-profile-edit',
        {
          username: results[0].username,
          email: results[0].email,
          gender: results[0].gender,
          upvotecount: results[0].upvoteCount,
          photo: photoa,
          message: '',
          message1: '',
          message2: ''
        }
      );
    })

  } else {
    res.redirect('/login');
  }


})
app.post('/editprofile', function (req, res) {
  var username = req.session.username;
  var email = "";
  var message = "";
  var message1 = "";
  var message2 = "";
  baglanti.query('SELECT * FROM user WHERE username = ?', [username], function (error, results, fields) {
    username = req.session.username;
    email = results[0].email;
    var newusername = req.body.newusername;
    var newemail = req.body.newemail;
    var newgender = req.body.newgender;
    oldemail = results[0].email;
    message = "";
    message1 = "";
    message2 = "";
    if (newusername != username) {
      //
      if (newusername) {
        //check new username is taken or not
        baglanti.query('SELECT * FROM user WHERE username = ?', [newusername], function (error, results, fields) {

          if (results.length > 0) {

            message = 'Username is already taken.';

          }
          else {
            baglanti.query('UPDATE user SET username = ? WHERE username = ? ', [newusername, username]);
            message = 'Username is changed';
            req.session.username = newusername;
            username = newusername;
          }

        });


      } else {
        message = "Username should not be blank";
      }

    }

    if (newemail != oldemail) {
      //change email
      if (newemail) {

        //check new username is taken or not
        baglanti.query('SELECT * FROM user WHERE email = ?', [newemail], function (error, results, fields) {
          if (error) {
            console.log(error);
          }
          if (results.length > 0) {

            message1 = " Email is already taken.";

          }
          else {


            console.log(newemail);
            console.log(oldemail);
            baglanti.query('UPDATE user SET email = ? WHERE email = ? ', [newemail, oldemail]);
            email = newemail;
            message1 = " Email is changed.";
          }

        });

      }
      else {
        message1 = "Email should not be blank."
      }
    }
    if (newgender != results[0].gender) {
      if (newgender) {
        newgenderlower = newgender.toLowerCase();
        if (newgenderlower == "male" || newgenderlower == "female" || newgenderlower == "other") {
          baglanti.query('UPDATE user SET gender = ? WHERE username = ? ', [newgenderlower, results[0].username]);
          message2 = "Gender is changed to " + newgenderlower;
        } else {
          // only male, female or other
          message2 = "Gender should be only male, female or other.";
        }

      } else {
        message2 = "Gender should not be blank";
        // gender was blank
      }
      //change gender
    }

    baglanti.query('SELECT * FROM user WHERE username = ?', [username], function (error, results, fields) {
      var photoa = "profilephotos/" + results[0].photo;
      console.log(results[0]);
      //convert int to string
      res.render('user-profile-edit',
        {
          username: username,
          email: email,
          gender: results[0].gender,
          upvotecount: results[0].upvoteCount,
          photo: photoa,
          message: message,
          message1: message1,
          message2: message2
        }
      );
    });
  });
});
// create room
app.post('/createroom', function (req, res) {
  var roomname = req.body.roomname;
  var description = req.body.description;
  var category = req.body.category;
  var roomid = uuidv4();
  baglanti.query('INSERT INTO room(roomName,description,categoryName,roomid) VALUES (?,?,?,?);', [roomname, description, category,roomid], function (error, results, fields) {
    if(error){
      console.log(error);
    }
    res.redirect(`room/${roomid}`);


  });
})
app.post('/joinroom', function (req, res) {
  var roomid = req.body.roomid;
 
  


  res.redirect(`room/${roomid}`);

  

  
})

//changepassword page get and post

app.get('/changepassword', (req, res) => {
  if (req.session.loggedin) {
    res.render('change-password',
      {
        message: '',
        username: req.session.username
      }
    )
  } else {
    res.redirect('/login');
  }
})
app.post('/changepassword', function (req, res) {
  var username = req.session.username;
  var oldpassword = req.body.oldpassword;
  var newpassword = req.body.newpassword;
  var newpasswordretype = req.body.newpasswordretype;
  console.log(oldpassword + " " + newpassword + " " + newpasswordretype + " " + username)
  if (oldpassword && newpassword && newpasswordretype) {
    if (newpassword == newpasswordretype) {
      baglanti.query('SELECT password FROM user WHERE username = ? AND password = SHA1(?)', [username, oldpassword], function (error, results, fields) {
        console.log("1");
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          baglanti.query('UPDATE user SET password = SHA1(?) WHERE username = ? AND password = SHA1(?)', [newpassword, username, oldpassword], function (error, results, fields) {
            console.log("2");
            if (error) {
              console.log(error);
            }
            res.render('change-password', {
              message: 'Your password is changed successfully',
              username: req.session.username
            });
          }
          );
        } else {
          res.render('change-password', {
            message: 'You should type old password correctly.',
            username: req.session.username
          });
       
        }

      });
    }
    else {
      res.render('change-password', {
        message: 'Passwords should match',
        username: req.session.username
      });
    }

  } else {
    res.render('change-password', {
      message: 'Please fill all of the blanks',
      username: req.session.username
    });
  }
});

//room
app.get('/room/:id', (req, res) => {
  var roomid = req.params.id;
  var userName = req.session.username
  res.render('room', {
    roomId: roomid,
    userName: userName
  });
});

try{
  io.on('connection', (socket) => {
    socket.on('server', (msg, roomId, userName) => {
      text = 'chat message' + roomId;
      io.emit(text, msg, userName);
    });
    socket.on('join-room', (roomId, userId) => {
      var room = 'user-connected' + roomId;
      console.log("user connected");
      socket.broadcast.emit(room, userId);
      var closeroom = 'user-disconnected' + roomId;
      socket.on('disconnect', () => {
        io.emit(closeroom, userId)
      })
      socket.on('connect_failed', function() {
        document.write("Sorry, there seems to be an issue with the connection!");
     })
    })
    socket.on('error', function() {
      
      socket = io.connect(host, {
        'force new connection': true
      });
  });
  });
  pool.on('connection', function (baglanti) {
    if (baglanti) {
        logger.info('Connected the database via threadId %d!!', baglanti.threadId);
        baglanti.query('SET SESSION auto_increment_increment=1');
    }
});
}catch(err){
  console.log("There is an error during creating socket io connection.")
}

app.get('/category', (req, res) => {


  if (req.session.loggedin) {
    var category = getParameterByName('category', req.url);
    //selecting all rooms which are in this category
    baglanti.query('SELECT * FROM room WHERE categoryName = ?', [category], function (error, results, fields) {
      var roomName = [];
      var description = [];
      var categoryName = [];
      var roomid = [];


      if (results.length > 0) {
        var i = 0;
        var photo = "";
        for (i = 0; i < results.length; i++) {
          roomName.push(results[i].roomName);
          description.push(results[i].description);
          categoryName.push(results[i].categoryName);
          roomid.push(results[i].roomid);
          photo = results[0].categoryName;
          photo = photo.replace(/\s/g,'');
        }
        var roomcount = results.length;
     
        res.render('category',
          {
            roomName: roomName,
            description: description,
            roomId: roomid,
            categoryName: categoryName,
            username: req.session.username,
            photo: photo,
            roomcount: roomcount
          })
      } else {
        res.redirect('/home');
      }
    });
  } else {
    res.redirect('/login');
  }
})

//logout

app.get('/logout', (req, res) => {
  req.session.loggedin = false;
  req.session.username = null;
  res.redirect('/login');
    
})



//supporting functions


function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



server.listen(process.env.PORT||3000);