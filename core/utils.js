const nodemailer = require('nodemailer');
const {
  EMAIL_SERVICE,
  SENDER_NAME,
  SENDER_EMAIL,
  SENDER_PASSWORD,
  SUBJECT
} = require("./config.js");

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASSWORD
  }
});

exports.sendErrorMessage = (message, code = 400) => {
  return {
    code, message: `${message || 'Bad Request'}`
  };
}

exports.sendSuccessMessage = (message, code = 200) => {
  return {
    code: `${code}`, message
  };
}

exports.isUserNotFoundError = (error) => {
  return error.toString().indexOf("CastError") != -1
}

exports.filterUerInfo = (user) => {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  });
}

exports.filterQuestionInfo = (question) => {
  return question.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.delFlag;
      return ret;
    }
  });
}

exports.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) {
    return res.status(401).json(this.sendErrorMessage('Missing Header Token', 401));
  }
  req.token = bearerHeader.split(" ")[1];
  next();
}

exports.generateEmailVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 1000);
}

exports.sendEmailVerificationMail = (email, emailVerificationCode) => {
  const mailOptions = {
    from: SENDER_NAME + '<' + SENDER_EMAIL + '>',
    to: email,
    subject: SUBJECT,
    html: emailVerificationText(emailVerificationCode)
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent to ${email}: ${info.response}`);
    }
  });
}

function emailVerificationText(emailVerificationCode) {
  return `<p>Congratulations,</p>
    <p>You have successfully downloaded IRE game, your Unique code is: <b style="color:green">${emailVerificationCode}</b>.
    <p>Unique code is confidential, please do not share with anyone.</p>
    <p>Thank You,<br>Team Ire.</p>`;
}