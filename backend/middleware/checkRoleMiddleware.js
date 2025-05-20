const jwt = require('jsonwebtoken');


module.exports = function(requiredRoles) {
  return function(req, res, next) {
    if (req.method === "OPTIONS") {
      return next();
    }

    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      req.user = {
        id: decoded.user_id || decoded.id,
        role: decoded.role ? decoded.role.toUpperCase() : null
      };

      const userRole = req.user.role;

      console.log("Декодированный токен:", decoded);
      console.log("Роль пользователя:", userRole);
      console.log("Требуемые роли:", requiredRoles);

      if (!requiredRoles) {
        return next();
      }

      if (!userRole || !requiredRoles.map(r => r.toUpperCase()).includes(userRole)) {
        return res.status(403).json({
          message: "Нет доступа",
          requiredRoles,
          userRole
        });
      }

      next();
    } catch (e) {
      console.error("Ошибка при проверке прав:", e.message);
      return res.status(401).json({ message: "Не авторизован" });
    }
  };
};