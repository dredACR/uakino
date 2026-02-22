(function () {
    'use strict';

    // 1. ПЕРЕВІРКА ЗАВАНТАЖЕННЯ (З'явиться відразу при старті Lampa)
    setTimeout(function() {
        if (window.Lampa) {
            Lampa.Noty.show('UAKino: Плагін успішно підключено');
        }
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
                            url: a.attr('href'),
                            img: $(this).find('img').attr('src')
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
                        else Lampa.Noty.show('UAKino: Відео не знайдено');
                    }, function() { Lampa.Noty.show('UAKino: Помилка Ashdi'); });
                } else {
                    Lampa.Noty.show('UAKino: Плеєр не знайдено');
                }
            });
        };
    }

    function start() {
        var uakino = new UAKinoPlugin();

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевірка на дублікат
                if ($('.view--uakino', render).length > 0) return;

                // Створення кнопки (додаємо стиль, щоб було видно на будь-якому фоні)
                var btn = $('<div class="full-start__button selector view--uakino" style="background: #205c1d !important; border: 1px solid #4cd964; margin: 10px 0; display: flex !important;"><span>UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    uakino.search(title, function(res) {
                        Lampa.Loading.stop();
                        if (res.length) {
                            Lampa.Select.show({
                                title: 'Результати UAKino',
                                items: res,
                                onSelect: function(item) {
                                    Lampa.Loading.start();
                                    uakino.extract(item.url, function(url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({ url: url, title: item.title });
                                    });
                                },
                                onBack: function() { 
                                    Lampa.Controller.toggle('full_start'); 
                                }
                            });
                        } else {
                            Lampa.Noty.show('UAKino: Нічого не знайдено');
                        }
                    });
                });

                // ВСТАВКА КНОПКИ (Пробуємо в різні блоки)
                var dest = render.find('.full-start__buttons');
                if (dest.length === 0) dest = render.find('.full-descr__text');
                if (dest.length === 0) dest = render.find('.full-info');

                if (dest.length > 0) {
                    dest.append(btn);
                    // Оновлюємо навігацію пульта
                    Lampa.Controller.toggle('full_start');
                }
            }
        });
    }

    // Запуск
    var checkLampa = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(checkLampa);
            try {
                start();
            } catch(err) {
                console.error(err);
            }
        }
    }, 500);

})();
