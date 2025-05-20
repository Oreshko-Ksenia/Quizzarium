require('dotenv').config();
const express = require('express');
const http = require('http');
const sequelize = require('./db');
const cors = require('cors');
const models = require('./models/models');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandingMiddleware');
const path = require('path'); 

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());
app.use(express.json());
app.use('/api', router);

const server = http.createServer(app);


app.use(errorHandler);

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        server.listen(PORT, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log(`Сервер запущен на порту ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
};



start();