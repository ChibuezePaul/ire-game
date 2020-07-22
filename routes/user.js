const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../core/config.json");

const secretKey = process.env.SECRET_KEY || config.SECRET_KEY;
const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");

exports.signup = (req, res) => {
  if (!req.body) {
    return res.status(400).json(sendErrorMessage("Missing User Details"));
  }
  const { username, password, email, phone, gender, location, avatarId } = req.body;

  const newUser = new User({
    username: username,
    password: password,
    email: email,
    phone: phone,
    gender: gender,
    location: location,
    avatarId: avatarId
  });

  const error = newUser.validateSync();

  if (error) {
    console.log(`Bad Details sent for user with username: ${username}`);
    return res.status(400).json(sendErrorMessage(error.message.replace("User validation failed:", "").split(",")));
  }
  bcrypt.genSalt(10, (error, salt) => {
    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {
        console.log(`Error occurred hashing password for new user with email: ${email}`);
        return res.status(400).json(sendErrorMessage(error));
      }
      newUser.password = hash;
      newUser.save(error => {
        if (error) {
          console.log(`Error occurred saving new user with email ${email}: ${error}`);
          return res.status(400).json(sendErrorMessage(error));
        }
        return res.status(200).json(sendSuccessMessage(filterUerInfo(newUser)));
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
    if (error) { return res.status(400).json(sendErrorMessage(error, 400)); }
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
      jwt.sign({ user }, secretKey, (error, token) => {
        return res.status(200).json(sendSuccessMessage("Bearer " + token));
      })
    });
  });
}

exports.getUser = (req, res, next) => {
  jwt.verify(req.token, secretKey, (error, authData) => {
    if (error) {
      console.log(`token verification error: ${error}`);
      return res.status(403).json(sendErrorMessage("Unauthorized Request", 403));
    }
    const id = req.params.id;
    User.findOne({ _id: id, delFlag: "N" }, (error, user) => {
      if (error) {
        console.log(`Error occured fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
    });
  });
}

exports.updateUser = (req, res, next) => {
  jwt.verify(req.token, secretKey, (error, authData) => {
    if (error) {
      console.log(`token verification error: ${error}`);
      return res.status(403).json(sendErrorMessage("Unauthorized Request", 403));
    }
    const { username, email, phone, location, avatarId } = req.body;
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
          console.log(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
      }
    );
  });
}

exports.deleteUser = (req, res, next) => {
  jwt.verify(req.token, secretKey, (error, authData) => {
    if (error) {
      console.log(`token verification error: ${error}`);
      return res.status(403).json(sendErrorMessage("Unauthorized Request", 403));
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
          console.log(`Error occured fetching user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
      }
    );
  });
}

exports.getUsers = (req, res, next) => {
  jwt.verify(req.token, secretKey, (error, authData) => {
    if (error) {
      console.log(`token verification error: ${error}`);
      return res.status(403).json(sendErrorMessage("Unauthorized Request", 403));
    }
    User.find({ delFlag: "N" }, (error, users) => {
      if (error) {
        console.log(`Error occurred fetching users: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (users.length === 0) {
        return res.status(404).json(sendErrorMessage("No user found in database", 404));
      }
      return res.status(200).json(sendSuccessMessage(users.map(user => filterUerInfo(user))));
    });
  });
}

function filterUerInfo(user) {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  })
}