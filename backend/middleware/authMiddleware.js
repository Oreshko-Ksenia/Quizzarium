const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(ApiError.unauthorized('Необходим токен'));
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(ApiError.unauthorized('Необходим токен'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;

        if (decoded.blocked) {
            return next(ApiError.forbidden('Пользователь заблокирован'));
        }

        next();
    } catch (e) {
        return next(ApiError.unauthorized('Неверный токен'));
    }
};