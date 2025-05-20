const { Quiz, Question, Answer, User, Result  } = require('../models/models');
const ApiError = require('../error/ApiError');
const { Sequelize } = require('sequelize'); 
const path = require('path');
const fs = require('fs');

class QuizController {
async  createQuiz(req, res, next) {
  const transaction = await Quiz.sequelize.transaction();
  try {
    const { title, description, category_id } = req.body;
    const user_id = req.body.user_id ? parseInt(req.body.user_id, 10) : req.user.id;

    if (req.body.user_id && req.user.role !== "ADMIN" && req.user.id !== user_id) {
      return next(ApiError.forbidden("Недостаточно прав для создания викторины от имени другого пользователя"));
    }

    let image_url = null;
    const quizImageFile = req.files?.find(f => f.fieldname === 'image');
    if (quizImageFile) {
      image_url = `/uploads/${quizImageFile.filename}`;
    }

    // Генерация нового quiz_id (если не автоинкремент)
    const existingQuizzes = await Quiz.findAll({ attributes: ['quiz_id'], transaction });
    let new_quiz_id = 1;
    while (existingQuizzes.some(q => q.quiz_id === new_quiz_id)) {
      new_quiz_id++;
    }

    const quiz = await Quiz.create(
      {
        quiz_id: new_quiz_id,
        title,
        description,
        category_id,
        user_id,
        image_url,
      },
      { transaction }
    );

    if (!req.body.questions) {
      await transaction.commit();
      return res.json(quiz);
    }

    const questionsData = JSON.parse(req.body.questions);

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];

      // Получаем медиафайл вопроса
      const questionMediaField = `question_media_${i}`;
      const questionMediaFile = req.files?.find(f => f.fieldname === questionMediaField);
      let question_media_url = questionMediaFile ? `/uploads/${questionMediaFile.filename}` : null;

      const question = await Question.create(
        {
          text: q.text,
          media_url: question_media_url,
          quiz_id: quiz.quiz_id,
        },
        { transaction }
      );

      if (q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
        for (let j = 0; j < q.answers.length; j++) {
          const ans = q.answers[j];

          const answerMediaField = `answer_media_${i}_${j}`;
          const answerMediaFile = req.files?.find(f => f.fieldname === answerMediaField);
          let answer_media_url = answerMediaFile ? `/uploads/${answerMediaFile.filename}` : null;

          await Answer.create(
            {
              text: ans.text,
              is_correct: ans.is_correct,
              media_url: answer_media_url,
              question_id: question.question_id,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    const createdQuiz = await Quiz.findByPk(quiz.quiz_id, {
      include: [{ model: Question, include: [Answer] }]
    });

    return res.status(201).json(createdQuiz);

  } catch (e) {
    await transaction.rollback();
    console.error("Ошибка при создании викторины:", e.message, e.stack);
    return next(ApiError.internal(`Не удалось создать викторину: ${e.message}`));
  }
}

  async getAllQuizzes(req, res, next) {
    try {
      const quizzes = await Quiz.findAll({
        include: [
          {
            model: Question,
            include: [Answer],
          },
        ],
      });
      return res.json(quizzes);
    } catch (e) {
      console.error(e);
      return next(ApiError.internal('Ошибка при получении викторин'));
    }
  }

  async getQuizById(req, res, next) {
    try {
      const { quiz_id } = req.params;
      if (!quiz_id) {
        return next(ApiError.badRequest('ID викторины не указан'));
      }

      const quiz = await Quiz.findByPk(quiz_id, {
        include: [
          {
            model: Question,
            include: [Answer],
          },
        ],
      });

      if (!quiz) {
        return next(ApiError.notFound('Викторина не найдена'));
      }

      return res.json(quiz);
    } catch (e) {
      console.error(e);
      return next(ApiError.internal('Ошибка при получении викторины'));
    }
  }

async updateQuiz(req, res, next) {
  const transaction = await Quiz.sequelize.transaction();
  try {
    const { quiz_id } = req.params;

    console.log("req.body.deleted_questions:", req.body.deleted_questions);
    console.log("typeof deleted_questions:", typeof req.body.deleted_questions);

    const { title, description, category_id, questions } = req.body;

    let parsedQuestions = [];
    if (typeof questions === 'string') {
      parsedQuestions = JSON.parse(questions);
    } else {
      throw new Error("Поле 'questions' должно быть JSON-строкой");
    }

    const quiz = await Quiz.findByPk(quiz_id, {
      include: [{ model: Question, include: [Answer] }],
      transaction,
    });

    if (!quiz) {
      return next(ApiError.notFound('Викторина не найдена'));
    }

    let deletedIds = [];

    if (req.body.deleted_questions) {
      try {
        deletedIds = typeof req.body.deleted_questions === 'string'
          ? JSON.parse(req.body.deleted_questions)
          : req.body.deleted_questions;
      } catch (e) {
        console.error("Ошибка парсинга deleted_questions:", e.message);
        deletedIds = [];
      }
    }

    console.log("ID для удаления:", deletedIds);

    if (Array.isArray(deletedIds) && deletedIds.length > 0) {
      const deletedCount = await Question.destroy({
        where: {
          question_id: deletedIds,
          quiz_id: quiz.quiz_id,
        },
        transaction,
      });

    }

    const imageField = req.files?.find(file => file.fieldname === 'image');
    const deleteImageFlag = req.body.delete_image === 'true';

    if (imageField) {
      const oldImagePath = quiz.image_url
        ? path.resolve(__dirname, '..', '..', 'uploads', quiz.image_url.replace('/uploads/', ''))
        : null;

      if (oldImagePath && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      quiz.image_url = `/uploads/${imageField.filename}`;
    } else if (deleteImageFlag) {
      const oldImagePath = quiz.image_url
        ? path.resolve(__dirname, '..', '..', 'uploads', quiz.image_url.replace('/uploads/', ''))
        : null;

      if (oldImagePath && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      quiz.image_url = null;
    }

    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.category_id = category_id || quiz.category_id;
    await quiz.save({ transaction });

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      let existingQuestion = quiz.questions.find(qs => qs.question_id === q.question_id);

      if (!existingQuestion && q.question_id < 0) {
        existingQuestion = await Question.create(
          {
            text: q.text,
            media_url: null,
            quiz_id: quiz.quiz_id,
          },
          { transaction }
        );
      }

      if (existingQuestion) {
        existingQuestion.text = q.text || existingQuestion.text;

        const questionMediaKey = `questionMedia[${i}]`;
        const questionFile = req.files?.find(file => file.fieldname === questionMediaKey);

        if (questionFile) {
          const oldFilePath = existingQuestion.media_url
            ? path.resolve(__dirname, '..', '..', 'uploads', existingQuestion.media_url.replace('/uploads/', ''))
            : null;

          if (oldFilePath && fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }

          existingQuestion.media_url = `/uploads/${questionFile.filename}`;
        } else if (q.delete_media === true || q.media_url === null) {
          const oldFilePath = existingQuestion.media_url
            ? path.resolve(__dirname, '..', '..', 'uploads', existingQuestion.media_url.replace('/uploads/', ''))
            : null;

          if (oldFilePath && fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }

          existingQuestion.media_url = null;
        } else {
          existingQuestion.media_url = q.media_url || existingQuestion.media_url;
        }

        await existingQuestion.save({ transaction });

        await Answer.destroy({
          where: { question_id: existingQuestion.question_id },
          transaction,
        });

        for (let j = 0; j < q.answers.length; j++) {
          const ans = q.answers[j];
          const answer = await Answer.create(
            {
              text: ans.text || 'Новый ответ',
              is_correct: Boolean(ans.is_correct),
              question_id: existingQuestion.question_id,
            },
            { transaction }
          );

          const answerMediaKey = `answerMedia[${i}][${j}]`;
          const answerFile = req.files?.find(file => file.fieldname === answerMediaKey);

          if (answerFile) {
            answer.media_url = `/uploads/${answerFile.filename}`;
          } else if (ans.delete_media === true || ans.media_url === null) {
            const oldFilePath = answer.media_url
              ? path.resolve(__dirname, '..', '..', 'uploads', answer.media_url.replace('/uploads/', ''))
              : null;

            if (oldFilePath && fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }

            answer.media_url = null;
          } else {
            answer.media_url = ans.media_url || answer.media_url;
          }

          await answer.save({ transaction });
        }
      }
    }

    await transaction.commit();
    return res.json({ message: "Викторина успешно обновлена" });
  } catch (e) {
    console.error("Серверная ошибка:", e.message);
    console.error("Stack trace:", e.stack);
    if (!transaction.finished) await transaction.rollback();
    return next(ApiError.internal('Ошибка при обновлении викторины: ' + e.message));
  }
}

async renumberQuizzes(transaction) {
  const quizzes = await Quiz.findAll({
    order: [['quiz_id', 'ASC']],
    transaction,
  });

  for (let i = 0; i < quizzes.length; i++) {
    const newId = i + 1;
    if (quizzes[i].quiz_id !== newId) {
      await quizzes[i].update({ quiz_id: newId }, { transaction });
    }
  }

  console.log("ID викторин переназначены");
}

  async deleteQuiz(req, res, next) {
    const transaction = await Quiz.sequelize.transaction();
    try {
      const { quiz_id } = req.params;
  
      if (!quiz_id) {
        return next(ApiError.badRequest('ID викторины не указан'));
      }
  
      const quiz = await Quiz.findByPk(quiz_id, { transaction });
  
      if (!quiz) {
        return next(ApiError.notFound('Викторина не найдена'));
      }
  
      await quiz.destroy({ transaction });
  
      await this.renumberQuizzes(transaction);
  
      await transaction.commit();
  
      return res.json({ message: 'Викторина успешно удалена и ID обновлены' });
  
    } catch (e) {
      if (transaction.finished !== 'commit') {
        await transaction.rollback();
      }
  
      console.error("Ошибка при удалении викторины:", e.message);
      return next(ApiError.internal('Ошибка при удалении викторины'));
    }
  }

async getUserQuizzes(req, res, next) {
  try {
    const { user_id } = req.params;

    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (!requesterId) {
      return next(ApiError.unauthorized("Пользователь не авторизован"));
    }

    if (requesterRole !== "ADMIN" && requesterId !== parseInt(user_id)) {
      return next(ApiError.forbidden("Нет прав для просмотра чужих викторин"));
    }

    const quizzes = await Quiz.findAll({ where: { user_id } });
    return res.json(quizzes);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
}

async submitQuizResult(req, res, next) {
  const { quiz_id } = req.params;
  const { correct_answers, total_questions } = req.body;
  const user_id = req.user.id; 

  console.log("Получены данные:", { correct_answers, total_questions });

  if (!Number.isInteger(correct_answers) || !Number.isInteger(total_questions)) {
    return res.status(400).json({ message: "Недостающие данные" });
  }

  try {
    const score = Math.round((correct_answers / total_questions) * 100);

    await Result.create({
      quiz_id,
      user_id,
      correct_answers,
      total_questions,
      score
    });

    res.json({ message: "Результат успешно сохранён" });
  } catch (e) {
    console.error("Ошибка сохранения:", e.message);
    next(ApiError.internal("Не удалось сохранить результат"));
  }
}

async getResultsByQuizId(req, res, next) {
  const { quiz_id } = req.params;

  console.log("Получаем результаты для викторины:", quiz_id);

  try {
    const quiz = await Quiz.findByPk(quiz_id, {
      attributes: ['title'],
    });

    if (!quiz) {
      return next(ApiError.notFound('Викторина не найдена'));
    }

    const results = await Result.findAll({
      where: { quiz_id },
      include: [{
        model: User,
        attributes: ['email', 'user_id'],
        as: 'user'
      }],
      raw: true,
      nest: true
    });

    const formattedLeaderboard = results.map(r => ({
      email: r.user?.email || 'Аноним',
      user_id: r.user?.user_id || null,
      correct_answers: r.correct_answers ?? 0,
      total_questions: r.total_questions ?? 0,
      score: r.score ?? 0,
      completed_at: r.completed_at
    }));

    return res.json({
      title: quiz.title,
      leaderboard: formattedLeaderboard
    });
  } catch (e) {
    console.error("Ошибка получения результатов:", e.message);
    return next(ApiError.internal("Не удалось загрузить результаты"));
  }
}
}

module.exports = new QuizController();