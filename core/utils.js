const nodemailer = require('nodemailer');
const config = require("../core/config.json");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || config.EMAIL_SERVICE,
  auth: {
    user: process.env.SENDER_EMAIL || config.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD || config.SENDER_PASSWORD
  }
});

exports.sendErrorMessage = (message, code = 400) => {
  return {
    code, message: `${message || 'Bad Request'}`
  }
}

exports.sendSuccessMessage = (message, code = 200) => {
  return {
    code: `${code}`, message
  }
}

exports.filterUerInfo = (user) => {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  })
}

exports.filterQuestionInfo = (question) => {
  return question.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.delFlag;
      return ret;
    }
  })
}

exports.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) {
    return res.status(403).json(this.sendErrorMessage('Missing Header Token', 403));
  }
  req.token = bearerHeader.split(" ")[1];
  next();
}

exports.generateEmailVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 1000);
}

exports.sendEmailVerificationMail = (email, emailVerificationCode) => {
  const mailOptions = {
    from: process.env.SENDER_NAME || config.SENDER_NAME + '<' + process.env.SENDER_EMAIL || config.SENDER_EMAIL + '>',
    to: email,
    subject: process.env.SUBJECT || config.SUBJECT,
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