const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  SECRET_KEY: process.env.SECRET_KEY,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  SENDER_NAME: process.env.SENDER_NAME,
  SENDER_EMAIL: process.env.SENDER_EMAIL,
  SENDER_PASSWORD: process.env.SENDER_PASSWORD,
  SUBJECT: process.env.SUBJECT
};