(function () {
    'use strict';

    function start() {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        // Реєструємо компонент
        Lampa.Component.add('uakino_source', function (object) {
            var comp = new Lampa.InteractionMain(object);

            comp.create = function () {
                var _this = this;
                this.activity.loader(true);

                var query = object.search_query || (object.movie ? (object.movie.title || object.movie.name) : '');
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

                    _this.activity.loader(false);

                    if (items.length > 0) {
                        Lampa.Select.show({
                            title: 'Результати UAKino',
                            items: items,
                            onSelect: function (item) {
                                Lampa.Loading.start();
                                network.native(item.url, function (p_html) {
                                    var iframe = p_html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                                    if (iframe) {
                                        network.native(iframe[1], function (v_html) {
                                            var video = v_html.match(/file:'(.*?)'/);
                                            Lampa.Loading.stop();
                                            if (video) {
                                                Lampa.Player.play({ url: video[1], title: item.title });
                                            }
                                        });
                                    } else Lampa.Loading.stop();
                                });
                            },
                            onBack: function () {
                                Lampa.Activity.backward();
                            }
                        });
                    } else {
                        Lampa.Noty.show('Нічого не знайдено');
                        Lampa.Activity.backward();
                    }
                }, function () {
                    _this.activity.loader(false);
                    Lampa.Noty.show('Помилка мережі');
                    Lampa.Activity.backward();
                });

                return this.render();
            };
            return comp;
        });

        // ПРИМУСОВА ВСТАВКА В КАРТКУ (Android APK Method)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector view--uakino" style="background: #3e0a0a !important;"><span>UAKino (UA)</span></div>');
                
                btn.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'UAKino',
                        component: 'uakino_source',
                        movie: e.data.movie,
                        page: 1
                    });
                });

                // Чекаємо і вставляємо ПЕРЕД усіма кнопками
                setTimeout(function(){
                    var container = $('.full-start__buttons', e.object.render());
                    if (container.length > 0) {
                        container.prepend(btn);
                        // Оновлюємо навігацію для Sharp TV
                        Lampa.Controller.toggle('full_start');
                    }
                }, 2000);
            }
        });
    }

    if (window.Lampa) {
        Lampa.Noty.show('UAKino v3.1.6: Натисніть кнопку під назвою');
        start();
    }
})();
