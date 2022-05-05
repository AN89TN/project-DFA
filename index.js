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
const userList = []

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

app.use(express.static(path.resolve(__dirname, "../client/src")));

app.listen(port, () => {
    console.log('Server started on: ' + port);
  });