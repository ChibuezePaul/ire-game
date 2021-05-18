const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET_KEY } = require("../core/config.js");
const { logger } = require("../core/logger.js");
const { sendErrorMessage, sendSuccessMessage, filterUserInfo, filterUserInfoForRanking, generateEmailVerificationCode, sendEmailVerificationMail, isUserNotFoundError, sendEmailAndUsernameToMailChimp } = require("../core/utils");

const signup = (req, res) => {
  if (!req.body) {
    return res.status(400).json(sendErrorMessage("Missing User Details"));
  }
  const { username, password, email, phone, gender, location, avatarId } = req.body;

  if (!username || !password || !email || !location) {
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
        sendEmailAndUsernameToMailChimp(newUser.email, newUser.username, newUser.phone);
        return res.status(200).json(sendSuccessMessage(filterUserInfo(newUser)));
      });
    });
  });
}

const login = (req, res) => {
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
      const payload = user.username;
      jwt.sign({payload}, SECRET_KEY, (error, token) => {
        return res.status(200).json([{ User: filterUserInfo(user) }, sendSuccessMessage("Bearer " + token)]);
      })
    });
  }).collation({ locale: 'en', strength: 1 });
}

const getUser = (req, res, next) => {
    const id = req.params.id;
    User.findOne({ _id: id, delFlag: "N" }, (error, user) => {
      if (error) {
        if (isUserNotFoundError(error)) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        logger.error(`Error occurred fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
    });
}

const updateUser = (req, res, next) => {
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
          logger.error(`Error occurred fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
}

const updateUserGameData = (req, res, next) => {
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
          logger.error(`Error occurred fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
}

const deleteUser = (req, res, next) => {
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
          logger.error(`Error occurred fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
}

const getUsers = (req, res, next) => {
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
}

const verifyEmail = (req, res, next) => {
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
        logger.error(`Error occurred verifying email for user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      const payload = user.username;
      jwt.sign({payload} , SECRET_KEY, (error, token) => {
        return res.status(200).json([{ User: filterUserInfo(user) }, sendSuccessMessage("Bearer " + token)]);
      })
    }
  );
}

const getUsersRanking = (req, res, next) => {
    User.find({ delFlag: "N", }, (error, users) => {
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
}

const updateUserPaymentStatus = (req, res, next) => {
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
          logger.error(`Error occurred fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
    );
}

const resendEmailVerificationCode = (req, res, next) => {
    const { email, emailVerificationCode } = req.body;
    sendEmailVerificationMail(email, emailVerificationCode)
      .then(resp => res.status(200).json(sendSuccessMessage(`Email Sent Successfully to ${email}`)))
      .catch(err => res.status(400).json(sendErrorMessage(`Error Occurred Sending Email to ${email}. ${err}`)))
}

const resetPassword = (req, res, next) => {

  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json(sendErrorMessage("Missing body parameters"));
  }
  bcrypt.genSalt(10, (error, salt) => {
    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {
        logger.error(`Error occurred hashing password for user with id: ${id}`);
        return res.status(400).json(sendErrorMessage(error));
      }
      User.findOneAndUpdate(
        { _id: id, delFlag: "N" },
        {
          $set: {
            password: hash
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
            logger.error(`Error occurred resetting user password with id ${id}: ${error}`);
            return res.status(400).json(sendErrorMessage(error, 400));
          }
          if (!user) {
            return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          return res.status(200).json(sendSuccessMessage('Password Reset Success'));
        }
      );
    });
  });
}

const getUserWithEmail = (req, res, next) => {
  const email = req.params.email;
  User.findOne({ email: email, delFlag: "N" }, (error, user) => {
    if (error) {
      if (isUserNotFoundError(error)) {
        return res.status(404).json(sendErrorMessage(`User not found with email: ${email}`, 404));
      }
      logger.error(`Error occurred fetching user with email ${email}: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with email: ${email}`, 404));
    }
    return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
  });
}

const verifyReferralCode = (req, res, next) => {

  const referralCode = req.params.referralCode;
  const email = req.params.email;
  User.findOne({ email: referralCode, delFlag: "N" }, (error, user) => {
    if (error) {
      if (isUserNotFoundError(error)) {
        return res.status(404).json(sendErrorMessage(`Invalid Referral Code ${referralCode} Supplied`, 404));
      }
      logger.error(`Error occurred fetching user with email ${email}: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!user) {
      return res.status(400).json(sendErrorMessage(`Invalid Referral Code ${referralCode} Supplied`, 400));
    }
    const referredUsersEmail = user.referredUsers.map(userDetails => Object.values(userDetails)).join();
    let isNewReferral = false;
    if(!referredUsersEmail.includes(email)){
      user.referredUsers.push({referredUser: email, dateReferred: new Date()});
      isNewReferral = true;
    }

    user.save(error => {
      if (error) {
        logger.error(`Error occurred updating user's referral details with email ${email}: ${error}`);
        return res.status(400).json(sendErrorMessage(`Error Validating Referral Code ${referralCode} Supplied`, 500));
      }
      if (isNewReferral) {
        return res.status(200).json(sendSuccessMessage('Referral Code Applied Successfully'));
      } else {
        return res.status(400).json(sendErrorMessage('Referral Code Already Applied'));
      }
    });
  });
}

const uploadProfileImage = (req, res) => {
  const { id, imageUrl } = req.body;
  User.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
          $set: {
              profileImageUrl: imageUrl,
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
              logger.error(`Error occurred uploading profile image for user with id ${id}: ${error}`);
              return res.status(400).json(sendErrorMessage(error, 400));
          }
          if (!user) {
              return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
          }
          return res.status(200).json(sendSuccessMessage(filterUserInfo(user)));
      }
  );
}

module.exports = {
  signup,
  login,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
  verifyEmail,
  getUsersRanking,
  updateUserGameData,
  updateUserPaymentStatus,
  resendEmailVerificationCode,
  resetPassword,
  getUserWithEmail,
  verifyReferralCode,
  uploadProfileImage
}