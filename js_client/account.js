document.addEventListener('DOMContentLoaded', async () => {
    const { Validators, showModal, api } = window.App;

    try {
        const user = await api('/api/me');
        document.getElementById('greetingText').textContent = `Здравствуйте, ${user.username}!`;
        document.getElementById('userName').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone;
        if (user.avatar) document.getElementById('userAvatar').src = user.avatar;
    } catch (e) { return; } // если 401 — редирект произошел в api()

    document.getElementById('userName').addEventListener('change', async (e) => {
        const fd = new FormData();
        fd.append('username', e.target.value);
        await api('/api/profile', 'POST', fd, true);
    });

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

    async function loadHabits() {
        const habits = await api('/api/habits');
        const grid = document.getElementById('habitsGrid');
        grid.innerHTML = '';
        if (habits.length === 0) {
            grid.innerHTML = '<p style="color:#D09CD0; grid-column: 1/-1; text-align:center;">Нет привычек. Добавьте первую!</p>';
            return;
        }
        habits.forEach(h => {
            const card = document.createElement('div');
            card.className = 'habit_card';
            card.innerHTML = `
                <div class="habit_icon" style="background:${h.color}; border-radius: 50%; overflow:hidden;">
                    ${h.image_path ? `<img src="${h.image_path}" style="width:100%;height:100%;object-fit:cover;">` : ''}
                </div>
                <span class="habit_name">${h.name_habit}</span>
            `;
            // Клик -> модалка "Выполнено?"
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

    const addBtn = document.getElementById('addHabitBtn');
    const habitModal = document.createElement('div');
    habitModal.className = 'modal_overlay';
    habitModal.id = 'habitModal';
    habitModal.innerHTML = `
        <div class="modal" style="text-align: left;">
            <h3 style="margin-bottom: 20px; color:#D09CD0;">Новая привычка</h3>
            <div class="input_group">
                <input type="text" id="h_name" class="reg_auto_input" placeholder="Название">
                <span class="error_message"></span>
            </div>
            <div class="input_group">
                <label style="color:#D09CD0; font-size:14px;">Цвет для графика:</label>
                <input type="color" id="h_color" value="#EAB7EA" style="width:100%; height:40px; border:none; border-radius:10px; cursor:pointer;">
            </div>
            <div class="input_group">
                <label style="color:#D09CD0; font-size:14px;">Время напоминания:</label>
                <input type="time" id="h_time" class="reg_auto_input">
            </div>
            <div class="input_group">
                <label style="color:#D09CD0; font-size:14px;">Фото привычки:</label>
                <input type="file" id="h_img" accept="image/*" style="font-size:14px;">
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="modal_button" id="saveHabit" style="flex:1;">Сохранить</button>
                <button class="modal_button" id="cancelHabit" style="flex:1; background:#eee; color:#D09CD0;">Отмена</button>
            </div>
        </div>
    `;
    document.body.appendChild(habitModal);

    addBtn.onclick = () => habitModal.classList.add('active');
    document.getElementById('cancelHabit').onclick = () => habitModal.classList.remove('active');

    document.getElementById('saveHabit').onclick = async () => {
        const name = document.getElementById('h_name');
        if (!Validators.name(name.value)) return alert('Введите название');
        
        const fd = new FormData();
        fd.append('name', name.value);
        fd.append('color', document.getElementById('h_color').value);
        fd.append('reminder_time', document.getElementById('h_time').value);
        const img = document.getElementById('h_img').files[0];
        if (img) fd.append('image', img);

        try {
            await api('/api/habits', 'POST', fd, true);
            habitModal.classList.remove('active');
            name.value = '';
            loadHabits();
        } catch (e) { alert(e.message); }
    };

    loadHabits();
});