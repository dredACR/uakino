(function () {
    'use strict';

    // Повідомлення для перевірки
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Затисніть ОК на фільмі для перегляду!');
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

        // ДОДАЄМО ПУНКТ У КОНТЕКСТНЕ МЕНЮ (При затисканні ОК)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Додаємо в контекстне меню (кнопка "Більше" або затискання ОК)
                e.object.activity.context_menu({
                    name: 'uakino',
                    title: 'Дивитися на UAKino (UA)',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
                }, function () {
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
                                }
                            });
                        } else Lampa.Noty.show('Нічого не знайдено');
                    });
                });
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
