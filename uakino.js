(function () {
    'use strict';

    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Знайдено! Шукайте кнопку під постером');
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

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                if (render.find('.view--uakino').length > 0) return;

                // Створюємо кнопку з яскравим стилем
                var btn = $('<div class="full-start__button selector view--uakino" style="background: #1a73e8 !important; border-radius: 5px; margin-top: 10px; width: 100%; display: block; text-align: center;"><span style="font-weight: bold; color: #fff;">ДИВИТИСЯ НА UAKINO</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    uakino.search(title, function(res) {
                        Lampa.Loading.stop();
                        if (res.length) {
                            Lampa.Select.show({
                                title: 'UAKino: ' + title,
                                items: res,
                                onSelect: function(item) {
                                    Lampa.Loading.start();
                                    uakino.extract(item.url, function(url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({ url: url, title: item.title });
                                    });
                                },
                                onBack: function() { Lampa.Controller.toggle('full_start'); }
                            });
                        } else Lampa.Noty.show('Нічого не знайдено');
                    });
                });

                // --- НОВИЙ МЕТОД ВСТАВКИ ---
                // Шукаємо постер або ліву колонку
                var left_col = render.find('.full-poster'); 
                if (left_col.length == 0) left_col = render.find('.full-start__poster');
                
                if (left_col.length > 0) {
                    left_col.append(btn); // Додаємо кнопку прямо під постер
                } else {
                    // Якщо навіть постера немає, ліпимо в самий початок опису
                    render.prepend(btn);
                }

                // Оновлюємо навігацію пульта
                Lampa.Controller.add('full_start', {
                    toggle: function() {},
                    up: function() {},
                    down: function() {},
                    enter: function() {}
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
