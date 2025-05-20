require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { SupportTicket, User } = require('../models/models');

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не задан в .env');

const adminId = parseInt(process.env.ADMIN_ID);
if (!adminId) throw new Error('ADMIN_ID не задан в .env');

const bot = new TelegramBot(token, { polling: true });

const adminStates = {};
const userStates = {};

function getLocalizedStatus(status) {
    switch (status) {
        case 'new':
            return '🟡 На рассмотрении';
        case 'answered':
            return '✅ Отвечено';
        default:
            return status;
    }
}

function getStartKeyboard() {
    return {
        reply_markup: {
            keyboard: [[{ text: 'Начать' }]],
            resize_keyboard: true,
            one_time_keyboard: false,
            input_field_placeholder: 'Нажмите «Начать», чтобы выбрать действие'
        }
    };
}

function getMainMenuKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💬 Сообщить о проблеме', callback_data: 'report_issue' }],
                [{ text: '🔍 Проверить статус', callback_data: 'check_status' }]
            ]
        }
    };
}

function getAdminMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [{ text: '📢 Посмотреть нерассмотренные обращения' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from; 
    
    if (chatId === adminId) {
        await bot.sendMessage(chatId, 'Техподдеркжа!', getAdminMenuKeyboard());
        return;
    }

    const existingUser = await User.findOne({ where: { user_id: chatId } });
    const hasStarted = existingUser?.hasStarted || false;

    if (!existingUser) {
        await User.create({
            user_id: chatId,
            email: `${chatId}@guest.local`,
            password_hash: 'no_password',
            role: 'GUEST',
            hasStarted: true
        });
    }

    if (!hasStarted) {
        await bot.sendMessage(
    chatId,
    `👋 Добро пожаловать, ${from.first_name}!\n\n🤖 Мы — техподдержка Quizzarium.\n\nГотовы помочь вам с любыми вопросами и проблемами. Нажмите «Начать», чтобы выбрать действие.`,
    getStartKeyboard());
    } else {
        await bot.sendMessage(chatId, 'Выберите действие:', getMainMenuKeyboard());
    }
});

bot.onText(/\/tickets/, async (msg) => {
    showNewTickets(msg.chat.id);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from;
    const text = msg.text;

    if (from.is_bot) return;

    if (chatId === adminId) {
        const state = adminStates[chatId];

        if (state?.mode === 'awaiting_reply') {
            const ticketId = state.ticket_id;
            const ticket = await SupportTicket.findByPk(ticketId);

            if (!ticket) {
                await bot.sendMessage(chatId, 'Обращение не найдено.');
                delete adminStates[chatId];
                return;
            }

            try {
                await bot.sendMessage(ticket.user_id, `📩 Ответ от поддержки:\n\n${text}`);
                await ticket.update({ status: 'answered', response: text });
                await bot.sendMessage(chatId, `✅ Ответ отправлен пользователю (№ ${ticketId}).`);
            } catch (err) {
                console.error('Ошибка при отправке ответа:', err.message);
                await bot.sendMessage(chatId, '❌ Не удалось отправить ответ пользователю.');
            }

            delete adminStates[chatId];
            return;
        }

        if (text === '📢 Посмотреть нерассмотренные обращения') {
            showNewTickets(chatId);
        }

        if (text === '🚪 Выйти из меню администратора') {
            await bot.sendMessage(chatId, 'Вы вышли из меню администратора.', getStartKeyboard());
        }

        return; 
    }

    const currentState = userStates[chatId];

    if (text === 'Начать') {
        let user = await User.findOne({ where: { user_id: chatId } });
        if (user && !user.hasStarted) {
            await user.update({ hasStarted: true });
        }

        await bot.sendMessage(chatId, 'Выберите действие:', getMainMenuKeyboard());
        return;
    }

    if (currentState === 'awaiting_issue') {
        let user = await User.findOne({ where: { user_id: from.id } }) || await User.create({
            user_id: from.id,
            email: `${from.id}@guest.local`,
            password_hash: 'no_password',
            role: 'CLIENT',
            hasStarted: true
        });

        const ticket = await SupportTicket.create({
            user_id: from.id,
            username: from.username,
            message: text,
            status: 'new'
        });

        await bot.sendMessage(chatId, 'Спасибо за обращение! Мы ответим вам в ближайшее время.');
        await bot.sendMessage(adminId, `🔔 Новое обращение от @${from.username || 'no_username'} (ID: ${from.id}):\n\n${text}`);

        delete userStates[chatId];
        return;
    }

    const dbUser = await User.findOne({ where: { user_id: chatId } });
    if (dbUser?.hasStarted && !currentState && text !== 'Начать') {
        await bot.sendMessage(chatId, 'Выберите действие:', getMainMenuKeyboard());
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (chatId === adminId) {
        if (data.startsWith('reply_')) {
            const ticketId = parseInt(data.split('_')[1]);
            adminStates[chatId] = { mode: 'awaiting_reply', ticket_id: ticketId };
            await bot.sendMessage(chatId, `Введите ответ для обращения № ${ticketId}:`);
        }
    }

    if (chatId !== adminId) {
        if (data === 'report_issue') {
            userStates[chatId] = 'awaiting_issue';
            await bot.sendMessage(chatId, 'Опишите вашу проблему — мы обязательно поможем!');
        }

        if (data === 'check_status') {
    const tickets = await SupportTicket.findAll({
        where: { user_id: chatId },
        order: [['createdAt', 'DESC']]
    });

    if (!tickets.length) {
        await bot.sendMessage(chatId, 'Вы ещё не отправляли обращений.');
        return;
    }

    let response = 'Ваши обращения:\n\n';

    tickets.forEach(t => {
        const localizedStatus = getLocalizedStatus(t.status);
        response += `№ ${t.ticket_id}\nСообщение: ${t.message}\nСтатус: ${localizedStatus}`;

        if (t.response) {
            response += `\n\n📩 Ответ поддержки:\n${t.response}`;
        }

        response += '\n\n';
    });

    await bot.sendMessage(chatId, response);
    userStates[chatId] = 'awaiting_ticket_id';
}
    }

    await bot.answerCallbackQuery(query.id);
});

async function showNewTickets(chatId) {
    try {
        const tickets = await SupportTicket.findAll({
            where: { status: 'new' },
            order: [['createdAt', 'DESC']]
        });

        if (!tickets.length) {
            await bot.sendMessage(chatId, 'Нет нерассмотренных обращений.');
            return;
        }

        let response = "🔔 Все нерассмотренные обращения:\n\n";

        tickets.forEach(t => {
            const localizedStatus = getLocalizedStatus(t.status);
            response += `№ ${t.ticket_id}\nПользователь: @${t.username || 'не указан'}\nСообщение: ${t.message}\n\n`;
        });

        await bot.sendMessage(chatId, response);

        const replyButtons = tickets.map(ticket => [{
            text: `Ответить №${ticket.ticket_id}`,
            callback_data: `reply_${ticket.ticket_id}`
        }]);

        await bot.sendMessage(chatId, 'Выберите обращение для ответа:', {
            reply_markup: {
                inline_keyboard: replyButtons
            }
        });

    } catch (err) {
        console.error('Ошибка при выводе обращений:', err.message);
        await bot.sendMessage(chatId, 'Не удалось загрузить обращения.');
    }
}