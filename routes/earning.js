const jwt = require("jsonwebtoken");
const Earning = require("../models/Earning");
const User = require("../models/User");
const Setting = require("../models/Setting");

const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");
const { SECRET_KEY } = require("../core/config.js");
const { logger } = require("../core/logger.js");
const { isDateWithinCurrentMonth } = require("../core/utils");


exports.createEarning = (req, res, next) => {
    
    
    jwt.verify(req.token, SECRET_KEY, (error, authData) => {
        if (error) {
            logger.error(`token verification error: ${error}`);
            return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
        }
        
        const userId = req.params.userId;
        
        User.findOne({ _id: userId, delFlag: "N" }, (error, user) => {
            if (error) {
                if (isUserNotFoundError(error)) {
                    return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
                }
                logger.error(`Error occured fetching user with id ${userId}: ${error}`);
                return res.status(400).json(sendErrorMessage(error, 400));
            }
            if (!user) {
                return res.status(404).json(sendErrorMessage(`User not found with id: ${userId}`, 404));
            }

            const referralCount = user.referedUsers
                .filter(referredUser => isDateWithinCurrentMonth(new Date(referredUser.dateReferred)))
                .length;
            
            if(referralCount !== 0){                
                Setting.find({ name: { $in: ['referralThreshold', 'referralFee', 'registrationFee', 'isReferralActive' ] } }, (error, settings) => {
                    if (error) {
                        logger.error(`Error occurred fetching settings: ${error}`);
                        return res.status(400).json(sendErrorMessage(error, 400));
                    }
                    if (settings.length === 0) {
                        return res.status(500).json(sendErrorMessage("No settings found in database. Kindly Contact Administrator", 500));
                    }

                    let referralThreshold, referralFee, registrationFee, isReferralActive;

                    isReferralActive = settings.find(setting => setting.name == 'isReferralActive')['value'];
                    referralThreshold = settings.find(setting => setting.name == 'referralThreshold')['value'];
                    referralFee = settings.find(setting => setting.name == 'referralFee')['value'];
                    registrationFee = settings.find(setting => setting.name == 'registrationFee')['value'];

                    if(!isReferralActive) {
                        return res.status(400).json(sendSuccessMessage('Referral Programme Has Ended.', 400));
                    }else{
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
                                    logger.error(`Error occurred creating earning: ${error}`)
                                    return res.status(400).json(sendErrorMessage(error));
                                }
                                user.earnings.push(newEarning);
                                user.save(error => {
                                    if (error) {
                                        logger.error(`Error occurred updating user's earning details with earning ${newEarning._id}: ${error}`);
                                        return res.status(400).json(sendErrorMessage(`Error Completing  Payment Request`, 500));
                                    }
                                    return res.status(200).json(sendSuccessMessage('Payment Request Successful', 200));
                                });
                            });
                        }
                    }
                });
            }else{
                return res.status(400).json(sendSuccessMessage('Payment Request Failed! No Referral Made Yet.', 400));
            }
        })
    });

}

exports.updateEarning = (req, res, next) => {
    jwt.verify(req.token, SECRET_KEY, (error, authData) => {
        if (error) {
            logger.error(`token verification error: ${error}`);
            return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
        }

        const id = req.params.id;
        Earning.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    dateConfirmed: Date.now()
                }
            },
            {
                new: true,
                useFindAndModify: false
            },
            (error, earning) => {
                if (error) {
                    logger.error(`Error occurred fetching earning with id ${id}: ${error}`);
                    return res.status(400).json(sendErrorMessage(error, 400));
                }
                if (!earning) {
                    return res.status(404).json(sendErrorMessage(`Earning not found with id: ${id}`, 404));
                }
                return res.status(200).json(sendSuccessMessage(earning));
            }
        );
    });
}