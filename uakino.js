(function () {
    'use strict';

    // Повідомлення для перевірки, що плагін хоча б завантажився
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Плагін активний. Шукайте в картці фільму!');
    }, 3000);

    function UAKinoPlugin() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        this.search = function (query, callback) {
            var url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            network.native(url, function (html) {
                var items = [];
                var cards = $(html).find('.movie-item');
                cards.each(function () {
                    var a = $(this).find('a').first();
                    if (a.attr('href')) {
                        items.push({
                            title: $(this).find('.movie-title').text() || a.attr('title'),
                            url: a.attr('href')
                        });
                    }
                });
                callback(items);
            }, function () { callback([]); });
        };

        this.extract = function (movie_url, callback) {
            network.native(movie_url, function (html) {
                var iframe = html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                if (iframe) {
                    network.native(iframe[1], function (p_html) {
                        var video = p_html.match(/file:'(.*?)'/);
                        if (video) callback(video[1]);
                    });
                }
            });
        };
    }

    function start() {
        var uakino = new UAKinoPlugin();

        // Перехоплюємо побудову сторінки фільму
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Якщо кнопка вже є - виходимо
                if ($('.view--uakino', render).length > 0) return;

                // Створюємо кнопку через стандартний метод Lampa
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    uakino.search(title, function (res) {
                        Lampa.Loading.stop();
                        if (res.length) {
                            Lampa.Select.show({
                                title: 'Результати UAKino',
                                items: res,
                                onSelect: function (item) {
                                    Lampa.Loading.start();
                                    uakino.extract(item.url, function (url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({ url: url, title: item.title });
                                    });
                                },
                                onBack: function() {
                                    Lampa.Controller.toggle('full_start');
                                }
                            });
                        } else Lampa.Noty.show('Нічого не знайдено');
                    });
                });

                // --- СИЛОВИЙ МЕТОД ВСТАВКИ ДЛЯ GOOGLE TV ---
                // Ми будемо кожну секунду перевіряти, чи з'явився блок кнопок, 
                // і вставимо кнопку, як тільки він буде готовий.
                var interval = setInterval(function() {
                    var buttons_block = render.find('.full-start__buttons');
                    if (buttons_block.length > 0) {
                        clearInterval(interval);
                        buttons_block.append(btn);
                        // Оновлюємо навігацію
                        Lampa.Controller.toggle('full_start');
                    }
                }, 100);

                // Зупиняємо через 5 секунд, щоб не навантажувати ТВ
                setTimeout(function() { clearInterval(interval); }, 5000);
            }
        });
    }

    var wait = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(wait);
            start();
        }
    }, 500);
})();
