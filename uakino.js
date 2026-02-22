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
                        else Lampa.Noty.show('Файл відео не знайдено');
                    }, function() { Lampa.Noty.show('Помилка плеєра Ashdi'); });
                } else {
                    Lampa.Noty.show('Плеєр не знайдено на сторінці');
                }
            });
        };
    }

    function start() {
        var uakino = new UAKinoPlugin();

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевірка на дублікат кнопки
                if (render.find('.view--uakino').length > 0) return;

                // Створення кнопки з примусовим стилем для видимості
                var btn = $('<div class="full-start__button selector view--uakino" style="margin-bottom: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer;"><span style="color: #4cd964; font-weight: bold;">UAKino (UA)</span></div>');

                btn.on('hover:enter', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();
                    uakino.search(title, function(res) {
                        Lampa.Loading.stop();
                        if (res.length) {
                            Lampa.Select.show({
                                title: 'Результати UAKino',
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
                        } else {
                            Lampa.Noty.show('Нічого не знайдено');
                        }
                    });
                });

                // --- ПОШУК КОНТЕЙНЕРА ДЛЯ ВСТАВКИ ---
                // Пробуємо різні класи, які використовуються в різних версіях Lampa
                var targets = [
                    render.find('.full-start__buttons'), 
                    render.find('.full-descr__buttons'),
                    render.find('.full-info'),
                    render.find('.full-descr')
                ];

                var success = false;
                for (var i = 0; i < targets.length; i++) {
                    if (targets[i].length > 0) {
                        targets[i].append(btn);
                        success = true;
                        break; 
                    }
                }

                // Якщо кнопка додана, оновлюємо навігацію
                if (success) {
                    Lampa.Controller.toggle('full_start');
                }
            }
        });
    }

    // Очікування завантаження Lampa
    var wait = setInterval(function() {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            clearInterval(wait);
            try {
                start();
                console.log('UAKino Plugin Started Successfully');
            } catch(e) { 
                console.error('UAKino Start Error:', e); 
            }
        }
    }, 500);
})();
