require('dotenv').config();

const express = require('express');
const path = require("path");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

const {
    refreshTokens, COOKIE_OPTIONS, generateToken, generateRefreshToken,
    getCleanUser, verifyToken, clearTokens, handleResponse,
  } = require('./utils');

// list of the users to be consider as a database for example
const userList = [
    {
    userId: 314721619910,
    password: '123',
    name: '123',
    username: '123',
    isAdmin: true,
    data: []
  }
]

// enable CORS
app.use(cors({
    origin: 'http://localhost:3000', // url of the frontend application
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
        const userData = userList.find(x => x.userId === payload.userId);
        if (!userData) {
          return handleResponse(req, res, 401);
        }
   
        // get basic user details
        const userObj = getCleanUser(userData);
   
        // generate access token
        const tokenObj = generateToken(userData);
   
        // refresh token list to manage the xsrf token
        refreshTokens[refreshToken] = tokenObj.xsrfToken;
        res.cookie('XSRF-TOKEN', tokenObj.xsrfToken);

        // return the token along with user details
        return handleResponse(req, res, 200, {
          user: userObj,
          token: tokenObj.token,
          expiredAt: tokenObj.expiredAt
        });
      }
    });
   
  });

app.get('/API', function (req, res) {

    res.send("I'm an API");
});


// create new user
app.post('/signin', function (req, res) {
    
    const user = req.body.user;
    const pwd = req.body.pass;
    const isTrue = userList.some(x => x.username === user); //for checking if user alredy exist
    
    if (!user || !pwd) {
      return handleResponse(req, res, 400, null, "Username and Password required.");
    }
  
    if (isTrue === true) {
      return handleResponse(req,res, 400, null, "Username Alredy Exist.")
    }
    const idrng = Math.floor(Math.random() * 1000000000000); //change it for DB id
  
    newUser = {
      userId: idrng,
      password: pwd,
      name: user,
      username: user,
      isAdmin: true,
      data: []
    };
  
    userList.push(newUser);
  
    const userData = userList.find(x => x.username === user && x.password === pwd);
  
    const userObj = getCleanUser(userData);
   
    const tokenObj = generateToken(userData);
   
    const refreshToken = generateRefreshToken(userObj.userId);
   
    refreshTokens[refreshToken] = tokenObj.xsrfToken;
   
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.cookie('XSRF-TOKEN', tokenObj.xsrfToken);
  
    return handleResponse(req, res, 200, {
      user: userObj,
      token: tokenObj.token,
      expiredAt: tokenObj.expiredAt
    });
  });

  app.get('/userdata', authMiddleware , function (req, res) {
    res.send("your data");
  });

// handle user logout
app.post('/logout', (req, res) => {
  clearTokens(req, res);
  return handleResponse(req, res, 204);
});

app.use(express.static(path.resolve(__dirname, "../client/src")));

app.listen(port, () => {
    console.log('Server started on: ' + port);
  });