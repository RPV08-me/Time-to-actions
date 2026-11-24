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

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push не поддерживается');
        return;
    }

    // 1. Регистрируем Service Worker (этот файл нужно создать)
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // 2. Спрашиваем разрешение
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert('Вы отклонили уведомления');
        return;
    }

    // 3. Подписываемся
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('ВАШ_PUBLIC_KEY') // Тот же, что на сервере
    });

    // 4. Отправляем подписку на сервер
    await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });
    
    console.log('Подписка на уведомления оформлена!');
}