const mongoose = require("mongoose");

const questionSchema = mongoose.Schema({
  yoruba: String,
  english: String,
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
},
{
  strictQuery: 'throw'
});

const Question = module.exports = mongoose.model("Question", questionSchema);