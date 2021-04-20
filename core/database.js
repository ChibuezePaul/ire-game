const mongoose = require("mongoose");
const { DB_URL } = require("./config.js");
const { logger } = require("./logger.js");

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, autoIndex: true })
  .then(() => logger.info("Database connected successfully"))
  .catch(() => logger.error("Database connection error"));
  
mongoose.connection.on('connected', (() => require('./init')));

mongoose.connection.on('error', error => logger.error(`Database connection error: ${error.message}`));