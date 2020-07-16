const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{1,}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required: [true, 'User phone number required']
  },
  gender: {
    type: String,
    required: true,
    uppercase: true,
    enum: ["MALE", "FEMALE"],
    validate: {
      validator: function (v) {
        return v == "MALE" || v == "FEMALE";
      },
      message: props => `MALE and FEMALE are the only valid gender. ${props.value} is not a valid gender`
    },
  },
  createdOn: {
    type: Date,
    default: Date.now 
  }
})

const User = module.exports = mongoose.model("User", userSchema);