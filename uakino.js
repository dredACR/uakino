(function () {
    'use strict';

    // Повідомлення для Google TV
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Шукаю будь-яке місце для кнопки...');
    }, 2000);

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
                
                var inject = function() {
                    if (render.find('.view--uakino').length > 0) return;

                    // Створюємо кнопку, яка ПОВИННА виділятися
                    var btn = $('<div class="full-start__button selector view--uakino" style="background: #e67e22 !important; border: 2px solid #fff !important; margin: 10px !important; padding: 10px !important; display: inline-block !important;"><span>UAKINO (UA)</span></div>');

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

                    // ШУКАЄМО БУДЬ-ЯКУ КНОПКУ НА ЕКРАНІ
                    var anyButton = render.find('.selector').first();
                    
                    if (anyButton.length > 0) {
                        anyButton.before(btn); // Ставимо перед першою ж знайденою кнопкою
                        Lampa.Controller.toggle('full_start');
                    } else {
                        // Якщо взагалі не знайшли кнопок, кидаємо в самий верх сторінки
                        render.prepend(btn);
                    }
                };

                // Чекаємо 1.5 секунди, поки TV відрендерить сторінку повністю
                setTimeout(inject, 1500);
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
