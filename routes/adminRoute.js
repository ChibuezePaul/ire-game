const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");
const adminRoute = require('../core/routeConfig');
const adminService = require('../service/adminService');
const ADMIN_URI = '/api.admin';

adminRoute.get(ADMIN_URI, (req, res) => {
    res.render("admin");
});

adminRoute.get(`${ADMIN_URI}.referrals`, (req, res) => {
    const monthlyReferrals = adminService.getMonthlyReferrals(req.query);
    const { error, message } = monthlyReferrals;
    if(error){
        return res.status(401).send(sendErrorMessage(message, 401));
    }
    return res.send(sendSuccessMessage(message));
})

module.exports = adminRoute;