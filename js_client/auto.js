document.addEventListener('DOMContentLoaded', () => {
    const { Validators, setFieldState, showModal, api } = window.App;
    const form = document.getElementById('loginForm');
    if (!form) return;

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ok1 = setFieldState(email, Validators.email(email.value));
        const ok2 = setFieldState(password, Validators.password(password.value));
        if (!ok1 || !ok2) return showModal('Исправьте ошибки', true);

        try {
            await api('/api/login', 'POST', { email: email.value, password: password.value });
            showModal('Добро пожаловать!');
            setTimeout(() => window.location.href = '/html/account.html', 1000);
        } catch (err) { showModal(err.message, true); }
    });
});