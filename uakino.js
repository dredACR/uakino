(function () {
    'use strict';

    // Повідомлення для перевірки
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Затисніть ОК і шукайте пункт у списку!');
    }, 3000);

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

        // Функція для виконання пошуку та запуску
        var runAction = function(data) {
            var title = data.movie.title || data.movie.name;
            Lampa.Loading.start();
            uakino.search(title, function (res) {
                Lampa.Loading.stop();
                if (res.length) {
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
                             Lampa.Controller.toggle('context_menu'); // Повертаємо фокус у меню
                        }
                    });
                } else Lampa.Noty.show('На UAKino нічого не знайдено');
            });
        };

        // Слідкуємо за відкриттям КОНТЕКСТНОГО МЕНЮ
        Lampa.Listener.follow('contextmenu', function (e) {
            // Додаємо наш пункт у масив меню, який Lampa збирається малювати
            if (e.menu) {
                e.menu.push({
                    title: 'Дивитися на UAKino (UA)',
                    subtitle: 'Українська озвучка',
                    action: 'uakino_play'
                });
            }
        });

        // Слухаємо клік по нашому пункту в меню
        Lampa.Listener.follow('contextmenu', function (e) {
            if (e.action == 'uakino_play') {
                runAction(e.data);
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
