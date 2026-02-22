(function () {
    'use strict';

    function UAKinoPlugin() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // 1. Пошук фільму на сайті
        this.search = function (query, callback) {
            var url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(url, function (html) {
                var items = [];
                var cards = $(html).find('.movie-item');

                cards.each(function () {
                    var a = $(this).find('a').first();
                    var img = $(this).find('img').attr('src');
                    var title = $(this).find('.movie-title').text() || a.attr('title');
                    var link = a.attr('href');
                    
                    if (link) {
                        items.push({
                            title: title,
                            url: link,
                            img: img && img.indexOf('http') === -1 ? base_url + img : img
                        });
                    }
                });
                callback(items);
            }, function () {
                callback([]);
            });
        };

        // 2. Витяг прямого посилання на відео
        this.extract = function (movie_url, callback) {
            network.native(movie_url, function (html) {
                var iframe_match = html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                
                if (iframe_match && iframe_match[1]) {
                    network.native(iframe_match[1], function (player_html) {
                        var video_match = player_html.match(/file:'(.*?)'/);
                        if (video_match && video_match[1]) {
                            callback(video_match[1]);
                        } else {
                            Lampa.Noty.show('Відеофайл не знайдено');
                            Lampa.Loading.stop();
                        }
                    }, function() {
                        Lampa.Noty.show('Помилка доступу до плеєра');
                        Lampa.Loading.stop();
                    });
                } else {
                    Lampa.Noty.show('Плеєр Ashdi не знайдено');
                    Lampa.Loading.stop();
                }
            });
        };
    }

    // Головна функція ініціалізації
    function startPlugin() {
        var uakino = new UAKinoPlugin();

        // Слухаємо відкриття картки фільму
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевіряємо, чи ми не додали кнопку вже раніше
                if ($('.view--uakino', render).length > 0) return;

                // Створюємо кнопку
                var btn = $('<div class="full-start__button selector view--uakino"><span>UAKino</span></div>');
                
                btn.on('hover:enter', function () {
                    var search_query = e.data.movie.title || e.data.movie.name;
                    
                    Lampa.Loading.start();
                    
                    uakino.search(search_query, function(results) {
                        Lampa.Loading.stop();
                        
                        if (results.length > 0) {
                            Lampa.Select.show({
                                title: 'Результати UAKino',
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

                // Додаємо кнопку в блок кнопок
                $('.full-start__buttons', render).append(btn);
            }
        });
    }

    // Надійний запуск через інтервал
    var waitLampa = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(waitLampa);
            startPlugin();
        }
    }, 200);

})();
