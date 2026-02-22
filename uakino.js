(function () {
    'use strict';

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
                
                // Якщо кнопка вже є, не додаємо другу
                if (render.find('.view--uakino').length > 0) return;

                // Створюємо кнопку
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino</span></div>');

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
                        } else {
                            Lampa.Noty.show('Нічого не знайдено на UAKino');
                        }
                    });
                });

                // --- СПРОБА ВСТАВИТИ В РІЗНІ МІСЦЯ ---
                var footer = render.find('.full-start__buttons'); // Стандартне місце
                if (footer.length > 0) {
                    footer.append(btn);
                } else {
                    // Якщо стандартне місце не знайдене, ліпимо в кінець опису
                    render.find('.full-descr').append(btn);
                }
                
                // Оновлюємо контролер, щоб Lampa побачила нову кнопку
                if(Lampa.Controller.enabled().name == 'full_start') {
                    Lampa.Controller.toggle('full_start');
                }
            }
        });
    }

    // Чекаємо завантаження Lampa
    var wait = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(wait);
            try {
                start();
                // Повідомлення для тесту (потім видалимо)
                Lampa.Noty.show('UAKino готовий до роботи');
            } catch(e) { console.error(e); }
        }
    }, 500);
})();
