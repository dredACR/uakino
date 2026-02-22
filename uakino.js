(function () {
    'use strict';

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

        // ІНТЕГРАЦІЯ ЧЕРЕЗ СИСТЕМНЕ МЕНЮ "ВІДЕО"
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var title = e.data.movie.title || e.data.movie.name;
                
                // Додаємо пункт у список джерел (це працює в APK 1.12.4)
                if (e.object.activity && e.object.activity.hasOwnProperty('context_menu')) {
                    e.object.activity.context_menu({
                        name: 'uakino',
                        title: 'UAKino (UA)',
                        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
                    }, function () {
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

                // Також намагаємося додати кнопку в розділ "Відео"
                var video_btn = $('<div class="full-start__button selector view--uakino"><span>UAKino (UA)</span></div>');
                video_btn.on('hover:enter', function() {
                    // Виклик тієї ж логіки пошуку
                    Lampa.Loading.start();
                    uakino.search(title, function (res) {
                        Lampa.Loading.stop();
                        if (res.length) {
                            Lampa.Select.show({
                                title: 'UAKino',
                                items: res,
                                onSelect: function (item) {
                                    Lampa.Loading.start();
                                    uakino.extract(item.url, function (url) {
                                        Lampa.Loading.stop();
                                        Lampa.Player.play({ url: url, title: item.title });
                                    });
                                }
                            });
                        }
                    });
                });

                // Вставка в блок "ВІДЕО"
                setTimeout(function() {
                    $('.full-start__buttons', e.object.render()).append(video_btn);
                }, 100);
            }
        });
    }

    var wait = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(wait);
            start();
            Lampa.Noty.show('UAKino для Android APK активовано');
        }
    }, 500);
})();
