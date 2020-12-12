// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express module
var express = require("express");

const DB = require("./DatabaseService.js")
const MediaRender = require("./MediaRender.js")
let MyDB


// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());



const parseString = require('xml2js').parseString


var HOST
var USER
var PASSWORD_TXT
var DATABASE
var PORT

let data = fs.readFileSync("dbconfig.xml")
data = data.toLocaleString()

let parse = parseString(data, (err, res) => {
  if (err) console.log(err)
  HOST = res.dbconfig.host[0]
  USER = res.dbconfig.user[0]
  PASSWORD_TXT = res.dbconfig.password[0]
  DATABASE = res.dbconfig.database[0]
  PORT = res.dbconfig.port[0]
})

DB.connect(DATABASE).then((database) => {
  MyDB = database
}).catch((err) => {
  console.log("Could not connect to Database: ", err)
})
// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// server listens on port 9007 for incoming connections
app.listen(9007, () => console.log('Listening on port 9007!'));

app.get('/', function (req, res) {
  MediaRender.get("welcome.html").then(data => {
    res.status(data.code).write(data.data)
    res.end()
  }).catch(err => {
    res.status(404).write("File not found")
    res.end()
  })
});

// // GET method route for the events page.
// It serves events.html present in client folder
app.get('/events', function (req, res) {
  //Add Details
  if (!req.session.value) {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + "/client/events.html")
  }
});

// GET method route for the addEvent page.
// It serves addEvent.html present in client folder
app.get('/addEvent', function (req, res) {
  //Add Details
  if (req.session.value) {
    res.sendFile(__dirname + '/client/' + 'addEvent.html');
  } else {
    res.sendFile(__dirname + '/client/' + 'login.html');
  }
});

//GET method for stock page
app.get('/stock', function (req, res) {
  //Add Details
  if (!req.session.value) {
    res.redirect('/login');
  } else {
    res.sendFile(__dirname + '/client/stock.html');
  }

});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login', function (req, res) {
  //Add Details
  MediaRender.get("login.html").then(data => {
    res.status(data.code).write(data.data)
    res.end()
  }).catch(err => {
    res.status(404).write("File not found")
    res.end()
  })
});



// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function (req, res) {
  //Add Details

});

// POST method to insert details of a new event to tbl_events table
app.post('/postEvent', function (req, res) {
  //Add Details
  var con = mysql.createConnection({
    host: HOST,
    user: USER, // replace with the database user provided to you
    password: PASSWORD_TXT, // replace with the database password provided to you
    database: DATABASE, // replace with the database user provided to you
    port: PORT
  });


  con.connect(function (err) {
    if (err) {
      throw err
    }

    var rowToBeInserted = {
      event_day: req.body.day,
      event_event: req.body.event,
      event_start: req.body.start,
      event_end: req.body.end,
      event_location: req.body.location,
      event_phone: req.body.phone,
      event_info: req.body.info,
      event_url: req.body.url

    };
    con.query('INSERT tbl_events SET ?', rowToBeInserted, function (err, result) {
      if (err) {
        throw err;
      }
    });
  });
  res.redirect("/events");
});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function (req, res) {
  //Add Details
  var con = mysql.createConnection({
    host: HOST,
    user: USER, // replace with the database user provided to you
    password: PASSWORD_TXT, // replace with the database password provided to you
    database: DATABASE, // replace with the database user provided to you
    port: PORT
  });

  con.connect(function (err) {
    if (err) {
      throw err
    }
  });

  userID = req.body.username
  password = req.body.psw
  console.log(password)
  myLogin = crypto.createHash('sha256').update(password).digest('base64')


  con.query('SELECT * FROM tbl_accounts where acc_password =? and acc_name=?', [myLogin, userID], function (err, rows, fields) {
    if (err) throw err;
    if (rows.length == 0) {
      req.session.flag = 1
      res.redirect("/login")
    } else {
      req.session.value = 1;
      req.session.user = userID
      res.redirect("/events")
    }

  });

});

// log out of the application
// destroy user session
app.get('/logout', function (req, res) {
  //Add Details
  req.session.destroy()
  res.redirect('/login')

});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'))

app.get("/events.json", (req, res) => {
  DB.fetch(MyDB, "tbl_events", 0).then(data => {
    res.status(200).send(data)
  })
})


app.use('/admin', (req, res) => {
  res.status(200).sendFile(__dirname + "/client/admin.html")
})


app.get('/userLogin', (req, res) => {
  if (req.session.user == undefined) {
    res.redirect("/login")
  } else {
    res.status(200).send({
      login: req.session.user
    })
  }
})

app.get('/getStatus', (req, res) => {
  if (req.session.user == undefined) {
    res.status(200).send("0")
  } else {
    res.status(200).send("1")
  }
})
// For API calls
var api = require("./api")
app.use("/api", api)

// function to return the 404 message and error to client
app.get('*', function (req, res) {
  // add details
  res.status(404).send("404:PAGE NOT FOUND!")
});