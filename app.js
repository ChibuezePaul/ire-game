//Dependencies Declaration
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const xlsxtojson = require("xlsx-to-json");
const config = require("./core/config.json");
require("./core/database");

//App init
const app = express();
const port = process.env.PORT || config.PORT;

//Middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Content-Type", "application/json");
  return next();
});
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(morgan("dev"));

//Routes
const { signup, login, getUser, updateUser, deleteUser, getUsers, verifyEmail } = require("./routes/user");
const { getQuestion, getQuestions, deleteQuestion } = require("./routes/question");
const { sendErrorMessage } = require("./core/utils");

app.all('/*', function (req, res, next) {
  // res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  next();
});

//Documentation Page
app.get("/", (req, res) => res.render("index"));
app.get("/test", (req, res) => res.send("build 1.3"));

//Unprotected User Resource
app.post("/api/user/signup", signup);
app.post("/api/user/login", login);

//Token Middleware
app.use(verifyToken);

//Protected User Resource
app.get("/api/user/:id", getUser);
app.put("/api/user/:id", updateUser);
app.delete("/api/user/:id", deleteUser);
app.get("/api/user", getUsers);
app.post("/api/user/email/:id", verifyEmail);

//Protected Question Resource
app.get("/api/question/:id", getQuestion);
app.get("/api/question", getQuestions);
app.delete("/api/question/:id", deleteQuestion);
// app.post("/api/question", createQuestion)

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) {
    return res.status(403).json(sendErrorMessage('Missing Header Token', 403));
  }
  req.token = bearerHeader.split(" ")[1];
  next();
}

//Server Startup
app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`));
