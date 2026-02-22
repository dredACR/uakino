(function () {
    'use strict';

    // Повідомлення про запуск
    setTimeout(function() {
        if (window.Lampa) Lampa.Noty.show('UAKino: Додано в головне меню!');
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

        // 1. ДОДАВАННЯ В ГОЛОВНЕ МЕНЮ (Зліва)
        Lampa.Component.add('uakino_menu', function(object){
            var comp = new Lampa.InteractionMain(object);
            
            comp.create = function(){
                this.activity.loader(true);
                // Тут можна зробити вивід останніх новинок, але поки зробимо просто запуск пошуку
                Lampa.Input.edit({
                    value: '',
                    title: 'Пошук на UAKino'
                }, function(value){
                    if(value){
                        uakino.search(value, function(res){
                            comp.activity.loader(false);
                            if(res.length){
                                Lampa.Select.show({
                                    title: 'Результати для: ' + value,
                                    items: res,
                                    onSelect: function(item){
                                        Lampa.Loading.start();
                                        uakino.extract(item.url, function(url){
                                            Lampa.Loading.stop();
                                            Lampa.Player.play({ url: url, title: item.title });
                                        });
                                    }
                                });
                            } else Lampa.Noty.show('Нічого не знайдено');
                        });
                    } else Lampa.Activity.backward();
                });
            };
            return comp;
        });

        // Додаємо пункт "UAKino" у список меню
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var menu_item = $('<li class="menu__item selector" data-action="uakino">' +
                    '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></div>' +
                    '<div class="menu__text">UAKino</div>' +
                '</li>');

                menu_item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'UAKino',
                        component: 'uakino_menu',
                        page: 1
                    });
                });

                $('.menu .menu__list').append(menu_item);
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
