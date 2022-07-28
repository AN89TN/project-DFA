require('dotenv').config();
var http = require('http');

const express = require('express');
const path = require("path");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const socketIO = require('socket.io');
const mongoose = require ('mongoose');

const app = express();
const port = process.env.PORT || 5000;
const username = process.env.MONGODB_USR;
const password = process.env.MONGODB_PSW;
const cluster = "tr89an.oxgni";
const dbname = "modtDB";

mongoose.connect(
  `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`, 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const Schema = {
  _id: String,
  password: String,
  username: String,
  data: Array,
  options: [{
    name: String,
    isDM: Boolean,
    colors: Array,
    _id: false
  }]
};

const Data = mongoose.model("datas", Schema);

//var server for soket
var server = app.listen(port, () => {
    console.log('Server started on: ' + port);
  });

const {
    refreshTokens, COOKIE_OPTIONS, generateToken, generateRefreshToken,
    getCleanUser, verifyToken, clearTokens, handleResponse,
  } = require('./utils');

// list of the users to be consider as a database for example
/* const userList = [
    {
    userId: 314721619910,
    password: '123',
    name: '123',
    username: '123',
    isDM: true,
    data: [{id: 1231241, rollName: "giorgio", dadi: [{id: 12452441, qtDado: 10, faces: 100, bonus: 0, malus: 0}, {id: 1241, qtDado: 2, faces: 10, bonus: 0, malus: 0}]}, {id: 1241, rollName: "mastrota", dadi: [{id: 12441, qtDado: 1, faces: 10, bonus: 10, malus: 0}, {id: 122341, qtDado: 20, faces: 5, bonus: 0, malus: 3}]} ]
  }
] */

// enable CORS
app.use(cors({
    origin: 'https://diceforall.herokuapp.com/', // url of the frontend application http://localhost:3000
    credentials: true // set credentials true for secure httpOnly cookie
  }));

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// use cookie parser for secure httpOnly cookie
app.use(cookieParser(process.env.COOKIE_SECRET));



// middleware that checks if JWT token exists and verifies if it does exist.
// In all private routes, this helps to know if the request is authenticated or not.
const authMiddleware = function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.headers['authorization'];
    if (!token) return handleResponse(req, res, 401);
   
    token = token.replace('Bearer ', '');
   
    // get xsrf token from the header
    const xsrfToken = req.headers['x-xsrf-token'];
    if (!xsrfToken) {
      return handleResponse(req, res, 403);
    }
   
    // verify xsrf token
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;
    if (!refreshToken || !(refreshToken in refreshTokens) || refreshTokens[refreshToken] !== xsrfToken) {
      return handleResponse(req, res, 401);
    }
   
    // verify token with secret key and xsrf token
    verifyToken(token, xsrfToken, (err, payload) => {
      
      if (err)
        return handleResponse(req, res, 401);
      else {
        req.user = payload; //set the user to req so other routes can use it
        next();
      }
    });
  }

// verify the token and return new tokens if it's valid
app.post('/verifyToken', function (req, res) {
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;
    if (!refreshToken) {
      return handleResponse(req, res, 204);      
    }
   
    // verify xsrf token
    const xsrfToken = req.headers['x-xsrf-token'];
    if (!xsrfToken || !(refreshToken in refreshTokens) || refreshTokens[refreshToken] !== xsrfToken) {

      return handleResponse(req, res, 401);
    }


    // verify refresh token
    verifyToken(refreshToken, '', (err, payload) => {
      if (err) {
        return handleResponse(req, res, 401);
      }
      else {
        Data.findById(payload._id, (err, itemSearch) => {
        if (!itemSearch) {
          return handleResponse(req, res, 401);
        }
  
        // get basic user details
        const userObj = getCleanUser(itemSearch);
   
        // generate access token
        const tokenObj = generateToken(itemSearch);
   
        // refresh token list to manage the xsrf token
        refreshTokens[refreshToken] = tokenObj.xsrfToken;
        res.cookie('XSRF-TOKEN', tokenObj.xsrfToken);
   
        // return the token along with user details
        return handleResponse(req, res, 200, {
          user: userObj,
          token: tokenObj.token,
          expiredAt: tokenObj.expiredAt
        });
      })}
    });
  });

// create new user
app.post('/signin', function (req, res) {
    
    const user = req.body.user;
    const pwd = req.body.pass;
    /* const isTrue = userList.some(x => x.username === user); //for checking if user alredy exist
    if (isTrue === true) {
      return handleResponse(req,res, 400, null, "Username Alredy Exist.")
    } */

    if (!user || !pwd) {
      return handleResponse(req, res, 400, null, "Username and Password required.");
    }
  
    newUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      password: pwd,
      username: user,
      data: [],
      options:[
        {
          name: user,
          isDM: false,
          colors:[]
        }
      ]
    };

    Data.findOne({username: user}, (err, itemSearch) => {
      if (itemSearch) {return handleResponse(req, res, 400, null, "Username Alredy Exist.")}
      if (itemSearch === null) {
        Data.create(newUser, (err, itemSearch) => {
          
          const userObj = getCleanUser(newUser);
          const tokenObj = generateToken(newUser);
          const refreshToken = generateRefreshToken(userObj._id);
   
          refreshTokens[refreshToken] = tokenObj.xsrfToken;
   
          res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
          res.cookie('XSRF-TOKEN', tokenObj.xsrfToken);
  
          return handleResponse(req, res, 200, {
          user: userObj,
          token: tokenObj.token,
          expiredAt: tokenObj.expiredAt
            });
        })};
    });
  });

// validate user credentials
app.post('/login', function (req, res) {
  const user = req.body.user;
  const pwd = req.body.pass;
 
  // return 400 status if username/password is not exist
  if (!user || !pwd) {
    return handleResponse(req, res, 400, null, "Username and Password required.");
  }
 
  Data.findOne({username: user, password: pwd}, (err, itemSearch) => {
    if (itemSearch === null) {return handleResponse(req, res, 401, null, "Username or Password is Wrong.")};
    if (itemSearch) {
        const userObj = getCleanUser(itemSearch);
        const tokenObj = generateToken(itemSearch);
        const refreshToken = generateRefreshToken(userObj._id);
 
        refreshTokens[refreshToken] = tokenObj.xsrfToken;
 
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        res.cookie('XSRF-TOKEN', tokenObj.xsrfToken);

        return handleResponse(req, res, 200, {
        user: userObj,
        token: tokenObj.token,
        expiredAt: tokenObj.expiredAt
          })}});
});

app.use('/userdata', authMiddleware , function (req, res) {
    var user = req.user.username
    var method = req.method; 
  if (method === "POST") {
    var command = req.body.serviceData.command;
  if (command == 'CUSTOMROLL') {
    var data = req.body.serviceData.data;
    Data.findOne({username: user}, (err, itemSearch) => {
      if (itemSearch === null) {return handleResponse(req, res, 401, null, "Username or Password is Wrong.")};
      if (itemSearch) {
        Data.findOneAndUpdate({_id: req.user._id}, {"$push":{"data":{"$each": [data], "$position": 0 }}},  (err, itemSearch) => {
          return handleResponse(req, res, 200)
        })
    }})}
  else if (command == "DELETE") {
    Data.findByIdAndUpdate({ "_id" : req.user._id}, {$pull:{"data": {"id" : req.body.serviceData.id}}},  (err, itemSearch) => {
      return handleResponse(req, res, 200)
  })}
  else if (command == "DELETE_ACCOUNT") {
    Data.findByIdAndDelete({"_id" : req.user._id}, (err, itemSearch) => {
    return handleResponse(req, res, 200)
  })}
  else if (command == "CHANGE_DM") {
    Data.findOneAndUpdate({ "_id" : req.user._id},{$set:{"options.$[].isDM":  req.body.serviceData.data.isDM}} , (err, itemSearch) => {
    return handleResponse(req, res, 200)
  })}
  else if (command == "CHANGE_NAME") {
    Data.findOneAndUpdate({ "_id" : req.user._id},{$set:{"options.$[].name":  req.body.serviceData.data.name}} , (err, itemSearch) => {
    return handleResponse(req, res, 200)
  })}

};
  if (method === "GET") {
    Data.findById(req.user._id, (err, itemSearch) => {
      if (itemSearch === null) return handleResponse(req, res, 400);
      return handleResponse(req, res, 200, { data: itemSearch.data, options: itemSearch.options });
    });
    };
});

// handle user logout
app.post('/logout', (req, res) => {
  clearTokens(req, res);
  return handleResponse(req, res, 204);
});

var io = socketIO(server,{
  cors: {
    origin:   'http://diceforall.herokuapp.com',  //'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const dynamicNsp = io.of(/Room-\w+/).on("connection", (socket) => {
  const newNamespace = socket.nsp;
  var newUser = socket.handshake.query.user;
  var isDM = socket.handshake.query.isDM;
  var user = () => { if (isDM === "false") return newUser; else return ( "[DM] " + newUser); };
  var id = () => new Date().valueOf().toString(36) + Math.random().toString(36).slice(2);

  console.log("Client "+ user() +" connected");
  
  if (newUser) {
  setInterval(() => newNamespace.emit('time', timeStamp()), 1000);

  socket.on('disconnect', () => {
    console.log("Client "+ user() +" disconnected");
    newNamespace.emit('bye', {time: timeStamp(), username : user(), id : id(), message : "has left the "+ newNamespace.name.substring(1) + ", number of users connected: " + (newNamespace.server.engine.clientsCount-1) + "."});
  });
  socket.on('roll', (n,cb) => {
    newNamespace.emit('result', {time: timeStamp(), username : user(), "id" : id(), message : " Roll a 1d" + n + " = " + dice(n)});
  });
  socket.on('welcome', () => {
    newNamespace.emit('welcome', {time: timeStamp(), username : user(), "id" : id(), message : "has joined the " + newNamespace.name.substring(1) + ", number of users connected: " + newNamespace.server.engine.clientsCount + "."});
  });}
  socket.on('customRolls', (n,cb) => {
    newNamespace.emit('customResult', {time: timeStamp(), username : user(), "id" : id(), message : " Custom Roll: " + n.map((e => "[(" + e.qtDado + "d" + e.faces + (e.bonus > 0 ? (" + " + e.bonus) : "") + (e.malus > 0 ? (" - " + e.malus) : "") + ") = " + customDice(e.qtDado, e.faces, e.bonus, e.malus) + "] "))});
  });
  socket.on('secretDmRoll', (faces,result,cb) => {
    newNamespace.emit('secretDmRoll', {time: timeStamp(), username : user(), "id" : id(), message : " Roll a 1d" + faces + " = " + result});
  });
});

const dice = (n) =>  Math.floor(Math.random()*n+1);
const customDice = (q,n,b,m) => {
  result=[];
  
  while (q>0) {
    roll = Math.floor(Math.random()*n+1)+(b-m);
    result.push(roll)
    q--;
  }
  return (result + ", Tot. = " + result.reduce((accumulator, value) => {
    return accumulator + value;
  }, 0))
};
const timeStamp = () => {
  var date = new Date();
  var hour = (date.getHours()<10?'0':'') + date.getHours();
  var min = (date.getMinutes()<10?'0':'') + date.getMinutes();
  var sec = (date.getSeconds()<10?'0':'') + date.getSeconds();
  return(hour + ":" + min + ":" + sec)
}

//app.use(express.static(path.resolve(__dirname, "../react-ui/build")));
app.use(express.static(path.join(__dirname, 'build')));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});