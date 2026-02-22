(function () {
    'use strict';

    // Повідомлення про запуск
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Тепер результати з’являться у загальному пошуку!');
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
                    });
                }
            });
        };
    }

    function start() {
        var uakino = new UAKinoPlugin();

        // ІНТЕГРАЦІЯ В ГЛОБАЛЬНИЙ ПОШУК LAMPA
        Lampa.Listener.follow('search', function (e) {
            if (e.type == 'end' && e.query) {
                uakino.search(e.query, function(results) {
                    if (results.length > 0) {
                        // Створюємо окрему секцію в результатах пошуку
                        var result_items = results.map(function(item) {
                            return {
                                title: item.title,
                                message: 'Дивитися на UAKino (UA)',
                                onSelect: function() {
                                    Lampa.Loading.start();
                                    uakino.extract(item.url, function(url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({
                                            url: url,
                                            title: item.title
                                        });
                                    });
                                }
                            };
                        });

                        // Додаємо результати в кінець списку пошуку
                        e.object.append({
                            title: 'UAKino',
                            items: result_items
                        });
                    }
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
