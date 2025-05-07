document.addEventListener('DOMContentLoaded', () => {
    // Инициализация аудио-плееров
    const audioElements = document.querySelectorAll('audio');
    const playButtons = document.querySelectorAll('.play-button');
    const comparisonToggleBtns = document.querySelectorAll('.comparison-toggle');
    
    // Глобальная переменная для текущего проигрываемого плеера
    let currentlyPlaying = null;
    
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
        const volumeSlider = audio.parentElement.querySelector('.volume-slider');
        
        // Установка начального источника аудио
        // Проверяем, имеет ли этот трек атрибуты "до" и "после"
        if (audio.hasAttribute('data-before') && audio.hasAttribute('data-after')) {
            audio.src = audio.getAttribute('data-before');
        }
        // Если нет атрибутов "до" и "после", то src уже должен быть установлен в HTML
        
        // Инициализация обработчиков событий для плеера
        initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeSlider);
    });
    
    // Функция инициализации переключателя версий трека
    function initializeComparisonToggle(toggleBtn) {
        const trackId = toggleBtn.getAttribute('data-track-id');
        const audio = document.getElementById(trackId);
        
        toggleBtn.addEventListener('click', () => {
            const currentState = toggleBtn.getAttribute('data-state');
            const isPlaying = !audio.paused;
            const currentTime = audio.currentTime;
            
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
                    audio.play();
                }
                audio.removeEventListener('loadedmetadata', onceLoaded);
            });
        });
    }
    
    // Функция инициализации аудио-плеера
    function initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeSlider) {
        // Обработчик нажатия кнопки воспроизведения
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                // Если какой-то трек уже играет, останавливаем его
                if (currentlyPlaying && currentlyPlaying !== audio) {
                    currentlyPlaying.pause();
                    document.querySelector(`.play-button[data-player="${currentlyPlaying.id}"]`).classList.remove('playing');
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
        
        // Регулировка громкости
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                audio.volume = volumeSlider.value;
            });
            
            // Установка начальной громкости
            audio.volume = volumeSlider.value;
        }
        
        // Обработка окончания трека
        audio.addEventListener('ended', () => {
            playButton.classList.remove('playing');
            progressBar.style.width = '0%';
            timeDisplay.textContent = '00:00';
            currentlyPlaying = null;
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
    }
}); 