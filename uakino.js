(function () {
    'use strict';

    function start() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // Функція для пошуку відео
        function getUAKinoVideo(title, callback) {
            var url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(title);
            network.native(url, function (html) {
                var iframe = html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                if (iframe) {
                    network.native(iframe[1], function (v_html) {
                        var video = v_html.match(/file:'(.*?)'/);
                        if (video) callback(video[1]);
                        else Lampa.Noty.show('Відео не знайдено');
                    });
                } else {
                    Lampa.Noty.show('Фільм не знайдено на UAKino');
                }
            }, function() {
                Lampa.Noty.show('Помилка мережі UAKino');
            });
        }

        // Додаємо кнопку через Listener
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевірка чи вже є кнопка
                if (render.find('.view--uakino').length > 0) return;

                // Створюємо кнопку (без складних стилів, щоб не було помилок)
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    
                    getUAKinoVideo(title, function(url) {
                        Lampa.Loading.stop();
                        Lampa.Player.play({
                            url: url,
                            title: title
                        });
                    });
                });

                // Вставка в блок кнопок
                var container = render.find('.full-start__buttons');
                if (container.length > 0) {
                    container.append(btn);
                    // Важливо для Android TV: оновлюємо навігацію пульта
                    Lampa.Controller.add('full_start', {
                        toggle: function() {},
                        up: function() {},
                        down: function() {},
                        enter: function() {}
                    });
                }
            }
        });
    }

    // Безпечний запуск
    try {
        if (window.Lampa) {
            start();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') start();
            });
        }
    } catch (err) {
        console.error("UAKino Error: ", err);
    }
})();
