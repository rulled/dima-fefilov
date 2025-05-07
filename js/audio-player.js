document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('nav .nav-links');
    const aboutImage = document.querySelector('.about-image');

    // Responsive Header: Toggle nav menu
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('nav-open'); 
        });
    }

    // Responsive Header: Sticky shrink on scroll
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 50) { 
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, false);

    // 3D Tilt Effect for About Image - Conditional based on screen size
    if (aboutImage) { 
        const mediaQuery = window.matchMedia('(min-width: 769px)');

        function handleTiltEffect(e) {
            const rect = aboutImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * 7;
            const rotateY = -((x - centerX) / centerX) * 7;
            aboutImage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        }

        function resetTiltEffect() {
            aboutImage.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        }

        function setupTiltListeners() {
            if (mediaQuery.matches) {
                aboutImage.style.transition = 'transform 0.1s ease-out'; 
                aboutImage.addEventListener('mousemove', handleTiltEffect);
                aboutImage.addEventListener('mouseleave', resetTiltEffect);
            } else {
                aboutImage.removeEventListener('mousemove', handleTiltEffect);
                aboutImage.removeEventListener('mouseleave', resetTiltEffect);
                aboutImage.style.transform = ''; 
                aboutImage.style.transition = ''; 
            }
        }

        setupTiltListeners(); 
        mediaQuery.addEventListener('change', setupTiltListeners); 
    }

    const audioElements = document.querySelectorAll('audio');
    const playButtons = document.querySelectorAll('.play-button');
    const comparisonToggleBtns = document.querySelectorAll('.comparison-toggle');
    
    let currentlyPlaying = null;
    
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
    
    if ('IntersectionObserver' in window) {
        observeElements();
    }
    
    comparisonToggleBtns.forEach(btn => {
        btn.setAttribute('data-state', 'before');
        initializeComparisonToggle(btn);
    });
    
    audioElements.forEach(audio => {
        const trackId = audio.id;
        const progressBar = document.getElementById(`progress-${trackId}`);
        const timeDisplay = audio.parentElement.querySelector('.time');
        const playButton = document.querySelector(`.play-button[data-player="${trackId}"]`);
        const progressContainer = audio.parentElement.querySelector('.progress-container');
        const volumeControl = audio.parentElement.querySelector('.volume-control');
        const volumeSlider = volumeControl?.querySelector('.volume-slider');
        
        if (audio.hasAttribute('data-before') && audio.hasAttribute('data-after')) {
            audio.src = audio.getAttribute('data-before');
        }
        
        initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeControl, volumeSlider);
    });
    
    function initializeComparisonToggle(toggleBtn) {
        const trackId = toggleBtn.getAttribute('data-track-id');
        const audio = document.getElementById(trackId);
        
        toggleBtn.addEventListener('click', () => {
            const currentState = toggleBtn.getAttribute('data-state');
            const isPlaying = !audio.paused;
            const currentTime = audio.currentTime;
            
            toggleBtn.classList.add('switching');
            
            if (currentState === 'before') {
                toggleBtn.setAttribute('data-state', 'after');
                audio.src = audio.getAttribute('data-after');
            } else {
                toggleBtn.setAttribute('data-state', 'before');
                audio.src = audio.getAttribute('data-before');
            }
            
            audio.addEventListener('loadedmetadata', function onceLoaded() {
                audio.currentTime = currentTime;
                if (isPlaying) {
                    audio.play().catch(e => console.error('Ошибка воспроизведения:', e));
                }
                audio.removeEventListener('loadedmetadata', onceLoaded);
                
                setTimeout(() => {
                    toggleBtn.classList.remove('switching');
                }, 300);
            });
        });
    }
    
    function initializePlayer(audio, playButton, progressBar, progressContainer, timeDisplay, volumeControl, volumeSlider) {
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                if (currentlyPlaying && currentlyPlaying !== audio) {
                    currentlyPlaying.pause();
                    const oldPlayButton = document.querySelector(`.play-button[data-player="${currentlyPlaying.id}"]`);
                    if (oldPlayButton) oldPlayButton.classList.remove('playing');
                    const oldTrackCard = oldPlayButton?.closest('.track-card');
                    if (oldTrackCard) oldTrackCard.classList.remove('playing-card');
                }
                
                const trackCard = playButton.closest('.track-card');
                if (trackCard) {
                    trackCard.classList.add('playing-card');
                }
                
                audio.play().catch(error => {
                    console.error('Ошибка воспроизведения:', error);
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
                
                const trackCard = playButton.closest('.track-card');
                if (trackCard) {
                    trackCard.classList.remove('playing-card');
                }
            }
        });
        
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
                
                const minutes = Math.floor(audio.currentTime / 60);
                const seconds = Math.floor(audio.currentTime % 60);
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        });
        
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            
            if (audio.duration) {
                audio.currentTime = percentage * audio.duration;
            }
        });
        
        let isDragging = false;
        
        progressContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateProgressFromTouch(e);
        }, { passive: true });
        
        progressContainer.addEventListener('touchmove', (e) => {
            if (isDragging) {
                updateProgressFromTouch(e);
            }
        }, { passive: true });
        
        window.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
        
        function updateProgressFromTouch(e) {
            if (!e.touches[0]) return;
            
            const rect = progressContainer.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const width = rect.width;
            let percentage = touchX / width;
            
            percentage = Math.max(0, Math.min(1, percentage));
            
            if (audio.duration) {
                audio.currentTime = percentage * audio.duration;
            }
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                const volumeValue = parseFloat(volumeSlider.value);
                audio.volume = volumeValue;
                localStorage.setItem('audio-volume', volumeValue);
                
                document.querySelectorAll('.volume-slider').forEach(slider => {
                    if (slider !== volumeSlider) slider.value = volumeValue;
                });
                document.querySelectorAll('audio').forEach(otherAudio => {
                    if (otherAudio !== audio) otherAudio.volume = volumeValue;
                });
            });
            
            const savedVolume = localStorage.getItem('audio-volume');
            if (savedVolume !== null) {
                volumeSlider.value = savedVolume;
                audio.volume = savedVolume;
            } else {
                volumeSlider.value = "0.8";
                audio.volume = 0.8;
            }
        }
        
        audio.addEventListener('ended', () => {
            playButton.classList.remove('playing');
            progressBar.style.width = '0%';
            timeDisplay.textContent = '00:00';
            currentlyPlaying = null;
            
            const trackCard = playButton.closest('.track-card');
            if (trackCard) {
                trackCard.classList.remove('playing-card');
            }
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Ошибка загрузки аудио:', e);
            // Consider a more user-friendly error message on the UI itself
            // alert(`Ошибка загрузки трека: ${audio.src}`);
        });
        
        const totalTimeDisplay = audio.parentElement.querySelector('.total-time');
        audio.addEventListener('loadedmetadata', () => {
            const totalDuration = audio.duration;
            if (isFinite(totalDuration)) {
                const totalMinutes = Math.floor(totalDuration / 60);
                const totalSeconds = Math.floor(totalDuration % 60);
                const formattedTotalTime = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
                if (totalTimeDisplay) totalTimeDisplay.textContent = ` / ${formattedTotalTime}`;
            } else {
                 if (totalTimeDisplay) totalTimeDisplay.textContent = ` / --:--`;
            }
            timeDisplay.textContent = `00:00`;
        });
        
        const volumeButton = volumeControl?.querySelector('.volume-button');
        const volumeSliderContainer = volumeControl?.querySelector('.volume-slider-container');

        if (volumeButton && volumeSliderContainer) {
            volumeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                volumeSliderContainer.classList.toggle('active');
            });
            
            // Changed mousedown to click for better cross-device compatibility
            document.addEventListener('click', (e) => {
                if (volumeSliderContainer.classList.contains('active') && !volumeControl.contains(e.target)) {
                    volumeSliderContainer.classList.remove('active');
                }
            });
            
            if (volumeSlider) { // Ensure volumeSlider exists before adding listeners
                volumeSlider.addEventListener('input', (e) => {
                    e.stopPropagation();
                });
                
                volumeSlider.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                
                volumeSlider.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                }, { passive: true });
            }
        }
    }
    
    document.querySelectorAll('.audio-player').forEach(player => {
        player.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
    
    // Passive touchstart for performance on scroll, etc.
    document.addEventListener('touchstart', () => {}, { passive: true });
});