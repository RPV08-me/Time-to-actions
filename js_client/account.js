document.addEventListener('DOMContentLoaded', () => {
    const { Validators, setFieldState, showModal, apiPost, setLoading } = window.App;
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        const fields = {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            password: document.getElementById('password')
        };

        function validateField(name) {
            const input = fields[name];
            if (!input) return true;
            return setFieldState(input, Validators[name](input.value));
        }

        Object.keys(fields).forEach(name => {
            const input = fields[name];
            if (!input) return;
            input.addEventListener('input', () => validateField(name));
            input.addEventListener('blur',  () => validateField(name));
        });

        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const ok = Object.keys(fields).every(validateField);
            if (!ok) {
                showModal('Пожалуйста, исправьте ошибки в форме.', true);
                document.querySelector('.input_group.invalid')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            const btn = document.querySelector('button[form="registrationForm"]');
            setLoading(btn, true);

            try {
                await apiPost('/api/register', {
                    username: fields.username.value.trim(),
                    email: fields.email.value.trim(),
                    phone: fields.phone.value.trim(),
                    password: fields.password.value
                });

                showModal('Вы успешно зарегистрированы! Перенаправляем…', false);
                regForm.reset();
                document.querySelectorAll('.input_group').forEach(g => {
                    g.classList.remove('valid', 'invalid');
                });

                setTimeout(() => {
                    window.location.href = '/html/auto.html';
                }, 1600);
            } catch (err) {
                showModal(err.message || 'Ошибка регистрации', true);
            } finally {
                setLoading(btn, false);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const fields = {
            email:    document.getElementById('email'),
            password: document.getElementById('password')
        };

        function validateField(name) {
            const input = fields[name];
            if (!input) return true;
            return setFieldState(input, Validators[name](input.value));
        }

        Object.keys(fields).forEach(name => {
            const input = fields[name];
            if (!input) return;
            input.addEventListener('input', () => validateField(name));
            input.addEventListener('blur',  () => validateField(name));
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const ok = Object.keys(fields).every(validateField);
            if (!ok) {
                showModal('Пожалуйста, исправьте ошибки в форме.', true);
                document.querySelector('.input_group.invalid')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            const btn = document.querySelector('button[form="loginForm"]');
            setLoading(btn, true);

            try {
                await apiPost('/api/login', {
                    email:    fields.email.value.trim(),
                    password: fields.password.value
                });

                showModal('Добро пожаловать!', false);
                loginForm.reset();
                document.querySelectorAll('.input_group').forEach(g => {
                    g.classList.remove('valid', 'invalid');
                });

                setTimeout(() => {
                    window.location.href = '/html/main.html';
                }, 1300);
            } catch (err) {
                showModal(err.message || 'Ошибка входа', true);
            } finally {
                setLoading(btn, false);
            }
        });
    }
});