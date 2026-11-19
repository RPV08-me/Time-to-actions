document.addEventListener("DOMContentLoaded", function() {

    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        reveals.forEach(reveal => observer.observe(reveal));
    }

    const regForm = document.getElementById('registrationForm');

    if (regForm) {
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const password = document.getElementById('password');

        function showError(input, message) {
            const group = input.closest('.input_group');
            group.classList.add('invalid');
            group.classList.remove('valid');
            group.querySelector('.error_message').textContent = message;
        }

        function showSuccess(input) {
            const group = input.closest('.input_group');
            group.classList.remove('invalid');
            group.classList.add('valid');
            group.querySelector('.error_message').textContent = '';
        }

        function validateUsername() {
            const value = username.value.trim();
            if (value === '') return showError(username, 'Пожалуйста, введите имя'), false;
            if (value.length < 2) return showError(username, 'Имя должно содержать минимум 2 символа'), false;
            if (value.length > 50) return showError(username, 'Имя слишком длинное'), false;
            if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(value)) return showError(username, 'Только буквы, пробел и дефис'), false;
            showSuccess(username);
            return true;
        }

        function validateEmail() {
            const value = email.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value === '') return showError(email, 'Пожалуйста, введите почту'), false;
            if (!emailRegex.test(value)) return showError(email, 'Некорректный адрес почты'), false;
            showSuccess(email);
            return true;
        }

        function validatePhone() {
            const value = phone.value.trim();
            const phoneRegex = /^\+?[0-9\s\-()]{10,18}$/;
            if (value === '') return showError(phone, 'Пожалуйста, введите телефон'), false;
            if (!phoneRegex.test(value)) return showError(phone, 'Некорректный номер телефона'), false;
            showSuccess(phone);
            return true;
        }

        function validatePassword() {
            const value = password.value;
            if (value === '') return showError(password, 'Пожалуйста, введите пароль'), false;
            if (value.length < 8) return showError(password, 'Минимум 8 символов'), false;
            if (!/[A-Z]/.test(value)) return showError(password, 'Нужна заглавная буква'), false;
            if (!/[0-9]/.test(value)) return showError(password, 'Нужна цифра'), false;
            showSuccess(password);
            return true;
        }

        [username, email, phone, password].forEach(input => {
            input.addEventListener('blur', () => {
                if (input === username) validateUsername();
                if (input === email) validateEmail();
                if (input === phone) validatePhone();
                if (input === password) validatePassword();
            });
            input.addEventListener('input', () => {
                if (input === username) validateUsername();
                if (input === email) validateEmail();
                if (input === phone) validatePhone();
                if (input === password) validatePassword();
            });
        });

        regForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const ok = validateUsername() && validateEmail() && validatePhone() && validatePassword();
            if (ok) {
    showModal('Вы успешно зарегистрированы!', false);
    regForm.reset();
    document.querySelectorAll('.input_group').forEach(g => g.classList.remove('valid'));
} else {
    showModal('Пожалуйста, исправьте ошибки в форме.', true);
    document.querySelector('.input_group.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
        });
    }

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        const email = document.getElementById('email');
        const password = document.getElementById('password');

        function showError(input, message) {
            const group = input.closest('.input_group');
            group.classList.add('invalid');
            group.classList.remove('valid');
            group.querySelector('.error_message').textContent = message;
        }

        function showSuccess(input) {
            const group = input.closest('.input_group');
            group.classList.remove('invalid');
            group.classList.add('valid');
            group.querySelector('.error_message').textContent = '';
        }

        function validateEmail() {
            const value = email.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value === '') return showError(email, 'Пожалуйста, введите почту'), false;
            if (!emailRegex.test(value)) return showError(email, 'Некорректный адрес почты'), false;
            showSuccess(email);
            return true;
        }

        function validatePassword() {
            const value = password.value;
            if (value === '') return showError(password, 'Пожалуйста, введите пароль'), false;
            if (value.length < 8) return showError(password, 'Минимум 8 символов'), false;
            showSuccess(password);
            return true;
        }

        email.addEventListener('blur', validateEmail);
        password.addEventListener('blur', validatePassword);
        email.addEventListener('input', validateEmail);
        password.addEventListener('input', validatePassword);

        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const ok = validateEmail() && validatePassword();
            if (ok) {
    showModal('Добро пожаловать!', false);
    loginForm.reset();
    document.querySelectorAll('.input_group').forEach(g => g.classList.remove('valid'));
} else {
    showModal('Пожалуйста, исправьте ошибки в форме.', true);
    document.querySelector('.input_group.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
        });
    }

    function showModal(message, isError = false) {
    const overlay = document.getElementById('modalOverlay');
    const messageEl = document.getElementById('modalMessage');

    if (!overlay) return;

    messageEl.textContent = message;

    if (isError) {
        overlay.classList.add('error');
    } else {
        overlay.classList.remove('error');
    }

    overlay.classList.add('active');

    document.getElementById('modalButton').onclick = function() {
        overlay.classList.remove('active');
    };

    overlay.onclick = function(event) {
        if (event.target === overlay) {
            overlay.classList.remove('active');
        }
    };
}

});