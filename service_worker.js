self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Напоминание';
    const options = {
        body: data.body || 'Пора выполнить привычку!',
        icon: '/img/Лого.webp'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});