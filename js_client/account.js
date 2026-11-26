document.addEventListener('DOMContentLoaded', async () => {
    const { Validators, showModal, api } = window.App;

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
            
            card.onclick = () => openHabitCheckModal(h);
            
            grid.appendChild(card);
        });
    }

    function openHabitCheckModal(habit) {
        const modal = document.getElementById('habitCheckModal');
        document.getElementById('checkHabitText').textContent = `Вы выполнили "${habit.name_habit}"?`;
        modal.classList.add('active');

        document.getElementById('checkHabitYes').onclick = async () => {
            const today = new Date().toISOString().split('T')[0];
            try {
                await api(`/api/habits/${habit.id}/check`, 'POST', { 
                    date: today, 
                    status: 'completed' 
                });
                modal.classList.remove('active');
                showModal('Отлично! Так держать!');
                
                renderHabitsTable();
                renderCharts(); 
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        };

        document.getElementById('checkHabitNo').onclick = () => {
            modal.classList.remove('active');
        };
    }

       async function renderHabitsTable() {
        const tbody = document.getElementById('habitsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#D09CD0;">Загрузка...</td></tr>';

        try {
            const response = await api('/api/habits/stats/table');
            
            const tableData = response.tableData || [];
            
            if (!tableData || tableData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#D09CD0;">У вас пока нет привычек</td></tr>`;
                return;
            }

            tbody.innerHTML = '';

            tableData.forEach(habit => {
                const tr = document.createElement('tr');
                let rowHTML = `<td>${habit.name}</td>`;
                
                habit.days.forEach(isCompleted => {
                    if (isCompleted) {
                        rowHTML += `<td><span class="check-mark">✔</span></td>`;
                    } else {
                        rowHTML += `<td><span class="no-mark">—</span></td>`;
                    }
                });
                
                tr.innerHTML = rowHTML;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error('ОШИБКА ЗАГРУЗКИ ТАБЛИЦЫ:', e); 
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#D09CD0;">Не удалось загрузить данные</td></tr>`;
        }
    }
   
    async function renderCharts() {
        const chartSections = document.querySelectorAll('.chart_container');
        if (chartSections.length < 1) return;
        
        const timeChartContainer = chartSections[chartSections.length - 1];
        timeChartContainer.innerHTML = '';
        
        const timeCanvas = document.createElement('canvas');
        timeCanvas.id = 'timeChart';
        timeChartContainer.appendChild(timeCanvas);

        try {
            const stats = await api('/api/time/stats');
            const ctxTime = timeCanvas.getContext('2d');
            
            const hasData = stats.length > 0 && stats.some(s => s.seconds > 0);

            const defaultColors = ['#D09CD0', '#EAB7EA', '#E7CEF2', '#C29BC9'];

            new Chart(ctxTime, {
                type: 'doughnut',
                data: {
                    labels: hasData ? stats.map(s => s.name) : ['Пока нет записей'],
                    datasets: [{
                        data: hasData ? stats.map(s => Number((s.seconds / 3600).toFixed(2))) : [1],
                        
                        backgroundColor: hasData 
                            ? stats.map((s, index) => s.color || defaultColors[index % defaultColors.length]) 
                            : ['#F1E6F6'],
                            
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { 
                                color: '#D09CD0',
                                filter: (legendItem, chartData) => hasData
                            } 
                        }
                    }
                }
            });
        } catch (e) { console.error('Ошибка графика времени:', e); }
    }

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
        
        if (!nameInput || nameInput.value.trim() === '') {
            alert('Пожалуйста, введите название привычки!');
            return;
        }

        const saveBtn = document.getElementById('saveHabit');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Сохранение...';
        
        const fd = new FormData();
        fd.append('name', nameInput.value.trim());
        fd.append('reminder_time', document.getElementById('h_time').value);
        
        const img = fileInput.files[0];
        if (img) fd.append('image', img);

        try {
            await api('/api/habits', 'POST', fd, true);
            habitModal.classList.remove('active');
            nameInput.value = '';
            fileInput.value = '';
            
            loadHabits();
            renderHabitsTable();
        } catch (e) { 
            console.error("Ошибка при сохранении:", e);
            alert('Не удалось сохранить: ' + e.message); 
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Добавить';
        }
    };

    document.querySelector('.timer_button').onclick = () => {
        window.location.href = '/html/time.html';
    };

    loadHabits();
    renderHabitsTable();
    renderCharts();
});