const Router = require('express');
const router = new Router();
const userRouter = require('./userRouter');
const quizRouter = require('./quizRouter');
const categoryRouter = require('./categoryRouter');

router.use('/user', userRouter);
router.use('/quiz', quizRouter);
router.use('/category', categoryRouter);

module.exports = router;