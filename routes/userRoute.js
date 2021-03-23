const userRoute = require('../core/routeConfig');
const userService = require('../service/userService');
const { checkHeaderToken, verifyToken } = require("../core/utils");
const USER_URI = '/api/user';

//Unprotected User Resource
userRoute.post(`${USER_URI}/signup`, userService.signup);
userRoute.post(`${USER_URI}/login`, userService.login);
userRoute.put(`${USER_URI}/email/:id`, userService.verifyEmail);
userRoute.put(`${USER_URI}/resetPassword`, userService.resetPassword);
userRoute.get(`${USER_URI}/email/:email`, userService.getUserWithEmail);
userRoute.get(`${USER_URI}/verifyReferralCode/:referralCode/:email`, userService.verifyReferralCode);

//Protected User Resource
userRoute.put(`${USER_URI}/resendcode`, checkHeaderToken, verifyToken, userService.resendEmailVerificationCode);
userRoute.put(`${USER_URI}/:id`, checkHeaderToken, verifyToken, userService.updateUser);
userRoute.put(`${USER_URI}/gamedata/:id`, checkHeaderToken, verifyToken, userService.updateUserGameData);
userRoute.put(`${USER_URI}/payment/:id`, checkHeaderToken, verifyToken, userService.updateUserPaymentStatus);
userRoute.delete(`${USER_URI}/:id`, checkHeaderToken, verifyToken, userService.deleteUser);
userRoute.get(USER_URI, checkHeaderToken, verifyToken, userService.getUsers);
userRoute.get(`${USER_URI}/ranking`, checkHeaderToken, verifyToken, userService.getUsersRanking);
userRoute.get(`${USER_URI}/:id`, checkHeaderToken, verifyToken, userService.getUser);

module.exports = userRoute;