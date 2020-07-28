const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const User = require("../models/User");
const config = require("../core/config.json");

//Mail Sender Init
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || config.EMAIL_SERVICE,
  auth: {
    user: process.env.SENDER_EMAIL || config.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD || config.SENDER_PASSWORD
  }
});

function composeMail(emailVerificationCode){
  return `<p>Congratulations,</p>
    <p>You have successfully downloaded IRE game, your Unique code is: <b>${emailVerificationCode}</b>.
    <p>Unique code is confidential, please do not share with anyone.</p><br>
    <p>Thank you,</p>
    <p>Team Ire.</p>`;
}

function sendEmailVerificationMail(email, emailVerificationCode){
  const mailOptions = {
    from: process.env.SENDER_NAME || config.SENDER_NAME + '<' + process.env.SENDER_EMAIL || config.SENDER_EMAIL + '>',
    to: email,
    subject: process.env.SUBJECT || config.SUBJECT,
    html: composeMail(emailVerificationCode)
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent to ${email}: ${info.response}`);
    }
  });
}

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
    avatarId: avatarId,
    emailVerificationCode: generateEmailVerificationCode()
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
        sendEmailVerificationMail(newUser.email, newUser.emailVerificationCode);
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

exports.verifyEmail = (req, res, next) => {
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
          emailVerificationCode: 0
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, user) => {
        if (error) {
          console.log(`Error occured veryfying email for user with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!user) {
          return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
        }
        jwt.sign({ user }, secretKey, (error, token) => {
          return res.status(200).json(sendSuccessMessage("User: "+filterUerInfo(user) + "\n Bearer " + token));
        })
      }
    );
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

function generateEmailVerificationCode() {
  return Math.floor(1000 + Math.random() * 1000);
}