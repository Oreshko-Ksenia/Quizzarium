const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const questionController = require('../controllers/questionController');
const answerController = require('../controllers/answerController');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

function fileFilter(_, file, cb) {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Недопустимый тип файла'), false);
}

const upload = multer({ storage, fileFilter });

router.get('/:quiz_id/question/:question_id/answers', checkRoleMiddleware(['ADMIN','CLIENT']), answerController.getAnswersByQuestion);
router.post('/:quiz_id/question/:question_id/answer', checkRoleMiddleware(['ADMIN','CLIENT']), upload.any(), answerController.addAnswer);
router.put('/:quiz_id/question/:question_id/answer/:answer_id', checkRoleMiddleware(['ADMIN','CLIENT']), upload.any(), answerController.updateAnswer);
router.delete('/:quiz_id/question/:question_id/answer/:answer_id', checkRoleMiddleware(['ADMIN','CLIENT']), answerController.deleteAnswer);

router.post('/:quiz_id/question', checkRoleMiddleware(['ADMIN', 'CLIENT']), upload.single('media'), questionController.createQuestion);
router.get('/:quiz_id/questions', checkRoleMiddleware(['ADMIN', 'CLIENT']), questionController.getQuestionsByQuizId);
router.get('/:quiz_id/question/:question_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), questionController.getQuestionById);
router.put('/:quiz_id/question/:question_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), upload.any(), questionController.updateQuestion);
router.delete('/:quiz_id/question/:question_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), questionController.deleteQuestion);

router.get('/', quizController.getAllQuizzes);
router.get('/:quiz_id', quizController.getQuizById);
router.get('/result/:quiz_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), quizController.getResultsByQuizId);
router.post('/:quiz_id/submit',checkRoleMiddleware(['ADMIN', 'CLIENT']), quizController.submitQuizResult);
router.get('/user/:user_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), quizController.getUserQuizzes);

router.post('/', checkRoleMiddleware(['ADMIN', 'CLIENT']),upload.any(), quizController.createQuiz);
router.put('/:quiz_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), upload.any(), quizController.updateQuiz);
router.delete('/:quiz_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), quizController.deleteQuiz.bind(quizController));

module.exports = router;