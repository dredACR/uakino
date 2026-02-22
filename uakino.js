(function () {
    'use strict';

    function UAKinoPlugin() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // Функція пошуку на сайті
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

        // Витягування прямого посилання на відео
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

        // ІНТЕГРАЦІЯ ЯК ДЖЕРЕЛО (Найбільш стабільний метод)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Додаємо вкладку в горизонтальне меню (де "Відео", "Деталі")
                var render = e.object.render();
                var title = e.data.movie.title || e.data.movie.name;

                // Створюємо елемент меню
                var item = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                item.on('hover:enter', function () {
                    Lampa.Loading.start();
                    uakino.search(title, function (results) {
                        Lampa.Loading.stop();
                        if (results.length > 0) {
                            Lampa.Select.show({
                                title: 'Результати UAKino',
                                items: results,
                                onSelect: function (res) {
                                    Lampa.Loading.start();
                                    uakino.extract(res.url, function (video_url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({
                                            url: video_url,
                                            title: res.title
                                        });
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

                // СИЛОВА ВСТАВКА: Додаємо в панель кнопок або в початок сторінки
                // Якщо Sharp блокує кнопки, ми додаємо ПЕРЕД описом
                setTimeout(function() {
                    var footer = render.find('.full-start__buttons');
                    if (footer.length > 0) {
                        footer.prepend(item);
                    } else {
                        render.find('.full-descr').prepend(item);
                    }
                    Lampa.Controller.toggle('full_start');
                }, 1500);
            }
        });
    }

    if (window.Lampa) {
        Lampa.Noty.show('UAKino активовано');
        start();
    }
})();
