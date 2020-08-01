const jwt = require("jsonwebtoken");
const Question = require("../models/Question");
const questions = process.env.QUESTIONS || require("../questions/questions.json");
const { sendErrorMessage, sendSuccessMessage, filterQuestionInfo } = require("../core/utils");
const { SECRET_KEY } = require("../core/config.json");

exports.getQuestions = (req, res) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      console.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    Question.find({ delFlag: "N" }, (error, questions) => {
      if (error) {
        console.error(`Error occurred fetching questions: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      else if (questions.length !== 0) {
        return res.status(200).json(sendSuccessMessage(questions.map(question => filterQuestionInfo(question))));
      }
      return res.status(404).json(sendErrorMessage("No question found in database", 404));
    });
  });
}

exports.getQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      console.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const id = req.params.id;
    Question.findOne({ _id: id, delFlag: "N" }, (error, question) => {
      if (error) {
        console.error(`Error occured fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!question) {
        return res.status(404).json(sendErrorMessage(`Question not found with id: ${id}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(filterQuestionInfo(question)));
    });
  });
}

exports.deleteQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      console.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
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
          console.error(`Error occured fetching question with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!question) {
          return res.status(404).json(sendErrorMessage(`Question not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterQuestionInfo(question)));
      }
    );
  });
}

exports.createQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      console.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const API_KEY = req.headers["x-api-key"];
    if (!API_KEY) {
      return res.status(401).json(sendErrorMessage("Unathorized User", 401));
    }

    if (API_KEY != SECRET_KEY) {
      return res.status(401).json(sendErrorMessage("Unathorized User. Invalid Api-Key", 401));
    }
    let questionCount = 1;
    let failedCount;
    questions.forEach(question => {
      const newQuestion = new Question({
        yoruba: question[0],
        english: question[1],
        options: {
          option1: {
            yoruba: question[2],
            english: question[3],
          },
          option2: {
            yoruba: question[4],
            english: question[5],
          },
          option3: {
            yoruba: question[6],
            english: question[7],
          },
          option4: {
            yoruba: question[8],
            english: question[9],
          },
        }
      });
      questionCount++;
      const error = newQuestion.validateSync();

      if (error) {
        console.error(`Bad Details sent for question : ${questionCount}`);
        return res.status(400).json(sendErrorMessage(error.message.replace("Question validation failed:", "").replace(".", ` at question ${ questionCount }`).trim().split(",")));
      }
      newQuestion.save()
        .catch((error) => {
          failedCount = 0;
          console.error(`Error occured creating question: ${error}`)
        });
    });
    return res.status(201).json(sendSuccessMessage(`${failedCount || questionCount} questions added`, 201));
  });
}

exports.updateQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      console.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const { yoruba, english, options } = req.body;
    const id = req.params.id;
    Question.findOneAndUpdate(
      { _id: id, delFlag: "N" },
      {
        $set: {
          yoruba, english, options
        }
      },
      {
        new: true,
        useFindAndModify: false
      },
      (error, question) => {
        if (error) {
          console.error(`Error occured fetching question with id ${id}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        if (!question) {
          return res.status(404).json(sendErrorMessage(`Question not found with id: ${id}`, 404));
        }
        return res.status(200).json(sendSuccessMessage(filterQuestionInfo(question)));
      }
    );
  });
}