//Dependencies Declaration
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const hbs = require('express-handlebars');
const { logger } = require("./core/logger.js");
const { PORT } = require("./core/config.js");
const userRoute = require("./routes/userRoute");
const questionRoute = require("./routes/questionRoute");
const settingRoute = require("./routes/settingRoute");
const earningRoute = require("./routes/earningRoute");
const adminRoute = require('./routes/adminRoute');

//App init
const app = express();
require("./core/database");

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.options("*", (req, res, next) => {
  let headers = {};
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Credentials"] = false;
  headers["Access-Control-Allow-Headers"] = "Authorization, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
  res.writeHead(200, headers);
  res.send();
});
// view engine setup
app.set('view engine', 'hbs');
app.engine( 'hbs', hbs( {
    extname: 'hbs',
    defaultView: 'index',
    layoutsDir: __dirname + '/views/layout/',
    partialsDir: __dirname + '/views/partials/'
}));

app.use(express.static(path.join(__dirname, '/public')));
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.on('finish', function () {
    logger.info(`${req.method} request received on ${Date()} ${req.url} ${this.statusCode}`);
  });
  next();
});
//Routes Middleware
app.use(userRoute);
app.use(questionRoute);
app.use(earningRoute);
app.use(settingRoute);
app.use(adminRoute);
// app.use(`${ADMIN_URI}`, adminRoute);

app.all('/*', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  next();
});

// app.get(ADMIN_URI, (req, res) => {
//   res.sendFile("admin.hbs", {root : path.join(__dirname, '/public')});
// });

//Server Startup
app.listen(PORT, logger.info(`IRE Game Server Started On Port ${PORT}...`));