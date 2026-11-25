document.addEventListener('DOMContentLoaded', () => {
    const { Validators, setFieldState, showModal, api } = window.App;
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const fields = {
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        password: document.getElementById('password')
    };

    const validate = (name) => setFieldState(fields[name], Validators[name](fields[name].value));

    Object.keys(fields).forEach(name => {
        fields[name].addEventListener('input', () => validate(name));
        fields[name].addEventListener('blur', () => validate(name));
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!Object.keys(fields).every(validate)) return showModal('Исправьте ошибки', true);

        try {
            await api('/api/register', 'POST', {
                username: fields.username.value, email: fields.email.value,
                phone: fields.phone.value, password: fields.password.value
            });
            showModal('Вы вошли! Перенаправляем в личный кабинет...');
            setTimeout(() => window.location.href = '/html/account.html', 1500);
        } catch (err) { showModal(err.message, true); }
    });
});