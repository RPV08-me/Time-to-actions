document.addEventListener('DOMContentLoaded', async () => {
    const { showModal, api } = window.App;
    let selectedCategory = null;
    let categories = [];

    try {
        categories = await api('/api/time/categories');
        const grid = document.querySelector('.categories_grid'); 
        grid.innerHTML = '';
        
        categories.forEach(c => {
            const card = document.createElement('div');
            card.className = 'category_card';
            card.innerHTML = `<span class="category_name" style="color:${c.color}">${c.name_time}</span>
            <button class="category_select_btn" style="background:${c.color}">Выбрать</button>`;
            card.querySelector('button').onclick = () => {
                document.querySelectorAll('.category_card').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
                selectedCategory = c;
            };
            grid.appendChild(card);
        });
    } catch (e) { return; }

    let timerInterval = null;
    let secondsLeft = 0;
    let totalPlanned = 0;
    let isRunning = false;

    const hInput = document.getElementById('hours');
    const mInput = document.getElementById('minutes');
    const sInput = document.getElementById('seconds');
    const startBtn = document.getElementById('timer_start');

    function updateDisplay() {
        hInput.value = Math.floor(secondsLeft / 3600);
        mInput.value = Math.floor((secondsLeft % 3600) / 60);
        sInput.value = secondsLeft % 60;
    }

    function startTimer() {
        if (!selectedCategory) return showModal('Сначала выберите категорию!', true);
        totalPlanned = (+hInput.value) * 3600 + (+mInput.value) * 60 + (+sInput.value);
        if (totalPlanned <= 0) return showModal('Введите время больше нуля!', true);
        secondsLeft = totalPlanned;
        isRunning = true;
        startBtn.textContent = 'Пауза';
        
        timerInterval = setInterval(() => {
            if (secondsLeft > 0) {
                secondsLeft--;
                updateDisplay();
            } else {
                finishTimer('completed');
            }
        }, 1000);
    }

    async function finishTimer(status) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Начать';
        const actualSeconds = totalPlanned - secondsLeft;
        
        if (actualSeconds > 0) {
            await api('/api/time', 'POST', {
                category_id: selectedCategory.id,
                planned_seconds: totalPlanned,
                actual_seconds: actualSeconds,
                status: status
            });
        }
        if (status === 'completed') showModal('Время вышло! Запись добавлена.');
    }

    startBtn.onclick = () => {
        if (!isRunning) startTimer();
        else {
            isRunning = false;
            clearInterval(timerInterval);
            startBtn.textContent = 'Продолжить';
        }
    };

    window.addEventListener('beforeunload', (e) => {
        if (isRunning) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (isRunning) {
                e.preventDefault();
                const overlay = document.getElementById('modalOverlay');
                if (!overlay) return;
                document.getElementById('modalMessage').textContent = 'Вы уверены, что хотите прервать таймер?';
                overlay.classList.add('active');
                document.getElementById('modalButton').onclick = () => {
                    overlay.classList.remove('active');
                };
                
                let yesBtn = document.getElementById('modalYesBtn');
                if (!yesBtn) {
                    yesBtn = document.createElement('button');
                    yesBtn.id = 'modalYesBtn';
                    yesBtn.className = 'modal_button';
                    yesBtn.style.marginLeft = '10px';
                    yesBtn.textContent = 'Прервать';
                    document.querySelector('.modal').appendChild(yesBtn);
                }
                yesBtn.style.display = 'inline-block';
                yesBtn.onclick = async () => {
                    await finishTimer('interrupted');
                    window.location.href = link.href;
                };
            }
        });
    });
});