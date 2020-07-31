//Dependencies Declaration
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const config = require("./core/config.json");
require("./core/database");

//App init
const app = express();
const PORT = process.env.PORT || config.PORT;

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
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(morgan("dev"));
const { verifyToken } = require("./core/utils");

//Routes
const { signup, login, getUser, updateUser, deleteUser, getUsers, verifyEmail } = require("./routes/user");
const { getQuestion, getQuestions, deleteQuestion, createQuestion, updateQuestion } = require("./routes/question");
const USER_URI = "/api/user"
const QUESTION_URI = "/api/question"

app.all('/*', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  next();
});

//Documentation Page
app.get("/", (req, res) => res.render("index"));
app.get("/test", (req, res) => res.send("build 1.3"));

//Unprotected User Resource
app.post(`${USER_URI}/signup`, signup);
app.post(`${USER_URI}/login`, login);
app.put(`${USER_URI}/email/:id`, verifyEmail);

//Token Middleware
app.use(verifyToken);

//Protected User Resource
app.get(`${USER_URI}/:id`, getUser);
app.put(`${USER_URI}/:id`, updateUser);
app.delete(`${USER_URI}/:id`, deleteUser);
app.get(USER_URI, getUsers);

//Protected Question Resource
app.get(QUESTION_URI, getQuestions);
app.post(QUESTION_URI, createQuestion)
app.get(`${QUESTION_URI}/:id`, getQuestion);
app.delete(`${QUESTION_URI}/:id`, deleteQuestion);
app.put(`${QUESTION_URI}/:id`, updateQuestion);

//Server Startup
app.listen(PORT, console.log(`IRE Game Server Started On Port ${PORT}...`));
