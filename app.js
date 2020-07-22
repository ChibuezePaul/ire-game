//Dependencies Declaration
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const config = require("./core/config.json");
require("./core/database");

//App init
const app = express();
const port = process.env.PORT || config.PORT;

//Middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  return next();
});
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(morgan("dev"));
// app.use(function (req, res, next) {
//   if (req.headers['x-forwarded-proto'] === 'https') {
//     res.redirect('http://' + req.hostname + req.url);
//   } else {
//     next();
//   }
// });

//User Routes
const { signup, login, getUser, updateUser, deleteUser, getUsers } = require("./routes/user");
const { sendErrorMessage } = require("./core/utils");

app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  next();
});

//Documentation Page
app.get("/", (req, res) => res.render("index"));
app.get("/test", (req, res) => res.send("build 1.2"));

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

function verifyToken(req, res, next) {
  // if (url != BASE_URL + "login" || url != BASE_URL + "signup") {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(403).json(sendErrorMessage('Missing Header Token', 403));
    }
    req.token = bearerHeader.split(" ")[1];
    next();
  // } else {
  //   next();
  // }
}

//Server Startup
app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`));
