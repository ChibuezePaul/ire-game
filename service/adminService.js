const { SECRET_KEY } = require('../core/config');

module.exports = {
    getMonthlyReferrals(referralConstraints) {
        const { adminId, fromDate, toDate, threshold } = referralConstraints;

        if(SECRET_KEY !== adminId){
            return {error: true, message: 'Invalid Admin ID'}
        }
    }
}