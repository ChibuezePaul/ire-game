const nodemailer = require('nodemailer'); 
const fetch = require('node-fetch')
const {
  EMAIL_SERVICE,
  SENDER_NAME,
  SENDER_EMAIL,
  SENDER_PASSWORD,
  SUBJECT,
  MAIL_CHIMP_URL,
  MAIL_CHIMP_API_KEY
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

exports.filterUserInfo = (user) => {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  });
}

exports.filterUserInfoForRanking = (user) => {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      delete ret.email;
      delete ret.phone;
      delete ret.gender;
      delete ret.location;
      delete ret.createdOn;
      delete ret.paidFlag;
      delete ret.gameData.lastArena;
      delete ret.gameData.languageId;
      delete ret.gameData.arenas;
      delete ret.emailVerificationCode;
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

exports.sendEmailVerificationMail = async (email, emailVerificationCode) => {
  const mailOptions = {
    from: SENDER_NAME + '<' + SENDER_EMAIL + '>',
    to: email,
    subject: SUBJECT,
    html: emailVerificationText(emailVerificationCode)
  };
  return await transporter.sendMail(mailOptions);
}

function emailVerificationText(emailVerificationCode) {
  return `<p>Congratulations,</p>
    <p>You have successfully downloaded IRE game, your Unique code is: <b style="color:green">${emailVerificationCode}</b>.
    <p>Unique code is confidential, please do not share with anyone.</p>
    <p>Thank You,<br>Team Ire.</p>`;
}

exports.sendEmailAndUsernameToMailChimp = (email, username, phone) => {
  fetch(MAIL_CHIMP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `auth ${MAIL_CHIMP_API_KEY}`
    },
    body: JSON.stringify({
      "members": [
        {
          "email_address": email,
          "merge_fields": {
            "FNAME": username,
            "PHONE": phone
          },
          "status": "subscribed"
        }
      ]
    })
  }).then((response) => {
    console.log("subscription successful");
  }, (error) => {
    console.error(`error occeured subscribing email ${email}: ${error}`);
  });
}

exports.isDateWithinCurrentMonth = (date) => {
  const my_date = new Date();
  const first_date = new Date(my_date.getFullYear(), my_date.getMonth(), 2);
  const last_date = new Date(my_date.getFullYear(), my_date.getMonth() + 1, 1);
  return date.getTime() >= first_date.getTime() && date.getTime() <= last_date.getTime();
};