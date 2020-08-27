//Dependencies Declaration
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const { logger } = require("./core/logger.js");

//App init
const app = express();
require("./core/database");
const { PORT } = require("./core/config.js");

//Middlewares
app.use(express.json());
app.options("*",(req, res, next) => {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Allow-Headers"] = "Authorization, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    res.writeHead(200, headers);
    res.send();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.on('finish', function () {
    logger.info(`${req.method} request received on ${req.url} with code ${this.statusCode}`);
  })
  next();
});
const { verifyToken } = require("./core/utils");

//Routes
const { signup, login, getUser, updateUser, deleteUser, getUsers, verifyEmail, getUsersRanking, updateUserGameData, updateUserPaymentStatus, resendEmailVerificationCode } = require("./routes/user");
const { getQuestionsForLevel, getQuestionsForArena, deleteQuestion, createQuestion, updateQuestion, deleteQuestionsInArena } = require("./routes/question");
const USER_URI = "/api/user"
const QUESTION_URI = "/api/question"

app.all('/*', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  next();
});

//Unprotected User Resource
app.post(`${USER_URI}/signup`, signup);
app.post(`${USER_URI}/login`, login);
app.put(`${USER_URI}/email/:id`, verifyEmail);

//Token Middleware
app.use(verifyToken);

//Protected User Resource
app.put(`${USER_URI}/resendcode`, resendEmailVerificationCode);
app.put(`${USER_URI}/:id`, updateUser);
app.put(`${USER_URI}/gamedata/:id`, updateUserGameData);
app.put(`${USER_URI}/payment/:id`, updateUserPaymentStatus);
app.delete(`${USER_URI}/:id`, deleteUser);
app.get(USER_URI, getUsers);
app.get(`${USER_URI}/ranking`, getUsersRanking);
app.get(`${USER_URI}/:id`, getUser);

//Protected Question Resource
app.get(`${QUESTION_URI}/:arena`, getQuestionsForArena);
app.post(QUESTION_URI, createQuestion);
app.get(`${QUESTION_URI}/:arena/:level`, getQuestionsForLevel);
app.delete(`${QUESTION_URI}/:arena`, deleteQuestionsInArena);
app.delete(`${QUESTION_URI}/:id`, deleteQuestion);
app.put(`${QUESTION_URI}/:id`, updateQuestion);

//Server Startup
app.listen(PORT, logger.info(`IRE Game Server Started On Port ${PORT}...`));
