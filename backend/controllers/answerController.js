const { Answer } = require('../models/models');
const ApiError = require('../error/ApiError');

class AnswerController {
    async addAnswer(req, res, next) {
        try {
            const { quiz_id, question_id } = req.params;
            const { text, is_correct } = req.body;
            const media_url = req.file ? `/uploads/${req.file.filename}` : null;
        
            const answer = await Answer.create({
              text,
              is_correct,
              media_url,
              question_id
            });
        
            return res.json(answer);
          } catch (e) {
            console.error('Ошибка создания ответа:', e.message);
            return next(ApiError.internal('Не удалось создать ответ'));
          }
      }

    async getAnswersByQuestion(req, res, next) {
        try {
            const { question_id } = req.params;

            if (!question_id) {
                return next(ApiError.badRequest('ID вопроса не указан'));
            }

            const answers = await Answer.findAll({
                where: { question_id },
            });

            return res.json(answers);
        } catch (e) {
            return next(ApiError.internal('Ошибка при получении ответов'));
        }
    }

   async updateAnswer(req, res, next) {
  try {
    const { answer_id } = req.params;
    const { text, is_correct } = req.body;

    if (!answer_id) {
      return next(ApiError.badRequest('ID ответа не указан'));
    }

    const answer = await Answer.findByPk(answer_id, {
      include: [{ model: Question, attributes: ['user_id'] }]
    });

    if (!answer) {
      return next(ApiError.notFound('Ответ не найден'));
    }

    const questionOwnerId = answer.Question.user_id;
    const { id: user_id, role } = req.user;

    if (questionOwnerId !== user_id && role !== 'ADMIN') {
      return next(ApiError.forbidden('Нет прав на обновление этого ответа'));
    }

    answer.text = text || answer.text;
    answer.is_correct = Boolean(is_correct); 

    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      answer.media_url = `/uploads/${file.filename}`;
    }

    await answer.save();

    return res.json(answer);
  } catch (e) {
    console.error(e);
    return next(ApiError.internal('Ошибка при обновлении ответа'));
  }
}

    async deleteAnswer(req, res, next) {
        try {
            const { answer_id } = req.params;

            if (!answer_id) {
                return next(ApiError.badRequest('ID ответа не указан'));
            }

            const answer = await Answer.findByPk(answer_id, {
                include: [{ model: Question, attributes: ['user_id'] }],
            });

            if (!answer) {
                return next(ApiError.notFound('Ответ не найден'));
            }

            const questionOwnerId = answer.Question.user_id;
            const { id: user_id, role } = req.user;

            if (questionOwnerId !== user_id && role !== 'ADMIN') {
                return next(ApiError.forbidden('Нет прав на удаление этого ответа'));
            }

            await answer.destroy();

            return res.json({ message: 'Ответ успешно удален' });
        } catch (e) {
            return next(ApiError.internal('Ошибка при удалении ответа'));
        }
    }
}

module.exports = new AnswerController();