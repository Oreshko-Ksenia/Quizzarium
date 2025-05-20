const sequelize = require('../db');
const {Sequelize, DataTypes } = require('sequelize');

const User = sequelize.define('user', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "CLIENT" },
    avatar: { type: DataTypes.STRING, allowNull: true },
    blocked: { type: DataTypes.BOOLEAN, defaultValue: false } 
});

const Category = sequelize.define('category', {
    category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    imageUrl: { type: DataTypes.TEXT },
    createdAt: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') },
  });
  
const Quiz = sequelize.define('quiz', {
    quiz_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.TEXT }, 
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'user_id',
        },
        onDelete: 'CASCADE',
    },
    category_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Category,
            key: 'category_id',
        },
        onDelete: 'SET NULL',
    },
});

const Question = sequelize.define('question', {
    question_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.STRING },
    media_url: { type: DataTypes.STRING },
    quiz_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Quiz,
            key: 'quiz_id',
        },
    },
});

const Answer = sequelize.define('answer', {
    answer_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.STRING },
    media_url: { type: DataTypes.STRING },
    is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },
    question_id: {
        type: DataTypes.BIGINT,
        references: {
            model: Question,
            key: 'question_id',
        },
    },
});

const Result = sequelize.define('result', {
    result_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'user_id',
    },
    onDelete: 'CASCADE'
    },
    quiz_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'quiz',
      key: 'quiz_id',
    },
    onDelete: 'CASCADE', 
    allowNull: false
     },
    correct_answers: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });


const SupportTicket = sequelize.define('SupportTicket', {
    ticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id',
        },
        onDelete: 'CASCADE', 
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'new',
    },
    replied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    response: DataTypes.TEXT 
}, {
    tableName: 'support_tickets',
    timestamps: true,
});

User.hasMany(Quiz, { foreignKey: 'user_id' });
Quiz.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Quiz, { foreignKey: 'category_id' });
Quiz.belongsTo(Category, { foreignKey: 'category_id' });

Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

User.hasMany(Result, { foreignKey: 'user_id', as: 'results' }); 
Result.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); 

Quiz.hasMany(Result, { foreignKey: 'quiz_id' });
Result.belongsTo(Quiz, { foreignKey: 'quiz_id' });

User.hasMany(SupportTicket, { foreignKey: 'user_id', as: 'tickets' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    User,
    Category,
    Quiz,
    Question,
    Answer,
    Result,
    SupportTicket,
};