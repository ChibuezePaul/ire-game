const mongoose = require("mongoose");
const { DB_URL } = require("./config.js");
const { SETTINGS_COUNT } = require("./config.js");
const { logger } = require("./logger.js");
const Setting = require("../models/Setting");
let INIT_SETTINGS_DATA = process.env.INIT_SETTINGS_DATA || require(`../settingsInitData`);

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, audoIndex: true })
  .then(() => logger.info("Database connected successfully"))
  .catch(() => logger.error("Database connection error"));
  
mongoose.connection.on('connected', (con => {
  Setting.countDocuments({}, (error, count) => {
    if(error) {
      logger.error(`Error occurred getting count of records in settings db: ${error}`);
    }
    if(count < SETTINGS_COUNT){
        if (typeof INIT_SETTINGS_DATA === "string") {
            INIT_SETTINGS_DATA = JSON.parse(INIT_SETTINGS_DATA);
            logger.info("INIT_SETTINGS_DATA parsed successfully")
        }
      Setting.insertMany(INIT_SETTINGS_DATA, (error, settings) => {
        if(error) {
          logger.error(`Error occurred inserting records in settings db: ${error}`);
        }else{
          logger.info(`${settings.length} records inserted in settings db successfully`);
        }   
      })
    }
  })
}));

mongoose.connection.on('error', error => logger.error(`Database connection error: ${error.message}`));