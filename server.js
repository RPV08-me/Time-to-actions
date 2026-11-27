const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const db = require('./server/db');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru', 
    port: 465,
    secure: true, 
    auth: {
        user: 'reshetilo654773@yandex.ru',
        pass: 'cmgcsobrwysqkpdw'
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Ошибка SMTP:', error);
    } else {
        console.log('SMTP-сервер готов к отправке писем');
    }
});

async function sendEmail(to, subject, text) {
    try {
        const mailOptions = {
            from: '"Время действий" <reshetilo654773@yandex.ru>',
            to: to, // Кому
            subject: subject, // Тема
            text: text, // Текст
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Письмо успешно отправлено на ${to}:`, info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Ошибка отправки письма:', error);
        return { success: false, error: error.message };
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'time-to-actions',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(__dirname));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js_client', express.static(path.join(__dirname, 'js_client')));

app.get('/', (req, res) => res.redirect('/html/main.html'));

const uploadDir = path.join(__dirname, 'img', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

function auth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Не авторизован' });
    next();
}

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        if (!username || !email || !phone || !password) return res.status(400).json({ error: 'Заполните все поля' });
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) return res.status(409).json({ error: 'Email занят' });
        if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) return res.status(409).json({ error: 'Имя занято' });

        const hash = await bcrypt.hash(password, 10);
        const result = db.prepare('INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)')
            .run(username, email.toLowerCase(), phone, hash);

        req.session.userId = result.lastInsertRowid;
        res.status(201).json({ message: 'OK' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        req.session.userId = user.id;
        res.json({ message: 'OK' });
    } catch (e) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.get('/api/me', auth, (req, res) => {
    const user = db.prepare('SELECT id, username, email, phone, avatar FROM users WHERE id = ?').get(req.session.userId);
    res.json(user);
});

app.post('/api/profile', auth, upload.single('avatar'), (req, res) => {
    try {
        const { username, phone } = req.body;
        if (username) db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.session.userId);
        if (phone) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, req.session.userId);
        if (req.file) {
            const avatarPath = '/img/uploads/' + req.file.filename;
            db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarPath, req.session.userId);
        }
        res.json({ message: 'Профиль обновлен' });
    } catch (e) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/habits', auth, (req, res) => {
    const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? AND is_active = 1').all(req.session.userId);
    res.json(habits);
});

app.post('/api/habits', auth, upload.single('image'), (req, res) => {
    try {
        const { name, reminder_time } = req.body; 
        const image_path = req.file ? '/img/uploads/' + req.file.filename : null;
        const result = db.prepare('INSERT INTO habits (name_habit, reminder_time, image_path, user_id) VALUES (?, ?, ?, ?)')
            .run(name, reminder_time, image_path, req.session.userId);
            
        res.status(201).json({ id: result.lastInsertRowid });
    } catch (e) { 
        console.error('Ошибка при создании привычки:', e);
        res.status(500).json({ error: 'Ошибка' }); 
    }
});

app.post('/api/habits/:id/check', auth, (req, res) => {
    try {
        const { date, status } = req.body;
        db.prepare('INSERT OR REPLACE INTO habit_records (habit_id, record_date, status) VALUES (?, ?, ?)')
            .run(req.params.id, date, status);
        res.json({ message: 'OK' });
    } catch (e) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/habits/stats/table', auth, (req, res) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const monday = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            const year = nextDay.getFullYear();
            const month = String(nextDay.getMonth() + 1).padStart(2, '0');
            const day = String(nextDay.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
        }

        const habits = db.prepare('SELECT id, name_habit FROM habits WHERE user_id = ? AND is_active = 1').all(req.session.userId);
        
        const tableData = habits.map(habit => {
            const completedDays = dates.map(date => {
                const record = db.prepare(`
                    SELECT id FROM habit_records 
                    WHERE habit_id = ? AND record_date = ? AND status = 'completed'
                `).get(habit.id, date);
                return !!record;
            });

            return {
                name: habit.name_habit,
                days: completedDays
            };
        });

        res.json({
            tableData: tableData,
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        });
    } catch (e) {
        console.error('Ошибка в /api/habits/stats/table:', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/time/stats', auth, (req, res) => {
    const stats = db.prepare(`
        SELECT c.name_time as name, c.color, SUM(r.actual_seconds) as seconds
        FROM time_records r
        JOIN time_categories c ON r.category_id = c.id
        WHERE r.user_id = ?
        GROUP BY c.id
    `).all(req.session.userId);
    res.json(stats);
});

app.post('/api/time', auth, (req, res) => {
    try {
        const { category_id, planned_seconds, actual_seconds, status } = req.body;
        const now = new Date().toISOString();
        db.prepare('INSERT INTO time_records (started_at, ended_at, planned_seconds, actual_seconds, status, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(now, now, planned_seconds, actual_seconds, status || 'completed', req.session.userId, category_id);
        res.json({ message: 'Записано' });
    } catch (e) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/time/categories', auth, (req, res) => {
    let cats = db.prepare('SELECT * FROM time_categories WHERE user_id = ?').all(req.session.userId);
    if (cats.length === 0) {
        const defaultCats = [
            { name: 'Учеба', color: '#D09CD0' },
            { name: 'Хобби', color: '#EAB7EA' },
            { name: 'Работа', color: '#F1E6F6' },
            { name: 'Домашние дела', color: '#E7CEF2' }
        ];
        const insert = db.prepare('INSERT INTO time_categories (name_time, color, user_id) VALUES (?, ?, ?)');
        for (const c of defaultCats) insert.run(c.name, c.color, req.session.userId);
        cats = db.prepare('SELECT * FROM time_categories WHERE user_id = ?').all(req.session.userId);
    }
    res.json(cats);
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ message: 'OK' })));

cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
        const habitsToRemind = db.prepare(`
            SELECT h.name_habit, u.email 
            FROM habits h
            JOIN users u ON h.user_id = u.id
            WHERE h.reminder_time = ? AND h.is_active = 1
        `).all(currentTime);

        if (habitsToRemind.length > 0) {
            console.log(`[${currentTime}] Найдено привычек для напоминания: ${habitsToRemind.length}`);
            
            for (const habit of habitsToRemind) {
                if (habit.email) {
                    await sendEmail(
                        habit.email, 
                        `Напоминание: ${habit.name_habit}`, 
                        `Привет! Наступило время для твоей привычки "${habit.name_habit}". Не забудь отметить её на сайте "Время действий"!`
                    );
                }
            }
        }
    } catch (e) {
        console.error('Ошибка в планировщике уведомлений:', e);
    }
}, {
    suppressMissedWarning: true
});

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));