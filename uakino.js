(function () {
    'use strict';

    function UAKinoPlugin(components) {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // Функція для пошуку на сайті
        this.search = function (object, query, callback) {
            var url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(url, function (html) {
                var items = [];
                var cards = $(html).find('.movie-item');

                cards.each(function () {
                    var img = $(this).find('img').attr('src');
                    var link = $(this).find('a').attr('href');
                    var title = $(this).find('.movie-title').text() || $(this).find('a').attr('title');
                    
                    if (link) {
                        items.push({
                            title: title,
                            url: link,
                            img: img.indexOf('http') === -1 ? base_url + img : img
                        });
                    }
                });
                callback(items);
            }, function () {
                callback([]);
            });
        };

        // Функція для витягування прямого посилання на відео
        this.extract = function (movie_url, callback) {
            network.native(movie_url, function (html) {
                // Шукаємо iframe Ashdi
                var iframe_match = html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                
                if (iframe_match && iframe_match[1]) {
                    var iframe_url = iframe_match[1];
                    
                    network.native(iframe_url, function (player_html) {
                        // Витягуємо пряме посилання на m3u8
                        var video_match = player_html.match(/file:'(.*?)'/);
                        if (video_match && video_match[1]) {
                            callback(video_match[1]);
                        } else {
                            Lampa.Noty.show('Відео не знайдено в плеєрі');
                        }
                    }, function() {
                        Lampa.Noty.show('Помилка доступу до Ashdi');
                    });
                } else {
                    Lampa.Noty.show('Плеєр не знайдено на сторінці');
                }
            });
        };
    }

    // Ініціалізація плагіна в Lampa
    function startPlugin() {
        var uakino = new UAKinoPlugin();

        // Додаємо кнопку "UAKino" в картку фільму
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector"><span>UAKino</span></div>');
                
                btn.on('hover:enter', function () {
                    var search_query = e.data.movie.title || e.data.movie.name;
                    
                    Lampa.Select.show({
                        title: 'Пошук на UAKino',
                        items: [{title: 'Шукати: ' + search_query}],
                        onSelect: function() {
                            Lampa.Loading.start();
                            uakino.search(e.data, search_query, function(results) {
                                Lampa.Loading.stop();
                                if (results.length > 0) {
                                    Lampa.Select.show({
                                        title: 'Результати',
                                        items: results,
                                        onSelect: function(item) {
                                            Lampa.Loading.start();
                                            uakino.extract(item.url, function(video_url) {
                                                Lampa.Loading.stop();
                                                Lampa.Player.play({
                                                    url: video_url,
                                                    title: item.title
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    Lampa.Noty.show('Нічого не знайдено');
                                }
                            });
                        }
                    });
                });

                $('.full-start__buttons', e.object.render()).append(btn);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') startPlugin();
    });

})();
