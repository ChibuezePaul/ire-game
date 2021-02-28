const mongoose = require("mongoose");
const { DB_URL } = require("./config.js");
const { SETTINGS_COUNT } = require("./config.js");
const { logger } = require("./logger.js");
const Setting = require("../models/Setting");

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, audoIndex: true })
  .then(() => logger.info("Database connected successfully"))
  .catch(() => logger.error("Database connection error"));
  
mongoose.connection.on('connected', (con => {
  Setting.countDocuments({}, (error, count) => {
    if(error) {
      logger.error(`Error occurred getting count of records in settings db: ${error}`);
    }
    if(count < SETTINGS_COUNT){
      Setting.insertMany([
        {
          "name" : "referralThreshold",
          "value" : "3",
        },
        {
          "name" : "referralFee",
          "value" : "0.1",
        },
        {
          "name" : "registrationFee",
          "value" : "1000"
        },
        {
          "name" : "isReferralActive",
          "value" : true
        }
      ], (error, settings) => {
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