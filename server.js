const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./server/db');   // ← импорт из server/

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'time-to-actions-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js_client', express.static(path.join(__dirname, 'js_client')));
app.use('/html', express.static(path.join(__dirname, 'html')));

app.get('/', (req, res) => res.redirect('/html/auto.html'));

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        if (!username || !email || !phone || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль минимум 8 символов' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Некорректный email' });
        }

        if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase())) {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
        }
        if (db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim())) {
            return res.status(409).json({ error: 'Имя уже занято' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = db.prepare(`
            INSERT INTO users (username, email, phone, password_hash)
            VALUES (?, ?, ?, ?)
        `).run(username.trim(), email.trim().toLowerCase(), phone.trim(), passwordHash);

        req.session.userId = result.lastInsertRowid;

        return res.status(201).json({
            message: 'Регистрация успешна',
            user: { id: result.lastInsertRowid, username, email }
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?')
            .get(email.trim().toLowerCase());
        if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

        req.session.userId = user.id;
        return res.json({
            message: 'Вход выполнен',
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ message: 'Выход выполнен' }));
});

app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Не авторизован' });
    const user = db.prepare('SELECT id, username, email, phone, avatar FROM users WHERE id = ?')
        .get(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});