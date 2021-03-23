const questionRoute = require('../core/routeConfig');
const questionService = require('../service/questionService');
const { checkHeaderToken, verifyToken } = require("../core/utils");
const QUESTION_URI = '/api/question';

//Protected Question Resource
questionRoute.get(`${QUESTION_URI}/:arena`, checkHeaderToken, verifyToken, questionService.getQuestionsForArena);
questionRoute.post(QUESTION_URI, checkHeaderToken, verifyToken, questionService.createQuestion);
questionRoute.get(`${QUESTION_URI}/:arena/:level`, checkHeaderToken, verifyToken, questionService.getQuestionsForLevel);
questionRoute.delete(`${QUESTION_URI}/:arena`, checkHeaderToken, verifyToken, questionService.deleteQuestionsInArena);
questionRoute.delete(`${QUESTION_URI}/:id`, checkHeaderToken, verifyToken, questionService.deleteQuestion);
questionRoute.put(`${QUESTION_URI}/:id`, checkHeaderToken, verifyToken, questionService.updateQuestion);

module.exports = questionRoute;