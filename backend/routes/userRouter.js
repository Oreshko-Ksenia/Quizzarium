const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatar'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });


router.post('/register',  upload.single('avatar'), userController.registration);
router.post('/login', userController.login);
router.get('/auth', authMiddleware, userController.check);
router.post('/change-password', authMiddleware, userController.changePassword);
router.put('/:user_id/avatar', authMiddleware, upload.single('avatar'), userController.updateAvatar);
router.put('/:user_id/role', checkRoleMiddleware(['ADMIN']), userController.changeRole);
router.put('/:user_id/block', checkRoleMiddleware(['ADMIN']), userController.blockUser);
router.get('/users', checkRoleMiddleware(['ADMIN']), userController.getAllUsers);
router.get('/:user_id', checkRoleMiddleware(['ADMIN', 'CLIENT']), userController.getUserById);
router.delete('/delete/:user_id', checkRoleMiddleware(['ADMIN']), userController.deleteUser);


module.exports = router;