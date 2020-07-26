const Question = require("../models/Question");
// const questions = require("../questions/questions.json");
const { sendErrorMessage, sendSuccessMessage } = require("../core/utils");
// const { SECRET_KEY } = require("../core/config.json")

exports.getQuestions = (req, res) => {
  Question.find({ delFlag: "N" }, (error, questions) => {
    if (error) {
      console.log(`Error occurred fetching questions: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    else if (questions.length !== 0) {
      return res.status(200).json(sendSuccessMessage(questions.map(question => filterQuestionInfo(question))));
    }
    return res.status(404).json(sendErrorMessage("No question found in database", 404));
  });
}

exports.getQuestion = (req, res, next) => {
  const id = req.params.id;
  Question.findOne({ _id: id, delFlag: "N" }, (error, question) => {
    if (error) {
      console.log(`Error occured fetching user with id ${id}: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!question) {
      return res.status(404).json(sendErrorMessage(`Question not found with id: ${id}`, 404));
    }
    return res.status(200).json(sendSuccessMessage(filterQuestionInfo(question)));
  });
}

exports.deleteQuestion = (req, res, next) => {
  const id = req.params.id;
  Question.findOneAndUpdate(
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
    (error, question) => {
      if (error) {
        console.log(`Error occured fetching question with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!question) {
        return res.status(404).json(sendErrorMessage(`Question not found with id: ${id}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(filterQuestionInfo(question)));
    }
  );
}

// exports.createQuestion = (req, res, next) => {
//   const secretKey = req.body.secretKey;
//   if (!secretKey) {
//     return res.status(403).json(sendErrorMessage(`Unath`, 403));
//   }
//   if (secretKey != SECRET_KEY) {
//     questions.forEach(question => {
//       const newQuestion = new Question({
//         yoruba: question[0],
//         english: question[1],
//         options: {
//           option1: {
//             yoruba: question[2],
//             english: question[3],
//           },
//           option2: {
//             yoruba: question[4],
//             english: question[5],
//           },
//           option3: {
//             yoruba: question[6],
//             english: question[7],
//           },
//           option4: {
//             yoruba: question[8],
//             english: question[9],
//           },
//         }
//       });
//       newQuestion.save();
//     });
//     return res.status(201).json(sendSuccessMessage(`${questions.size()} questions added`, 201));
//   }
// }

function filterQuestionInfo(question) {
  return question.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.delFlag;
      return ret;
    }
  })
}