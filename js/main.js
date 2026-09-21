/* ============================================
   MAIN - Entry point & event wiring
   ============================================ */
(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // Register Vietnamese language
    if (typeof LANG_VI !== 'undefined') {
        game.registerLanguage('vi', LANG_VI);
    }

    // Load settings from localStorage
    const savedUrl = localStorage.getItem('wordHunterYoutubeUrl');
    const savedLang = localStorage.getItem('wordHunterLang');
    const savedDifficulty = localStorage.getItem('wordHunterDifficulty');
    const savedSfxVol = localStorage.getItem('wordHunterSfxVol');
    const savedMusicVol = localStorage.getItem('wordHunterMusicVol');

    if (savedUrl) document.getElementById('youtubeUrl').value = savedUrl;
    if (savedLang) {
        document.getElementById('langSelect').value = savedLang;
        game.setLanguage(savedLang);
    }
    if (savedDifficulty) document.getElementById('difficultySelect').value = savedDifficulty;
    if (savedSfxVol) {
        document.getElementById('sfxVolume').value = savedSfxVol;
        document.getElementById('sfxVolumeLabel').textContent = savedSfxVol;
        game.audio.setSfxVolume(parseInt(savedSfxVol) / 100);
    }
    if (savedMusicVol) {
        document.getElementById('musicVolume').value = savedMusicVol;
        document.getElementById('musicVolumeLabel').textContent = savedMusicVol;
        game.audio.setMusicVolume(parseInt(savedMusicVol) / 100);
    }

    // Update high score display
    document.getElementById('menuHighScore').textContent = game.highScore.toLocaleString();

    // --- Button Event Listeners ---
    document.getElementById('btnStart').addEventListener('click', () => {
        game.startGame();
        // Auto-play YouTube music if URL is set
        const url = document.getElementById('youtubeUrl').value;
        if (url) {
            game.audio.playMusic(url);
        }
    });

    document.getElementById('btnSettings').addEventListener('click', () => {
        game._hideScreen('menuScreen');
        game._showScreen('settingsScreen');
    });

    document.getElementById('btnBackToMenu').addEventListener('click', () => {
        // Save settings
        localStorage.setItem('wordHunterYoutubeUrl', document.getElementById('youtubeUrl').value);
        localStorage.setItem('wordHunterLang', document.getElementById('langSelect').value);
        localStorage.setItem('wordHunterDifficulty', document.getElementById('difficultySelect').value);
        localStorage.setItem('wordHunterSfxVol', document.getElementById('sfxVolume').value);
        localStorage.setItem('wordHunterMusicVol', document.getElementById('musicVolume').value);

        game._hideScreen('settingsScreen');
        game._showScreen('menuScreen');
    });

    document.getElementById('btnPause').addEventListener('click', () => {
        game.pause();
    });

    document.getElementById('btnResume').addEventListener('click', () => {
        game.resume();
    });

    document.getElementById('btnQuit').addEventListener('click', () => {
        game.quit();
    });

    document.getElementById('btnPlayAgain').addEventListener('click', () => {
        game._hideScreen('gameOverScreen');
        game.startGame();
        const url = document.getElementById('youtubeUrl').value;
        if (url) game.audio.playMusic(url);
    });

    document.getElementById('btnBackMenu').addEventListener('click', () => {
        game._hideScreen('gameOverScreen');
        game._showScreen('menuScreen');
        game.state = GameState.MENU;
    });

    // --- Settings Controls ---
    document.getElementById('langSelect').addEventListener('change', (e) => {
        game.setLanguage(e.target.value);
    });

    document.getElementById('sfxVolume').addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        document.getElementById('sfxVolumeLabel').textContent = v;
        game.audio.setSfxVolume(v / 100);
    });

    document.getElementById('musicVolume').addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        document.getElementById('musicVolumeLabel').textContent = v;
        game.audio.setMusicVolume(v / 100);
    });

    document.getElementById('btnMusicPlay').addEventListener('click', () => {
        game.audio.init();
        const url = document.getElementById('youtubeUrl').value;
        if (url) {
            game.audio.playMusic(url);
            localStorage.setItem('wordHunterYoutubeUrl', url);
        }
    });

    document.getElementById('btnMusicPause').addEventListener('click', () => {
        game.audio.pauseMusic();
    });

    // --- Keyboard Input ---
    document.addEventListener('keydown', (e) => {
        // Prevent default for game keys when playing
        if (game.state === GameState.PLAYING) {
            if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                e.preventDefault();
                game.handleKeyPress(e.key);
            }
            if (e.key === 'Escape') {
                game.pause();
            }
        } else if (game.state === GameState.PAUSED) {
            if (e.key === 'Escape') {
                game.resume();
            }
        } else if (game.state === GameState.MENU) {
            if (e.key === 'Enter') {
                document.getElementById('btnStart').click();
            }
        }
    });

    // Prevent focus issues with settings inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
    });

    // --- Start the render loop ---
    game.start();
})();
