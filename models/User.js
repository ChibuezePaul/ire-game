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
    }
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
  location: {
    type: String,
    required: true
  },
  avatarId: {
    type: Number,
    default: 0
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  delFlag: {
    type: String,
    default: "N",
    index: true
  },
  paidFlag: {
    type: Boolean,
    default: false
  },
  gameData: {
    lastArena: {
      type: String,
    },
    totalCoins: {
      type: Number,
      default: 0,
    },
    totalLife: {
      type: Number,
      default: 0
    },
    languageId: {
      type: Number,
      default: 0
    },
    arenas: {
      arena1: {
        arenaTries: {
          type: Number,
          default: 2
        },
        lastLevel: {
          type: Number,
          default: 0
        },
      },
      arena2: {
        arenaTries: {
          type: Number,
          default: 1
        },
        lastLevel: {
          type: Number,
          default: 0
        },
      },
      arena3: {
        arenaTries: {
          type: Number,
          default: 1
        },
        lastLevel: {
          type: Number,
          default: 0
        },
      }
    }
  },
  emailVerificationCode: Number
},
{
  strictQuery: 'throw'
});
module.exports = mongoose.model("User", userSchema);