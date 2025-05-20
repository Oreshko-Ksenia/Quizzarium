const { Question } = require("../models/models");
const { Answer } = require("../models/models");
const ApiError = require("../error/ApiError");
const { Quiz } = require('../models/models');

class QuestionController {
  async createQuestion(req, res, next) {
    try {
      const { quiz_id } = req.params;
      const { text } = req.body;
      if (!text || !quiz_id) return next(ApiError.badRequest("Текст и ID викторины обязательны"));
  
      const { id: user_id, role } = req.user;
      const quiz = await Quiz.findByPk(quiz_id);
      if (!quiz) return next(ApiError.notFound("Викторина не найдена"));
      if (quiz.user_id !== user_id && role !== 'ADMIN') {
        return next(ApiError.forbidden("Нет прав для добавления вопроса к этой викторине"));
      }
  
      const question = await Question.create({
        text,
        media_url: req.file ? `/uploads/${req.file.filename}` : null,
        quiz_id,
      });
      return res.json(question);
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Ошибка при создании вопроса"));
    }
  }

  async getQuestionsByQuizId(req, res, next) {
    try {
      const { quiz_id } = req.params;

      if (!quiz_id) {
        return next(ApiError.badRequest("ID викторины обязателен"));
      }

      const questions = await Question.findAll({
        where: { quiz_id },
        include: [Answer], 
      });

      return res.json(questions);
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Ошибка при получении вопросов"));
    }
  }

  async getQuestionById(req, res, next) {
    try {
      const { question_id } = req.params;

      if (!question_id) {
        return next(ApiError.badRequest("ID вопроса обязателен"));
      }

      const question = await Question.findByPk(question_id, {
        include: [Answer] 
      });

      if (!question) {
        return next(ApiError.notFound("Вопрос не найден"));
      }

      return res.json(question);
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Ошибка при получении вопроса"));
    }
  }

  async updateQuestion(req, res, next) {
  try {
    const { quiz_id, question_id } = req.params;
    const { text } = req.body;

    const question = await Question.findOne({ where: { question_id, quiz_id } });

    if (!question) {
      return next(ApiError.notFound("Вопрос не найден или не принадлежит викторине"));
    }

    question.text = text || question.text;

    if (req.files && req.files.length > 0) {
      const file = req.files[0]; 
      question.media_url = `/uploads/${file.filename}`;
    }

    await question.save();

    return res.json(question);
  } catch (e) {
    console.error(e);
    return next(ApiError.internal("Ошибка при обновлении вопроса"));
  }
}

  async deleteQuestion(req, res, next) {
    try {
      const { question_id } = req.params;

      const question = await Question.findByPk(question_id);

      if (!question) {
        return next(ApiError.notFound("Вопрос не найден"));
      }

      await question.destroy();

      return res.json({ message: "Вопрос успешно удален" });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Ошибка при удалении вопроса"));
    }
  }
}

module.exports = new QuestionController();