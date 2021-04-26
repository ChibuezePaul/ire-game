const {AUTHORIZED_USER, AUTHORIZED_ROLE} = require('../core/config');
const User = require("../models/User");
const {logger} = require("../core/logger.js");
const {isDateWithinStartAndEndDate} = require("../core/utils");

module.exports = {
    getMonthlyReferrals(referralConstraints) {
        const {adminId, fromDate, toDate, threshold} = referralConstraints;

        return User.findOne({email: adminId})
            .orFail((error) => {
                logger.error(`Error fetching admin details ${error}`);
                throw Error('Unauthorized User');
            })
            .then(user => {
                if (AUTHORIZED_ROLE !== user.role || AUTHORIZED_USER !== user.email) {
                    logger.error(`Error validating admin details: ${user.email} ${user.role}`);
                    throw Error('Unauthorized User');
                }
                return User.find().map(users => {
                    return users
                        .filter(user => user.referredUsers.length > threshold)
                        .filter(user => user.referredUsers
                            .filter(referredUser => isDateWithinStartAndEndDate(fromDate, toDate, new Date(referredUser.dateReferred)))
                            .length > 0
                        )
                        .map(user => {
                            return {
                                username: user.username,
                                referralCode: user.email,
                                referralCount: user.referredUsers
                                    .filter(referredUser => isDateWithinStartAndEndDate(fromDate, toDate, new Date(referredUser.dateReferred)))
                                    .length
                            }
                        })
                })
                    .then(users => users)
                    .catch(error => {
                        logger.error(`Error fetching referral details ${error.message}`);
                        throw Error();
                    })
            });

    }
};