(function () {
    'use strict';

    // Повідомлення для тесту
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino активовано для Google TV');
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

        // Функція вставки кнопки
        var injectButton = function(render, movieData) {
            if (render.find('.view--uakino').length > 0) return;

            var btn = $('<div class="full-start__button selector view--uakino" style="background: #1a73e8 !important; border-radius: 5px; margin-right: 10px;"><span style="font-weight: bold;">UAKino (UA)</span></div>');

            btn.on('hover:enter', function () {
                var title = movieData.title || movieData.name;
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

            // Шукаємо блок кнопок
            var container = render.find('.full-start__buttons');
            if (container.length > 0) {
                container.prepend(btn);
                // Оновлюємо навігацію пульта
                Lampa.Controller.toggle('full_start');
            }
        };

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Чекаємо появи кнопок (для повільних TV)
                var timer = setInterval(function(){
                    if (render.find('.full-start__buttons').length > 0) {
                        clearInterval(timer);
                        injectButton(render, e.data.movie);
                    }
                }, 500);

                // На всяк випадок зупиняємо пошук через 10 секунд
                setTimeout(function(){ clearInterval(timer); }, 10000);
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
