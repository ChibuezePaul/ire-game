const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET_KEY } = require("../core/config.js");
const { logger } = require("../core/logger.js");
const { sendErrorMessage, sendSuccessMessage, filterUserInfo, filterUserInfoForRanking, generateEmailVerificationCode, sendEmailVerificationMail, isUserNotFoundError, sendEmailAndUsernameToMailChimp } = require("../core/utils");

exports.signup = (req, res) => {
  if (!req.body) {
    return res.status(400).json(sendErrorMessage("Missing User Details"));
  }
  const { username, password, email, phone, gender, location, avatarId } = req.body;

  if (!username || !password || !email || !gender || !location ) {
    return res.status(400).json(sendErrorMessage("Missing body parameters"));
  }

  const newUser = new User({
    username: username,
    password: password,
    email: email,
    phone: phone,
    gender: gender,
    location: location,
    avatarId: avatarId,
    emailVerificationCode: generateEmailVerificationCode()
  });

  const error = newUser.validateSync();

  if (error) {
    logger.error(`Bad Details sent for user with username: ${username}`);
    return res.status(400).json(sendErrorMessage(error.message.replace("User validation failed:", "").trim().split(",")));
  }
  bcrypt.genSalt(10, (error, salt) => {
    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {
        logger.error(`Error occurred hashing password for new user with email: ${email}`);
        return res.status(400).json(sendErrorMessage(error));
      }
      newUser.password = hash;
      newUser.save(error => {
        if (error) {
          logger.error(`Error occurred saving new user with email ${email}: ${error}`);
          return res.status(400).json(sendErrorMessage(error));
        }
        sendEmailVerificationMail(newUser.email, newUser.emailVerificationCode);
        sendEmailAndUsernameToMailChimp(newUser.email, newUser.username);
        return res.status(200).json(sendSuccessMessage(filterUserInfo(newUser)));
      });
    });
  });
}

exports.login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json(sendErrorMessage());
  }

  User.findOne({ username: username, delFlag: "N" }, function (error, user) {
    if (error) {
      if (isUserNotFoundError(error)) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with username: ${username}`, 404));
    }
    bcrypt.compare(password, user.password, (error, isMatch) => {
      if (error) {
        throw error;
      }
      if (!isMatch) {
        return res.status(400).json(sendErrorMessage('Incorrect password'));
      }
      jwt.sign({ user }, SECRET_KEY, (error, token) => {
        return res.status(200).json([{ User: filterUserInfo(user) },sendSuccessMessage("Bearer " + token)]);
      })
    });
  }).collation({ locale: 'en', strength: 1 });
}

exports.getUser = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const id = req.params.id;
    User.findOne({ _id: id, delFlag: "N" }, (error, user) => {
      if (error) {
        if (isUserNotFoundError(error)) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        logger.error(`Error occured fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
    });
  });
}

exports.updateUser = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const { username, email, phone, location, avatarId } = req.body;
    if (!username || !email || !location || avatarId == null) {
      return res.status(400).json(sendErrorMessage("Missing body parameters"));
    }
    const id = req.params.id;
    User.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
        $set: {
          username, email, phone, location, avatarId
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, user) => {
        if (error) {
          if (isUserNotFoundError(error)) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          logger.error(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
  });
}

exports.updateUserGameData = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const { gameData } = req.body;
    if (Object.keys(gameData).length < 3) {
      return res.status(400).json(sendErrorMessage("Missing body parameters"));
    }
    const id = req.params.id;
    User.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
        $set: {
          gameData: gameData
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, user) => {
        if (error) {
          if (isUserNotFoundError(error)) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          logger.error(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
  });
}

exports.deleteUser = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const id = req.params.id;
    User.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
        $set: {
          delFlag: "Y"
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, user) => {
        if (error) {
          if (isUserNotFoundError(error)) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          logger.error(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
  });
}

exports.getUsers = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    User.find({ delFlag: "N" }, (error, users) => {
      if (error) {
        logger.error(`Error occurred fetching users: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (users.length === 0) {
        return res.status(404).json(sendErrorMessage("No user found in database", 404));
      }
      return res.status(200).json(sendSuccessMessage(users.map(user => filterUserInfo(user))));
    });
  });
}

exports.verifyEmail = (req, res, next) => {
  const id = req.params.id;
  User.findOneAndUpdate(
    { _id: id, delFlag: "N" },
    {
      $set: {
        emailVerificationCode: 0
      },
    },
    {
      new: true,
      useFindAndModify: false
    },
    (error, user) => {
      if (error) {
        if (isUserNotFoundError(error)) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        logger.error(`Error occured veryfying email for user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      jwt.sign({ user }, SECRET_KEY, (error, token) => {
        return res.status(200).json([{ User: filterUserInfo(user) }, sendSuccessMessage("Bearer " + token)]);
      })
    }
  );
}

exports.getUsersRanking = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    User.find({ delFlag: "N",  }, (error, users) => {
      if (error) {
        logger.error(`Error occurred fetching users: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (users.length === 0) {
        return res.status(404).json(sendErrorMessage("No user found in database", 404));
      }
      return res.status(200).json(sendSuccessMessage(users.map(user => filterUserInfoForRanking(user))));
    })
      .sort({ 'gameData.totalCoins': -1 })
      .limit(10);
  });
}

exports.updateUserPaymentStatus = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const id = req.params.id;
    User.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
        $set: {
          paidFlag: true
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, user) => {
        if (error) {
          if (isUserNotFoundError(error)) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          logger.error(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
  });
}

exports.resendEmailVerificationCode =  (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const { email, emailVerificationCode } = req.body;
    sendEmailVerificationMail(email, emailVerificationCode)
      .then(resp => res.status(200).json(sendSuccessMessage(`Email Sent Successfully to ${email}`)))
      .catch(err => res.status(400).json(sendErrorMessage(`Error Occured Sending Email to ${email}. ${err}`)))
  });
}