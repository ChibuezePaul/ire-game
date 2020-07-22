const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("./config.json");
const User = require("../models/User");
const dbUrl = process.env.DB_URL || config.DB_URL;
const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection error"));
  
mongoose.connection.on('error', error => console.log(`Database connection error: ${error.message}`));