const jwt = require("jsonwebtoken");
const Question = require("../models/Question");
let questions = process.env.QUESTIONS || require("../questions/arenaLagosQuestions.json");
const { sendErrorMessage, sendSuccessMessage, filterQuestionInfo } = require("../core/utils");
const { SECRET_KEY } = require("../core/config.js");
const { logger } = require("../core/logger.js");

exports.getQuestionsForArena = (req, res) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const arena = req.params.arena;
    Question.find({ delFlag: "N", arena: arena }, (error, questions) => {
      if (error) {
        logger.error(`Error occurred fetching questions: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      else if (questions.length === 0) {
        return res.status(404).json(sendErrorMessage(`No question found for arena ${arena}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(questions.map(question => filterQuestionInfo(question))));
    }).collation({ locale: 'en', strength: 1 });
  });
}

exports.getQuestionsForLevel = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const { arena, level } = req.params;
    Question.find({ delFlag: "N", arena: arena, level: level }, (error, questions) => {
      if (error) {
        logger.error(`Error occurred fetching questions with arena ${arena}, level ${level}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!questions) {
        return res.status(404).json(sendErrorMessage(`Questions not found in arena ${arena}, level ${level}`, 404));
      }
      else if (questions.length === 0) {
        return res.status(404).json(sendErrorMessage(`No question found in arena ${arena}, level ${level}`, 404));
      }
      return res.status(200).json(sendSuccessMessage(questions.map(question => filterQuestionInfo(question))));
    }).collation({ locale: 'en', strength: 1 });
  });
}

exports.deleteQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
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
          logger.error(`Error occurred fetching question with id ${id}: ${error}`);
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

exports.deleteQuestionsInArena = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const arena = req.params.arena;
    Question.deleteMany({ arena: arena },
      (error, questions) => {
        if (error) {
          logger.error(`Error occurred deleting questions in arena ${arena}: ${error}`);
          return res.status(400).json(sendErrorMessage(error, 400));
        }
        return res.status(200).json(sendSuccessMessage(`${questions.deletedCount} question(s) deleted`));
      }
    ).collation({ locale: 'en', strength: 1 });
  });
}

exports.createQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
      return res.status(401).json(sendErrorMessage("Unauthorized Request", 401));
    }
    const API_KEY = req.headers["x-api-key"];
    if (!API_KEY) {
      return res.status(401).json(sendErrorMessage("Unauthorized User", 401));
    }

    if (API_KEY !== SECRET_KEY) {
      return res.status(401).json(sendErrorMessage("Unauthorized User. Invalid Api-Key", 401));
    }
    const arena = req.body.arena;
    if (!req.body || !arena) {
      return res.status(400).json(sendErrorMessage("Missing body parameter", 400));
    }
    
    if (typeof questions === "string") {
      questions = JSON.parse(questions); 
      logger.info("questions parsed successfully") 
    }

    logger.info("questions length", questions.length);
    let questionCount = 1;
    let level = 0;

    for (let i = 0; i < questions.length; i++) {
      let question = questions[i];
      if (question[0].indexOf("LEVEL") !== -1) {
        level++;
        continue;
      }
      const newQuestion = new Question({
        arena: arena,
        level: level,
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
        logger.error(`Bad Details sent for question : ${questionCount}`);
        return res.status(400).json(sendErrorMessage(error.message.replace("Question validation failed:", "").replace(".", ` at question ${questionCount}`).trim().split(",")));
      }
      newQuestion.save()
        .catch((error) => {
          logger.error(`Error occurred creating question: ${error}`)
        });
    }
    return res.status(201).json(sendSuccessMessage(`${questionCount - 1} questions added`, 201));
  });
}

exports.updateQuestion = (req, res, next) => {
  jwt.verify(req.token, SECRET_KEY, (error, authData) => {
    if (error) {
      logger.error(`token verification error: ${error}`);
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
          logger.error(`Error occurred fetching question with id ${id}: ${error}`);
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