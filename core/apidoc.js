/**
 * @apiDefine UserNotFoundError
 *
 * @apiError UserNotFound The id of the User was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "User Not Found with {id}"
 *     }
 */

 /**
 * @apiDefine UserError
 *
 * @apiError UserError Bad User Request.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Error Occured: {Error}"
 *     }
 */

/**
 * @api {get} /api/user/:id Request User information
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id User unique ID.
 *
 * @apiSuccess {String} username Username of the User.
 * @apiSuccess {String} password  Password of the User.
 * @apiSuccess {String} phone  Phone of the User.
 * @apiSuccess {Enum: {MALE, FEMALE}} gender  Gender of the User.
 * @apiSuccess {String} email  Email of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "username": "JohnDoe",
 *       "password": "*****",
 *       "phone": "phone",
 *       "gender": "gender",
 *       "email": "email",
*        "createdOn": "2020-07-15",
 *     }
 *
 * @apiUse UserNotFoundError
 */

/**
 * @api {put} /api/user/:id Modify User information
 * @apiName PutUser
 * @apiGroup User
 *
 * @apiParam {Number} id Users unique ID (Passed as url param).
 * @apiParam {String} username New Username of the User
 * @apiParam {String} phone  New Phone of the User.
 * @apiParam {String} email  New Email of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 * @apiUse UserNotFoundError
 */

/**
 * @api {post} /api/user Create New User
 * @apiName PostUser
 * @apiGroup User
 *
 * @apiParam {String} username Username of the User
 * @apiParam {String} phone  Phone of the User.
 * @apiParam {String} email  Email of the User.
 * @apiParam {Enum: {MALE, FEMALE}} gender gender of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 * @apiUse UserError
 */

/**
 * @api {get} /api/user Request All Users information
 * @apiName GetAllUser
 * @apiGroup User
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 * @apiUse UserError
 */

 /**
 * @api {post} /api/user/login User Login
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiParam {String} username Username of the User
 * @apiParam {String} password  Password of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *
 * @apiUse UserError
 */