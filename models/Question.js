const mongoose = require("mongoose");

const questionSchema = mongoose.Schema({
  yoruba: {
    type: String,
    required: true,
    unique: true
  },
  english: {
    type: String,
    required: true,
    unique: true
  },
  options: {
    option1: {
      yoruba: String,
      english: String,
      correct: {
        type: Boolean,
        default: true
      }
    },
    option2: {
      yoruba: String,
      english: String,
      correct: {
        type: Boolean,
        default: false
      }
    },
    option3: {
      yoruba: String,
      english: String,
      correct: {
        type: Boolean,
        default: false
      }
    },
    option4: {
      yoruba: String,
      english: String,
      correct: {
        type: Boolean,
        default: false
      }
    }
  },
  delFlag: {
    type: String,
    default: "N",
    index: true
  },
  arena: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
},
{
  strictQuery: 'throw'
});

module.exports = mongoose.model("Question", questionSchema);