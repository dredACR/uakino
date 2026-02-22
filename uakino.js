(function () {
    'use strict';

    var start = function () {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевірка на дублікат без використання jQuery знака $
                if (render[0].querySelector('.view--uakino')) return;

                // Створення кнопки через нативний JS
                var btn = document.createElement('div');
                btn.className = 'full-start__button selector view--uakino';
                btn.innerHTML = '<span>UAKino (UA)</span>';
                btn.style.backgroundColor = '#1a73e8';
                btn.style.marginRight = '10px';

                // Обробка натискання
                btn.addEventListener('click', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();

                    var search_url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(title);
                    
                    network.native(search_url, function (html) {
                        Lampa.Loading.stop();
                        // Шукаємо перше посилання на фільм
                        var match = html.match(/class="movie-title"><a href="(https:\/\/uakino\.best\/[^"]+)"/);
                        if (match && match[1]) {
                            Lampa.Loading.start();
                            network.native(match[1], function (movie_html) {
                                Lampa.Loading.stop();
                                var iframe = movie_html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                                if (iframe) {
                                    network.native(iframe[1], function (v_html) {
                                        var video = v_html.match(/file:'(.*?)'/);
                                        if (video && video[1]) {
                                            Lampa.Player.play({ url: video[1], title: title });
                                        } else { Lampa.Noty.show('Відеофайл не знайдено'); }
                                    });
                                } else { Lampa.Noty.show('Плеєр не знайдено'); }
                            });
                        } else { Lampa.Noty.show('Фільм не знайдено'); }
                    }, function() {
                        Lampa.Loading.stop();
                        Lampa.Noty.show('Помилка запиту');
                    });
                });

                // Вставка кнопки в блок кнопок
                var container = render[0].querySelector('.full-start__buttons');
                if (container) {
                    container.insertBefore(btn, container.firstChild);
                    // Повідомляємо Lampa про новий елемент для пульта
                    if (Lampa.Controller.update) Lampa.Controller.update();
                }
            }
        });
    };

    // Безпечний запуск без jQuery
    var checkLampa = setInterval(function () {
        if (typeof Lampa !== 'undefined') {
            clearInterval(checkLampa);
            try {
                start();
            } catch (err) {
                // Виводимо помилку в Noty, щоб ви могли її побачити на екрані
                if (Lampa.Noty) Lampa.Noty.show('Помилка ініціалізації: ' + err.message);
            }
        }
    }, 500);
})();
