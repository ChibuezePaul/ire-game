const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("./config.json");
const User = require("../models/User");
const dbUrl = process.env.DB_URL || config.DB_URL;
const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection error"));
  
mongoose.connection.on('error', error => console.log(`Database connection error: ${error.message}`));

// exports.save = (newUser, res) => {
//   bcrypt.genSalt(10, (error, salt) => {
//     bcrypt.hash(newUser.password, salt, (error, hash) => {
//       if (error) {
//         console.log(`Error occurred hashing password for new user with email: ${email}`);
//         return res.status(400).json(sendErrorMessage(error));
//       }
//       newUser.password = hash;
//       newUser.save(error => {
//         if (error) {
//           console.log(`Error occurred saving new user with email ${email}: ${error}`);
//           return res.status(400).json(sendErrorMessage(error));
//         }
//         return res.status(200).json(sendSuccessMessage(filterUerInfo(newUser)));
//       });
//     });
//   });
// }

// exports.findByUsername = (username, res) => {
//   User.findOne({ username: username, delFlag: "N" }, (error, user) => {
//     if (error) {
//       console.log(`Error occured fetching user with username: ${username}: ${error}`);
//       return res.status(400).json(sendErrorMessage(error, 400));
//     }
//     if (!user) {
//       return res.status(404).json(sendErrorMessage(`User not found with username: ${username}`, 404));
//     }
//     return user;
//   });
// }

// exports.findById = (id, res) => {
//   return User.findOne({ _id: id, delFlag: "N" }, (error, user) => {
//     if (error) {
//       console.log(`Error occured fetching user with id: ${id}: ${error}`);
//       return res.status(400).json(sendErrorMessage(error, 400));
//     }
//     if (!user) {
//       return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
//     }
//     return user;
//   });
// }

// exports.update = (id, user, res) => {
//   User.findOneAndUpdate(
//     { _id: id, delFlag: "N" },
//     {
//       $set: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone,
//         location: user.location,
//         avatarId: user.avatarId
//       }
//     },
//     {
//       new: true,
//       useFindAndModify: false
//     },
//     (error, user) => {
//       if (error) {
//         console.log(`Error occured fetching user with id ${id}: ${error}`);
//         return res.status(400).json(sendErrorMessage(error, 400));
//       }
//       if (!user) {
//         return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
//       }
//       return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
//     }
//   );
// }

// exports.deleteOne = (id, res) => {
//   User.findOneAndUpdate(
//     { _id: id, delFlag: "N" },
//     {
//       $set: {
//         delFlag: "Y"
//       }
//     },
//     {
//       new: true,
//       useFindAndModify: false
//     },
//     (error, user) => {
//       if (error) {
//         console.log(`Error occured fetching user with id ${id}: ${error}`);
//         return res.status(400).json(sendErrorMessage(error, 400));
//       }
//       if (!user) {
//         return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
//       }
//       return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
//     }
//   );
// }

// exports.findAll = (res) => {
//   User.find({ delFlag: "N" }, (error, users) => {
//     if (error) {
//       console.log(`Error occurred fetching users: ${error}`);
//       return res.status(400).json(sendErrorMessage(error, 400));
//     }
//     if (users.length === 0) {
//       return res.status(404).json(sendErrorMessage("No user found in database", 404));
//     }
//     return res.status(200).json(sendSuccessMessage(users.map(user => filterUerInfo(user))));;
//   });
// }