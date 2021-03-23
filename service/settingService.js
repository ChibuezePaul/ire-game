const Setting = require("../models/Setting");
const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");
const { SECRET_KEY } = require("../core/config.js");
const { logger } = require("../core/logger.js");


exports.createSetting = (req, res, next) => {
    const API_KEY = req.headers["x-api-key"];
    if (!API_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User", 401));
    }

    if (API_KEY !== SECRET_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User. Invalid Api-Key", 401));
    }
    const { name, value } = req.body;
    if (!name || !value) {
        return res.status(400).json(sendErrorMessage("Missing body parameter", 400));
    }

    const newSetting = new Setting({
        name,
        value
    });
    const validationError = newSetting.validateSync();

    if (validationError) {
        logger.error(`Bad Details sent for setting: ${validationError}`);
        return res.status(400).json(sendErrorMessage("Invalid Details Received"));
    }
    newSetting.save(error => {
        if (error) {
            logger.error(`Error occurred creating setting: ${error}`)
          return res.status(400).json(sendErrorMessage(error));
        }
        return res.status(200).json(sendSuccessMessage(newSetting, 200));
    });
}

exports.updateSetting = (req, res, next) => {
    const API_KEY = req.headers["x-api-key"];
    if (!API_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User", 401));
    }

    if (API_KEY !== SECRET_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User. Invalid Api-Key", 401));
    }

    const { name, value } = req.body;
    Setting.findOneAndUpdate(
        { name, delFlag: "N" },
        {
            $set: {
                value,
                updatedOn: Date.now()
            }
        },
        {
            useFindAndModify: false
        },
        (error, setting) => {
            if (error) {
                logger.error(`Error occurred fetching setting with name ${name}: ${error}`);
                return res.status(400).json(sendErrorMessage(error, 400));
            }
            if (!setting) {
                return res.status(404).json(sendErrorMessage(`Setting not found with name: ${name}`, 404));
            }
            setting.audits.push(setting.value);
            setting.save(error => {
                if(error){
                    logger.error("Error auditing setting value", error)
                }
            });
            return res.status(200).json(sendSuccessMessage(setting));
        }
    );
}

exports.getSettings = (req, res) => {
    const API_KEY = req.headers["x-api-key"];
    if (!API_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User", 401));
    }

    if (API_KEY !== SECRET_KEY) {
        return res.status(401).json(sendErrorMessage("Unauthorized User. Invalid Api-Key", 401));
    }

    Setting.find({ delFlag: "N" }, (error, settings) => {
        if (error) {
            logger.error(`Error occurred fetching settings: ${error}`);
            return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (settings.length === 0) {
            return res.status(404).json(sendErrorMessage("No setting found in database", 404));
        }
        return res.status(200).json(sendSuccessMessage(settings));
    });
}