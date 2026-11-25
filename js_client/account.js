document.addEventListener('DOMContentLoaded', async () => {
    const { Validators, showModal, api } = window.App;

    // 1. Загрузка профиля
    try {
        const user = await api('/api/me');
        document.getElementById('greetingText').textContent = `Здравствуйте, ${user.username}!`;
        document.getElementById('userName').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone;
        if (user.avatar) document.getElementById('userAvatar').src = user.avatar;
    } catch (e) { return; }

    document.getElementById('userName').addEventListener('change', async (e) => {
        const fd = new FormData();
        fd.append('username', e.target.value);
        await api('/api/profile', 'POST', fd, true);
    });

    // 2. Смена аватара профиля
    const photoBtn = document.querySelector('.photo_button');
    photoBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const fd = new FormData();
            fd.append('avatar', input.files[0]);
            await api('/api/profile', 'POST', fd, true);
            location.reload();
        };
        input.click();
    };

    // 3. Функция загрузки привычек
    async function loadHabits() {
        const habits = await api('/api/habits');
        const grid = document.getElementById('habitsGrid');
        grid.innerHTML = ''; // Очищаем контейнер

        if (habits.length === 0) {
            // Фраза, если привычек нет
            grid.innerHTML = `
                <p style="color:#D09CD0; font-size: 36px; font-weight: 700; grid-column: 1/-1; text-align:center;">
                    Привычек пока нет! Давайте создадим новые.
                </p>`;
            return;
        }

        habits.forEach(h => {
            const card = document.createElement('div');
            card.className = 'habit_card';
            card.innerHTML = `
                <div class="habit_icon" style="overflow:hidden; display:flex; justify-content:center; align-items:center;">
                    ${h.image_path ? `<img src="${h.image_path}" style="width:100%;height:100%;object-fit:cover;">` : '<span style="color:white; font-size:24px;">✔</span>'}
                </div>
                <span class="habit_name">${h.name_habit}</span>
            `;
            card.onclick = () => {
                showModal(`Вы выполнили "${h.name_habit}" сегодня?`);
                const btn = document.getElementById('modalButton');
                btn.onclick = async () => {
                    document.getElementById('modalOverlay').classList.remove('active');
                    const today = new Date().toISOString().split('T')[0];
                    await api(`/api/habits/${h.id}/check`, 'POST', { date: today, status: 'completed' });
                    showModal('Отлично! Так держать!');
                };
            };
            grid.appendChild(card);
        });
    }

    // 4. Отрисовка графиков
        // 4. Отрисовка графиков
    async function renderCharts() {
        const chartSections = document.querySelectorAll('.chart_container');
        if (chartSections.length < 2) return;
        
        chartSections.forEach(sec => sec.innerHTML = '');

        const timeCanvas = document.createElement('canvas');
        timeCanvas.id = 'timeChart';
        chartSections[1].appendChild(timeCanvas);

        const habitCanvas = document.createElement('canvas');
        habitCanvas.id = 'habitsChart';
        chartSections[0].appendChild(habitCanvas);

        // --- ГРАФИК ВРЕМЕНИ ---
        try {
            const stats = await api('/api/time/stats');
            const ctxTime = timeCanvas.getContext('2d');
            
            new Chart(ctxTime, {
                type: 'doughnut',
                data: {
                    labels: stats.length ? stats.map(s => s.name) : ['Нет данных'],
                    datasets: [{
                        // ВАЖНО: приводим к числу через Number(), убираем строки
                        data: stats.length ? stats.map(s => Number((s.seconds / 3600).toFixed(2))) : [1],
                        
                        // ВАЖНО: если цвет из базы пришел, берем его. Если нет — ставим сиреневый
                        backgroundColor: stats.length 
                            ? stats.map(s => s.color ? s.color : '#D09CD0') 
                            : ['#F1E6F6'],
                            
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#D09CD0', font: { size: 14 } } } }
                }
            });
        } catch (e) { console.error('Ошибка графика времени:', e); }

        // --- ГРАФИК ПРИВЫЧЕК ---
        const ctxHabits = habitCanvas.getContext('2d');
        new Chart(ctxHabits, {
            type: 'bar',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Выполнено',
                    data: [1, 0, 1, 1, 0, 1, 1],
                    // Чтобы график привычек был красивее, зададим массив цветов для каждого столбца
                    backgroundColor: [
                        '#D09CD0', '#EAB7EA', '#F1E6F6', '#E7CEF2', 
                        '#D09CD0', '#EAB7EA', '#F1E6F6'
                    ], 
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#D09CD0' }, grid: { color: '#F1E6F6' } },
                    x: { ticks: { color: '#D09CD0' }, grid: { display: false } }
                }
            }
        });
    }

    // 5. Модальное окно добавления привычки
    const addBtn = document.getElementById('addHabitBtn');
    const habitModal = document.getElementById('habitModal');
    const closeBtn = document.getElementById('closeHabitBtn');
    const photoBtnUpload = document.getElementById('uploadHabitPhotoBtn');
    const fileInput = document.getElementById('h_img');
    const preview = document.getElementById('habitPreview');

    addBtn.onclick = () => {
        habitModal.classList.add('active');
        preview.innerHTML = '<span class="plus_icon">+</span>';
        fileInput.value = '';
        document.getElementById('h_name').value = '';
        document.getElementById('h_time').value = '';
    };

    closeBtn.onclick = () => habitModal.classList.remove('active');
    habitModal.onclick = (e) => {
        if (e.target === habitModal) habitModal.classList.remove('active');
    };

    photoBtnUpload.onclick = () => fileInput.click();

    fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Превью">`;
            };
            reader.readAsDataURL(file);
        }
    };

        document.getElementById('saveHabit').onclick = async () => {
        const nameInput = document.getElementById('h_name');
        
        // Простая и надежная проверка
        if (!nameInput || nameInput.value.trim() === '') {
            alert('Пожалуйста, введите название привычки!');
            return;
        }

        // Блокируем кнопку, чтобы не спамили
        const saveBtn = document.getElementById('saveHabit');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Сохранение...';
        
        const fd = new FormData();
        fd.append('name', nameInput.value.trim()); // Берем значение из поля
        fd.append('color', document.getElementById('h_color').value);
        fd.append('reminder_time', document.getElementById('h_time').value);
        
        const img = fileInput.files[0];
        if (img) fd.append('image', img);

        try {
            await api('/api/habits', 'POST', fd, true);
            
            // Успех: закрываем модалку и чистим поля
            habitModal.classList.remove('active');
            nameInput.value = '';
            fileInput.value = '';
            preview.innerHTML = '<span class="plus_icon"><img src="/img/Фото_модалка.webp"></span>';
            
            loadHabits(); // Обновляем список
        } catch (e) { 
            console.error("Ошибка при сохранении:", e);
            alert('Не удалось сохранить: ' + e.message); 
        } finally {
            // Возвращаем кнопку обратно
            saveBtn.disabled = false;
            saveBtn.textContent = 'Добавить';
        }
    };
    // 6. Переход на таймер
    document.querySelector('.timer_button').onclick = () => {
        window.location.href = '/html/time.html';
    };

    // Запуск при загрузке страницы
    loadHabits();
    renderCharts();
});