document.addEventListener('DOMContentLoaded', () => {
    // Инициализация аудио-плееров
    const audioElements = document.querySelectorAll('audio');
    const playButtons = document.querySelectorAll('.play-button');
    const comparisonToggleBtns = document.querySelectorAll('.comparison-toggle');
    
    // Глобальная переменная для текущего проигрываемого плеера
    let currentlyPlaying = null;
    
    // Добавляем анимацию для карточек при прокрутке
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.track-card').forEach(card => {
            observer.observe(card);
        });
    };
    
    // Вызываем функцию анимации при прокрутке, если поддерживается
    if ('IntersectionObserver' in window) {
        observeElements();
    }
    
    // Инициализация всех переключателей сравнения
    comparisonToggleBtns.forEach(btn => {
        btn.setAttribute('data-state', 'before');
        initializeComparisonToggle(btn);
    });
    
    // Инициализация всех плееров
    audioElements.forEach(audio => {
        const trackId = audio.id;
        const progressBar = document.getElementById(`progress-${trackId}`);
        const timeDisplay = audio.parentElement.querySelector('.time');
        const playButton = document.querySelector(`.play-button[data-player="${trackId}"]`);
        const progressContainer = audio.parentElement.querySelector('.progress-container');
        const volumeControl = audio.parentElement.querySelector('.volume-control');
        const volumeSlider = volumeControl?.querySelector('.volume-slider');
        
        // Установка начального источника аудио
        // Проверяем, имеет ли этот трек атрибуты "до" и "после"
        if (audio.hasAttribute('data-before') && audio.hasAttribute('data-after')) {
            audio.src = audio.getAttribute('data-before');
        }
        // Если нет атрибутов "до" и "после", то src уже должен быть установлен в HTML
        
        // Инициализация обработчиков событий для плеера
        initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeControl, volumeSlider);
    });
    
    // Функция инициализации переключателя версий трека
    function initializeComparisonToggle(toggleBtn) {
        const trackId = toggleBtn.getAttribute('data-track-id');
        const audio = document.getElementById(trackId);
        
        toggleBtn.addEventListener('click', () => {
            const currentState = toggleBtn.getAttribute('data-state');
            const isPlaying = !audio.paused;
            const currentTime = audio.currentTime;
            
            // Добавляем анимацию для переключения
            toggleBtn.classList.add('switching');
            
            // Переключаем состояние
            if (currentState === 'before') {
                toggleBtn.setAttribute('data-state', 'after');
                audio.src = audio.getAttribute('data-after');
            } else {
                toggleBtn.setAttribute('data-state', 'before');
                audio.src = audio.getAttribute('data-before');
            }
            
            // Восстанавливаем время воспроизведения и состояние проигрывания
            audio.addEventListener('loadedmetadata', function onceLoaded() {
                audio.currentTime = currentTime;
                if (isPlaying) {
                    audio.play().catch(e => console.error('Ошибка воспроизведения:', e));
                }
                audio.removeEventListener('loadedmetadata', onceLoaded);
                
                // Удаляем класс анимации после завершения
                setTimeout(() => {
                    toggleBtn.classList.remove('switching');
                }, 300);
            });
        });
    }
    
    // Функция инициализации аудио-плеера
    function initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeControl, volumeSlider) {
        // Обработчик нажатия кнопки воспроизведения
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                // Если какой-то трек уже играет, останавливаем его
                if (currentlyPlaying && currentlyPlaying !== audio) {
                    currentlyPlaying.pause();
                    document.querySelector(`.play-button[data-player="${currentlyPlaying.id}"]`).classList.remove('playing');
                }
                
                // Добавляем анимацию для карточки при воспроизведении
                const trackCard = playButton.closest('.track-card');
                if (trackCard) {
                    trackCard.classList.add('playing-card');
                }
                
                audio.play().catch(error => {
                    console.error('Ошибка воспроизведения:', error);
                    // Добавляем обработку ошибок воспроизведения
                    if (error.name === 'NotAllowedError') {
                        alert('Автоматическое воспроизведение заблокировано браузером. Пожалуйста, взаимодействуйте со страницей для продолжения.');
                    }
                });
                playButton.classList.add('playing');
                currentlyPlaying = audio;
            } else {
                audio.pause();
                playButton.classList.remove('playing');
                currentlyPlaying = null;
                
                // Удаляем анимацию карточки при паузе
                const trackCard = playButton.closest('.track-card');
                if (trackCard) {
                    trackCard.classList.remove('playing-card');
                }
            }
        });
        
        // Обновление прогресс-бара во время воспроизведения
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
                
                // Обновление отображения времени
                const minutes = Math.floor(audio.currentTime / 60);
                const seconds = Math.floor(audio.currentTime % 60);
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        });
        
        // Перемотка трека при клике на прогресс-бар
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            
            if (audio.duration) {
                audio.currentTime = percentage * audio.duration;
            }
        });
        
        // Дополнительное слежение за прогресс-баром для мобильных устройств
        let isDragging = false;
        
        progressContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateProgressFromTouch(e);
        });
        
        window.addEventListener('touchmove', (e) => {
            if (isDragging) {
                updateProgressFromTouch(e);
            }
        });
        
        window.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        function updateProgressFromTouch(e) {
            if (!e.touches[0]) return;
            
            const rect = progressContainer.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const width = rect.width;
            let percentage = touchX / width;
            
            // Убедимся, что значение находится в пределах от 0 до 1
            percentage = Math.max(0, Math.min(1, percentage));
            
            if (audio.duration) {
                audio.currentTime = percentage * audio.duration;
            }
        }
        
        // Регулировка громкости
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                audio.volume = volumeSlider.value;
                
                // Сохраняем громкость в localStorage для всех плееров
                localStorage.setItem('audio-volume', volumeSlider.value);
                
                // Обновляем громкость на всех остальных плеерах
                document.querySelectorAll('.volume-slider').forEach(slider => {
                    slider.value = volumeSlider.value;
                });
                document.querySelectorAll('audio').forEach(otherAudio => {
                    otherAudio.volume = volumeSlider.value;
                });
            });
            
            // Восстанавливаем сохраненную громкость или устанавливаем начальную
            const savedVolume = localStorage.getItem('audio-volume');
            if (savedVolume !== null) {
                volumeSlider.value = savedVolume;
                audio.volume = savedVolume;
            } else {
                audio.volume = volumeSlider.value;
            }
        }
        
        // Обработка окончания трека
        audio.addEventListener('ended', () => {
            playButton.classList.remove('playing');
            progressBar.style.width = '0%';
            timeDisplay.textContent = '00:00';
            currentlyPlaying = null;
            
            // Удаляем анимацию карточки при окончании
            const trackCard = playButton.closest('.track-card');
            if (trackCard) {
                trackCard.classList.remove('playing-card');
            }
        });
        
        // Обработка ошибок загрузки аудио
        audio.addEventListener('error', (e) => {
            console.error('Ошибка загрузки аудио:', e);
            alert(`Ошибка загрузки трека: ${audio.src}`);
        });
        
        // Предзагрузка метаданных для правильного отображения времени
        audio.addEventListener('loadedmetadata', () => {
            const totalMinutes = Math.floor(audio.duration / 60);
            const totalSeconds = Math.floor(audio.duration % 60);
            timeDisplay.textContent = `00:00`;
        });
        
        // Оптимизация для мобильных устройств
        if ('ontouchstart' in window) {
            // Обеспечиваем интерактивность регулятора громкости на мобильных
            if (volumeControl) {
                volumeControl.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    volumeControl.classList.add('touched');
                });
                
                document.addEventListener('touchend', () => {
                    setTimeout(() => {
                        volumeControl.classList.remove('touched');
                    }, 1500); // Задержка, чтобы пользователь успел взаимодействовать
                });
            }
        }
    }
    
    // Дополнительные улучшения UI
    // Отключаем контекстное меню для аудио-контролов
    document.querySelectorAll('.audio-player').forEach(player => {
        player.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
    
    // Оптимизация для iOS Safari
    document.addEventListener('touchstart', () => {}, { passive: true });
}); 