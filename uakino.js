(function () {
    'use strict';

    var start = function () {
        var network = new Lampa.Reguest();
        var base_url = 'https://uakino.best/';

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.render();
                
                // Перевірка, щоб не дублювати кнопку
                if (render[0].querySelector('.view--uakino')) return;

                // Створюємо кнопку у стилі вашого нового інтерфейсу
                var btn = document.createElement('div');
                btn.className = 'full-start__button selector view--uakino';
                // Додаємо стиль, щоб вона виглядала як сусідні кнопки
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                btn.style.borderRadius = '12px';
                btn.style.marginLeft = '10px';
                btn.style.padding = '0 20px';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.height = '3.5rem';
                btn.innerHTML = '<span style="font-weight: 500;">UAKino</span>';

                btn.addEventListener('click', function () {
                    var title = e.data.movie.title || e.data.movie.name;
                    Lampa.Loading.start();

                    var search_url = base_url + 'index.php?do=search&subaction=search&story=' + encodeURIComponent(title);
                    
                    network.native(search_url, function (html) {
                        Lampa.Loading.stop();
                        // Шукаємо посилання на сторінку фільму
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
                        } else { Lampa.Noty.show('На сайті uakino нічого не знайдено'); }
                    }, function() {
                        Lampa.Loading.stop();
                        Lampa.Noty.show('Помилка мережі');
                    });
                });

                // --- НОВЕ МІСЦЕ ВСТАВКИ ДЛЯ LAMPA 7 ---
                // Шукаємо контейнер, де лежать кнопки (Дивитись, Закладки тощо)
                var container = render[0].querySelector('.full-start__buttons');
                
                if (container) {
                    // Вставляємо ПІСЛЯ кнопки "Дивитись" (вона зазвичай перша)
                    container.appendChild(btn);
                    
                    // Оновлюємо навігацію пульта, щоб він бачив нову кнопку
                    if (Lampa.Controller.update) Lampa.Controller.update();
                }
            }
        });
    };

    // Очікування готовності Lampa
    var wait = setInterval(function () {
        if (typeof Lampa !== 'undefined') {
            clearInterval(wait);
            try {
                start();
            } catch (e) { }
        }
    }, 500);
})();
