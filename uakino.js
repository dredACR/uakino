(function () {
    'use strict';

    // Повідомлення для перевірки
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Шукайте вкладку зверху поруч із "Відео"');
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

        // Слухаємо побудову сторінки фільму
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Створюємо нову вкладку
                var tab = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');

                tab.on('hover:enter', function () {
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
                                onBack: function() { 
                                    Lampa.Controller.toggle('full_start'); 
                                }
                            });
                        } else Lampa.Noty.show('Нічого не знайдено');
                    });
                });

                // ВСТАВЛЯЄМО ВЕРХНЮ КНОПКУ (НАЙНАДІЙНІШЕ)
                // Шукаємо блок з головними кнопками ("Дивитись", "Трейлер")
                var container = render.find('.full-start__buttons');
                
                if (container.length > 0) {
                    container.prepend(tab); // Додаємо на самий початок
                } else {
                    // Якщо блоку немає, шукаємо будь-який селектор у верхній частині
                    render.find('.selector').first().before(tab);
                }
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
