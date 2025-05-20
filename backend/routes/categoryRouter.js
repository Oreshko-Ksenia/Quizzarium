const categoryController = require('../controllers/categoryController');
const Router = require('express');
const router = new Router();
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const multer = require('multer');
const mime = require('mime-types');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = mime.extension(file.mimetype);
      cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
    },
  });

  const upload = multer({ storage: storage });

router.post('/', checkRoleMiddleware(['ADMIN']), upload.single('image'), categoryController.createCategory);
router.get('/', categoryController.getAllCategory);
router.get('/:category_id', categoryController.getQuizzesByCategory);
router.put('/:category_id', checkRoleMiddleware(['ADMIN']), upload.single("image"), categoryController.updateCategory);
router.delete('/:category_id', checkRoleMiddleware(['ADMIN']), categoryController.deleteCategory.bind(categoryController));

module.exports = router;