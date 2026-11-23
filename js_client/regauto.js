const Validators = {
    username(value) {
        const v = value.trim();
        if (v === '') return 'Пожалуйста, введите имя';
        if (v.length < 2) return 'Имя должно содержать минимум 2 символа';
        if (v.length > 50) return 'Имя слишком длинное';
        if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(v)) return 'Только буквы, пробел и дефис';
        return null;
    },
    email(value) {
        const v = value.trim();
        if (v === '') return 'Пожалуйста, введите почту';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Некорректный адрес почты';
        return null;
    },
    phone(value) {
        const v = value.trim();
        if (v === '') return 'Пожалуйста, введите телефон';
        if (!/^\+?[0-9\s\-()]{10,18}$/.test(v)) return 'Некорректный номер телефона';
        return null;
    },
    password(value) {
        if (value === '') return 'Пожалуйста, введите пароль';
        if (value.length < 8) return 'Минимум 8 символов';
        if (!/[A-Z]/.test(value)) return 'Нужна заглавная буква';
        if (!/[0-9]/.test(value)) return 'Нужна цифра';
        return null;
    }
};

function setFieldState(input, errorMessage) {
    const group = input.closest('.input_group');
    if (!group) return false;
    const errorEl = group.querySelector('.error_message');

    if (errorMessage) {
        group.classList.add('invalid');
        group.classList.remove('valid');
        if (errorEl) errorEl.textContent = errorMessage;
        return false;
    }
    group.classList.remove('invalid');
    group.classList.add('valid');
    if (errorEl) errorEl.textContent = '';
    return true;
}

function showModal(message, isError = false) {
    const overlay = document.getElementById('modalOverlay');
    const messageEl = document.getElementById('modalMessage');
    if (!overlay || !messageEl) { alert(message); return; }

    messageEl.textContent = message;
    overlay.classList.toggle('error', isError);
    overlay.classList.add('active');

    const close = () => overlay.classList.remove('active');
    const btn = document.getElementById('modalButton');
    if (btn) btn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

async function apiPost(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`);
    return json;
}

function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.dataset.oldText = btn.textContent;
        btn.textContent = 'Подождите…';
        btn.disabled = true;
        btn.classList.add('loading');
    } else {
        btn.textContent = btn.dataset.oldText || btn.textContent;
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}

window.App = { Validators, setFieldState, showModal, apiPost, setLoading };