const mongoose = require("mongoose");
const config = require("./config.json");
const dbUrl = process.env.DB_URL || config.DB_URL;

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection error"));
  
mongoose.connection.on('error', error => console.log(`Database connection error: ${error.message}`));