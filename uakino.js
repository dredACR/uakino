(function () {
    'use strict';

    function startPlugin() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // Функція пошуку
        function search(query, callback) {
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
        }

        // Функція витягування відео
        function extract(movie_url, callback) {
            network.native(movie_url, function (html) {
                var iframe = html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                if (iframe) {
                    network.native(iframe[1], function (p_html) {
                        var video = p_html.match(/file:'(.*?)'/);
                        if (video) callback(video[1]);
                    });
                }
            });
        }

        // Слухаємо відкриття картки фільму
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                if (render.find('.view--uakino').length > 0) return;

                // Створюємо кнопку через стандартний клас Lampa
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    search(title, function (res) {
                        Lampa.Loading.stop();
                        if (res.length > 0) {
                            Lampa.Select.show({
                                title: 'UAKino: ' + title,
                                items: res,
                                onSelect: function (item) {
                                    Lampa.Loading.start();
                                    extract(item.url, function (url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({ url: url, title: item.title });
                                    });
                                },
                                onBack: function() {
                                    Lampa.Controller.toggle('full_start');
                                }
                            });
                        } else {
                            Lampa.Noty.show('Нічого не знайдено');
                        }
                    });
                });

                // Вставка кнопки з невеликою затримкою для Sharp TV
                setTimeout(function() {
                    var container = render.find('.full-start__buttons');
                    if (container.length > 0) {
                        container.append(btn);
                        Lampa.Controller.toggle('full_start');
                    }
                }, 1000);
            }
        });
    }

    // Запуск плагіна
    if (window.Lampa) {
        startPlugin();
    } else {
        var timer = setInterval(function() {
            if (window.Lampa) {
                clearInterval(timer);
                startPlugin();
            }
        }, 200);
    }
})();
