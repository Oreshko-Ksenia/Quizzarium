const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  process.env.PG_DB || 'QuizDB',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '12345',
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',

    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false 
      }
    }
  }
);
