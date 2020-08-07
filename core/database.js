const mongoose = require("mongoose");
const { DB_URL } = require("./config.js");

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection error"));
  
mongoose.connection.on('error', error => console.log(`Database connection error: ${error.message}`));