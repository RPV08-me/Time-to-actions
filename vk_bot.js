const { VK } = require('vk-io');
const cron = require('node-cron');
const db = require('./server/db');

const vk = new VK({ token: '54916769' });

vk.updates.on('message_new', async (context) => {
    if (context.isOutbox) return;
    const text = context.text.toLowerCase();
    
    if (text.startsWith('связь ')) {
        const email = text.replace('связь ', '').trim();
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (user) {
            db.prepare('UPDATE users SET vk_id = ? WHERE id = ?').run(context.senderId, user.id);
            await context.send('Аккаунт привязан! Теперь я буду присылать напоминания о привычках.');
        } else {
            await context.send('Пользователь с таким email не найден.');
        }
    } else {
        await context.send('Привет! Напишите: "связь ваш_email@mail.com", чтобы привязать аккаунт.');
    }
});

cron.schedule('0 * * * *', () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const habits = db.prepare(`
        SELECT h.name_habit, u.vk_id 
        FROM habits h
        JOIN users u ON h.user_id = u.id
        WHERE h.is_active = 1 AND u.vk_id IS NOT NULL AND h.reminder_time = ?
    `).all(currentTime);

    habits.forEach(async (h) => {
        try {
            await vk.api.messages.send({
                peer_id: h.vk_id,
                message: `Напоминание: не забудьте выполнить привычку "${h.name_habit}"!`,
                random_id: Math.floor(Math.random() * 1000000)
            });
        } catch (e) { console.error(e); }
    });
});

vk.updates.start().then(() => console.log('Бот ВК запущен'));