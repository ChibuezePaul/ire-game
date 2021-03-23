const settingRoute = require('../core/routeConfig');
const settingService = require('../service/settingService');
const { checkHeaderToken, verifyToken } = require("../core/utils");
const SETTING_URI = '/api/setting';

//Protected Setting Resource
settingRoute.post(SETTING_URI, checkHeaderToken, verifyToken, settingService.createSetting);
settingRoute.get(SETTING_URI, checkHeaderToken, verifyToken, settingService.getSettings);
settingRoute.put(SETTING_URI, checkHeaderToken, verifyToken, settingService.updateSetting);

module.exports = settingRoute;