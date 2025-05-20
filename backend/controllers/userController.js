const { User, SupportTicket, Result, Quiz } = require('../models/models');
const ApiError = require('../error/ApiError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


class UserController {
    async registration(req, res, next) {
        try {
          const { email, password, role = "CLIENT" } = req.body;
          if (!email || !password) {
            return next(ApiError.badRequest('Требуются email и пароль'));
          }
      
          const candidate = await User.findOne({ where: { email } });
          if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'));
          }
      
          const hashPassword = await bcrypt.hash(password, 5);
          
          let avatarPath = null;
          if (req.file) {
            avatarPath = `/uploads/avatars/${req.file.filename}`;
          }
      
          const user = await User.create({
            email,
            password_hash: hashPassword,
            role,
            avatar: avatarPath
          });
      
          const token = jwt.sign(
            {
              user_id: user.user_id,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              blocked: user.blocked || false
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
          );
      
          return res.json({
            user: {
              user_id: user.user_id,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              blocked: user.blocked
            },
            token
          });
      
        } catch (e) {
          next(ApiError.internal(e.message));
        }
      }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                return next(ApiError.badRequest('Требуются email и пароль'));
            }
    
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }
    
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return next(ApiError.badRequest('Неверный пароль'));
            }
    
            if (user.blocked) {
                return next(ApiError.forbidden('Ваш аккаунт заблокирован'));
            }
    
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    email: user.email, 
                    role: user.role,
                    avatar: user.avatar,
                    blocked: user.blocked 
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );
    
            return res.json({ token });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    async check(req, res, next) {
        try {
            const user = await User.findByPk(req.user.user_id);
            if (!user) {
                return next(ApiError.unauthorized('Пользователь не найден'));
            }
    
            if (user.blocked) {
                return next(ApiError.forbidden('Ваш аккаунт заблокирован'));
            }
    
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    email: user.email, 
                    role: user.role,
                    avatar: user.avatar,
                    blocked: user.blocked
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );
    
            return res.json({ token });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    async changeRole(req, res, next) {
        try {
            const { user_id } = req.params;
            const { role } = req.body;

            if (!role) {
                return next(ApiError.badRequest('Роль обязательна'));
            }

            const user = await User.findByPk(user_id);
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }

            user.role = role;
            await user.save();

            return res.json({ message: 'Роль успешно обновлена', user });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    async blockUser(req, res, next) {
        try {
            const { user_id } = req.params;
            const { blocked } = req.body;

            if (blocked === undefined) {
                return next(ApiError.badRequest('Статус блокировки обязателен'));
            }

            const user = await User.findByPk(user_id);
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }

            user.blocked = !!blocked;
            await user.save();

            return res.json({ message: 'Пользователь успешно заблокирован/разблокирован', user });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }
    async updateAvatar(req, res, next) {
        try {
          const { user_id } = req.params;
          if (!req.file) {
            return next(ApiError.badRequest('Файл аватара обязателен'));
          }
      
          const avatarPath = `/uploads/avatar/${req.file.filename}`; 
          const user = await User.findByPk(user_id);
      
          if (!user) {
            return next(ApiError.badRequest('Пользователь не найден'));
          }
      
          user.avatar = avatarPath;
          await user.save();
      
          return res.json({
            message: 'Аватар успешно обновлён',
            user: {
              user_id: user.user_id,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
            },
          });
        } catch (e) {
          next(ApiError.internal(e.message));
        }
      }

      async changePassword(req, res, next) {
        try {
          const { id } = req.query; 
          const newPassword = req.body.newPassword;
      
          const currentUserId = req.user.id;
          const currentUserRole = req.user.role;
      
          const targetUserId = id ? parseInt(id) : currentUserId;
      
          if (currentUserRole !== "ADMIN" && currentUserId !== targetUserId) {
            return next(ApiError.forbidden("Недостаточно прав для изменения пароля"));
          }
      
          const user = await User.findByPk(targetUserId);
          if (!user) return next(ApiError.badRequest("Пользователь не найден"));
      
          const hash = await bcrypt.hash(newPassword, 5);
          await user.update({ password_hash: hash });
      
          return res.json({ message: "Пароль успешно изменён" });
        } catch (e) {
          next(ApiError.internal(e.message));
        }
      }

    async getAllUsers(req, res, next) {
        try {
          const users = await User.findAll({
            attributes: ['user_id', 'email', 'role', 'blocked'] 
          });
          return res.json(users);
        } catch (e) {
          next(ApiError.internal(e.message));
        }
      }

      async getUserById(req, res, next) {
        try {
          const { user_id } = req.params;

          if (!user_id || isNaN(Number(user_id))) {
            return next(ApiError.badRequest("Неверный формат ID пользователя"));
          }

          const user = await User.findByPk(user_id, {
            attributes: ['user_id', 'email', 'role', 'avatar', 'blocked']
          });

          if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
          }

          return res.json({ user });
        } catch (e) {
          next(ApiError.internal(e.message));
        }
      }

    async deleteUser(req, res, next) {
      try {
        const { user_id } = req.params;

        if (req.user.id === Number(user_id)) {
          return next(ApiError.badRequest("Нельзя удалить самого себя"));
        }

        const user = await User.findByPk(user_id);
        if (!user) {
          return next(ApiError.notFound("Пользователь не найден"));
        }

        await SupportTicket.destroy({ where: { user_id } });
        await Result.destroy({ where: { user_id } });
        await Quiz.destroy({ where: { user_id } });

        await user.destroy();

        return res.json({ message: "Пользователь и его данные успешно удалены" });
      } catch (e) {
        console.error(e); 
        return next(ApiError.internal(e.message));
      }
    }
}

module.exports = new UserController();
