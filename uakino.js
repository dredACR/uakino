(function () {
    'use strict';

    function UAKinoPlugin() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        this.search = function (query, callback) {
            var url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            network.native(url, function (html) {
                var items = [];
                $(html).find('.movie-item').each(function () {
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

        // РЕЄСТРАЦІЯ ЯК ОКРЕМОГО ПУНКТУ В КАРТЦІ
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                var title = e.data.movie.title || e.data.movie.name;

                // Створюємо кнопку через офіційні класи Lampa для Google TV
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    Lampa.Loading.start();
                    uakino.search(title, function (res) {
                        Lampa.Loading.stop();
                        if (res.length > 0) {
                            Lampa.Select.show({
                                title: 'UAKino: ' + title,
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
                        } else {
                            Lampa.Noty.show('На UAKino нічого не знайдено');
                        }
                    });
                });

                // Шукаємо місце для вставки. Якщо немає кнопок, вставляємо в меню вкладок
                var container = render.find('.full-start__buttons');
                if (container.length > 0) {
                    container.append(btn);
                } else {
                    // Метод для Lampa Lite / Google TV: додаємо в панель вкладок
                    render.find('.full-tabs').append(btn);
                }
                
                // Оновлюємо контролер
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    // Чекаємо повної готовності Lampa
    var wait = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(wait);
            start();
            // Повідомлення з'явиться точно, якщо плагін завантажився
            Lampa.Noty.show('UAKino: Модуль активовано');
        }
    }, 500);
})();
