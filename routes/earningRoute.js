const earningRoute = require('../core/routeConfig');
const earningService = require('../service/earningService');
const { checkHeaderToken, verifyToken } = require("../core/utils");

const EARNING_URI = '/api/earning';

//Protected Earning Resource
earningRoute.get(`${EARNING_URI}/:userId`, checkHeaderToken, verifyToken, earningService.getUserEarnings);
earningRoute.post(`${EARNING_URI}/:userId`, checkHeaderToken, verifyToken, earningService.createEarning);
earningRoute.put(`${EARNING_URI}/:id`, checkHeaderToken, verifyToken, earningService.updateEarning);

module.exports = earningRoute;