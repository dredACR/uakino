(function () {
    'use strict';

    var start = function () {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                var html_node = render[0];

                // Перевірка, щоб не дублювати
                if (html_node.querySelector('.view--uakino')) return;

                // Створюємо кнопку вручну (без jQuery)
                var btn = document.createElement('div');
                btn.className = 'full-start__button selector view--uakino';
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                btn.style.borderRadius = '12px';
                btn.style.marginLeft = '10px';
                btn.style.padding = '0 20px';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.height = '3.5rem';
                btn.style.cursor = 'pointer';
                btn.innerHTML = '<span style="font-weight: 500;">UAKino</span>';

                // Логіка пошуку
                btn.addEventListener('click', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();

                    var search_url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(title);
                    
                    network.native(search_url, function (html) {
                        Lampa.Loading.stop();
                        // Шукаємо посилання на фільм у HTML
                        var match = html.match(/class="movie-title"><a href="(https:\/\/uakino\.best\/[^"]+)"/);
                        if (match && match[1]) {
                            Lampa.Loading.start();
                            network.native(match[1], function (movie_html) {
                                Lampa.Loading.stop();
                                var iframe = movie_html.match(/src="(https:\/\/ashdi\.vip\/vod\/[^"]+)"/);
                                if (iframe) {
                                    network.native(iframe[1], function (v_html) {
                                        var video = v_html.match(/file:'(.*?)'/);
                                        if (video && video[1]) {
                                            Lampa.Player.play({ url: video[1], title: title });
                                        } else { Lampa.Noty.show('Відео не знайдено'); }
                                    });
                                } else { Lampa.Noty.show('Плеєр не знайдено'); }
                            });
                        } else { Lampa.Noty.show('Фільм не знайдено на сайті'); }
                    }, function() {
                        Lampa.Loading.stop();
                        Lampa.Noty.show('Помилка запиту');
                    });
                });

                // Знаходимо блок кнопок (де "Дивитись", "Закладки")
                var container = html_node.querySelector('.full-start__buttons');
                if (container) {
                    container.appendChild(btn);
                    // Оновлюємо пульт
                    if (Lampa.Controller.update) Lampa.Controller.update();
                }
            }
        });
    };

    // Безпечний запуск
    var interval = setInterval(function () {
        if (typeof Lampa !== 'undefined') {
            clearInterval(interval);
            try {
                start();
            } catch (err) { }
        }
    }, 500);
})();
