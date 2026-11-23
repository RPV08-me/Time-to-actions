const Validators = {
    username: (v) => v.trim().length >= 2 ? null : 'Минимум 2 символа',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Некорректный email',
    phone: (v) => /^\+?[0-9\s\-()]{10,18}$/.test(v) ? null : 'Некорректный телефон',
    password: (v) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) ? null : 'Пароль: 8+ символов, заглавная, цифра',
    name: (v) => v.trim().length >= 2 ? null : 'Введите название'
};

function setFieldState(input, errorMessage) {
    const group = input.closest('.input_group');
    if (errorMessage) {
        group.classList.add('invalid'); group.classList.remove('valid');
        group.querySelector('.error_message').textContent = errorMessage;
        return false;
    }
    group.classList.remove('invalid'); group.classList.add('valid');
    group.querySelector('.error_message').textContent = '';
    return true;
}

function showModal(message, isError = false) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return alert(message);
    document.getElementById('modalMessage').textContent = message;
    overlay.classList.toggle('error', isError);
    overlay.classList.add('active');
    document.getElementById('modalButton').onclick = () => overlay.classList.remove('active');
}

async function api(url, method = 'GET', data = null, isForm = false) {
    const options = { method, credentials: 'same-origin' };
    if (data) {
        if (isForm) options.body = data; // FormData
        else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        }
    }
    const res = await fetch(url, options);
    if (res.status === 401) { window.location.href = '/html/auto.html'; return; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Ошибка');
    return json;
}

window.App = { Validators, setFieldState, showModal, api };