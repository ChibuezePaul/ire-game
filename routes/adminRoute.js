const adminRoute = require('../core/routeConfig');
const adminService = require('../service/adminService');
const ADMIN_URI = '/api/admin';

adminRoute.get(ADMIN_URI, (req, res) => {
    res.render("admin", {page: "Admin"});
});

adminRoute.post(`${ADMIN_URI}/referrals`, (req, res) => {
    const monthlyReferrals = adminService.getMonthlyReferrals(req.body);

    return monthlyReferrals
        .then(referralsList => res.render("referralsList", {referralsList, page: "Referrals List"}))
        .catch(error => {
            res.render('admin', {error_msg: error.message || 'Server Error. Contact Admin'})
        });
});

module.exports = adminRoute;