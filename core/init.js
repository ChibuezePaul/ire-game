const { SETTINGS_COUNT, AUTHORIZED_USER, AUTHORIZED_ROLE } = require("./config.js");
const Setting = require("../models/Setting");
const User = require("../models/User");
let INIT_SETTINGS_DATA = process.env.INIT_SETTINGS_DATA || require(`../settingsInitData`);
const { logger } = require("./logger.js");

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
});

User.findOne({ email: AUTHORIZED_USER, role: AUTHORIZED_ROLE, delFlag: "N" }, (error, user) => {
    if (error) {
        logger.error(`Error occurred fetching user with email ${AUTHORIZED_USER}: ${error}`);
    }
    if (!user) {
        User.create({
            username: AUTHORIZED_USER.split('@')[0],
            password: 'undefined',
            email: AUTHORIZED_USER,
            role: AUTHORIZED_ROLE,
            gender: 'FEMALE',
            location: '@ire_game'
        },(error1, admin) => {
            if(error1) {
                logger.error(`Error occurred inserting records in settings db: ${error1}`);
            }else {
                logger.error(`Admin created successfully with email: ${admin.email} and role: ${admin.role}`);
            }
        })
    }
});



