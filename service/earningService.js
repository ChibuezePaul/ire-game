const Earning = require("../models/Earning");
const User = require("../models/User");
const Setting = require("../models/Setting");
const { sendErrorMessage, sendSuccessMessage, isUserNotFoundError } = require("../core/utils");
const { logger } = require("../core/logger.js");
const { isDateWithinCurrentMonth } = require("../core/utils");

exports.createEarning = (req, res) => {
    const userId = req.params.userId;

        Setting.find({ name: { $in: ['referralThreshold', 'referralFee', 'registrationFee', 'isReferralActive' ] } }, (error, settings) => {
            if (error) {
                logger.error(`Error occurred fetching settings: ${error}`);
                return res.status(400).json(sendErrorMessage(error, 400));
            }
            if (settings.length === 0) {
                return res.status(500).json(sendErrorMessage("No settings found in database. Kindly Contact Administrator", 500));
            }

            let referralThreshold, referralFee, registrationFee, isReferralActive;

            isReferralActive = settings.find(setting => setting.name === 'isReferralActive')['value'];
            referralThreshold = settings.find(setting => setting.name === 'referralThreshold')['value'];
            referralFee = settings.find(setting => setting.name === 'referralFee')['value'];
            registrationFee = settings.find(setting => setting.name === 'registrationFee')['value'];

            if(isReferralActive === 'false') {
                return res.status(400).json(sendSuccessMessage('Referral Programme Has Ended.', 400));
            }else{
                User.findOne({ _id: userId, delFlag: "N" }, (error, user) => {
                    if (error) {
                        if (isUserNotFoundError(error)) {
                            return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
                        }
                        logger.error(`Error occurred fetching user with id ${userId}: ${error}`);
                        return res.status(400).json(sendErrorMessage(error, 400));
                    }
                    if (!user) {
                        return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
                    }

                    const referralCount = user.referredUsers
                        .filter(referredUser => isDateWithinCurrentMonth(new Date(referredUser.dateReferred)))
                        .length;

                    if(referralCount === 0){
                        return res.status(400).json(sendErrorMessage('Payment Request Failed! No Referral Made This Month.', 400));
                    }

                    if(user.earnings.find(earning => isDateWithinCurrentMonth(earning.dateRequested))){
                        return res.status(400).json(sendErrorMessage('Payment Request Failed! Payment Already Made This Month.', 400));
                    }

                    if (referralCount < referralThreshold) {
                        return res.status(400).json(sendSuccessMessage('Payment Request Failed! Monthly Threshold Not Met.', 400));
                    } else {
                        const newEarning = new Earning({
                            amount: referralCount * registrationFee * referralFee,
                            referralFee,
                            referralCount,
                            referralThreshold
                        });

                    newEarning.save(error => {
                        if (error) {
                            logger.error(`Error occurred creating earning: ${error}`);
                            return res.status(400).json(sendErrorMessage(error));
                        }
                        user.earnings.push(newEarning);
                        user.save(error => {
                            if (error) {
                                logger.error(`Error occurred updating user's earning details with earning ${newEarning._id}: ${error}`);
                                return res.status(400).json(sendErrorMessage(`Error Completing  Payment Request`, 500));
                            }
                            return res.status(200).json(sendSuccessMessage('Payment Request Successful'));
                        });
                    });
                }
            })
       }
    });
}

exports.getUserEarnings = (req, res) => {
    const userId = req.params.userId;
    User.findOne({ _id: userId, delFlag: "N" }, (error, user) => {
        if (error) {
            if (isUserNotFoundError(error)) {
                return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
            }
            logger.error(`Error occurred fetching earnings with id ${userId}: ${error}`);
            return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
        }
        if(user.earnings.length === 0){
            return res.status(400).json(sendErrorMessage('User does not have any earning', 400));
        }
        return res.status(200).json(sendSuccessMessage(user.earnings));
    });
}

exports.updateEarning = (req, res) => {
    const id = req.params.id;

    Earning.findOne({ _id: id }, (error, earning) => {
        if (error) {
            logger.error(`Error occurred fetching earning with id ${id}: ${error}`);
            return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!earning) {
            return res.status(404).json(sendErrorMessage(`Earning not found with id: ${id}`, 404));
        }
        if(earning.dateConfirmed){
            return res.status(400).json(sendErrorMessage('Earning Already Confirmed', 400));
        }
        earning.dateConfirmed = Date.now();
        earning.save(error => {
            if(error){
                logger.error("Error confirming earning", error)
            }
        });
        return res.status(200).json(sendSuccessMessage(earning));
    });
}