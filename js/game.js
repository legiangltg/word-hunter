/* ============================================
   GAME ENGINE - Main game loop & logic
   ============================================ */
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GameState.MENU;
        this.lastTime = 0;
        this.running = false;

        // Subsystems
        this.starfield = new StarField(canvas);
        this.particles = new ParticleSystem();
        this.player = new Player(canvas);
        this.enemies = new EnemyManager(canvas);
        this.audio = new AudioManager();

        // Game data
        this.wordData = typeof WORD_DATA !== 'undefined' ? WORD_DATA : [];
        this.languages = {};
        this.currentLang = 'vi';
        this.translations = {};

        // Stats
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsDestroyed = 0;
        this.totalKeysPressed = 0;
        this.correctKeys = 0;
        this.startTime = 0;
        this.missedWords = [];
        this.highScore = parseInt(localStorage.getItem('wordHunterHighScore') || '0');

        // Screen shake
        this.shakeAmount = 0;
        this.shakeDuration = 0;

        // Wave transition overlay
        this.waveOverlay = null;

        this._boundLoop = this._loop.bind(this);
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    registerLanguage(code, langData) {
        this.languages[code] = langData;
        // Add option to language selector
        const select = document.getElementById('langSelect');
        if (select && !select.querySelector(`option[value="${code}"]`)) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = `${langData.meta.flag} ${langData.meta.name}`;
            select.appendChild(opt);
        }
        // Default to first registered language
        if (!this.translations || Object.keys(this.translations).length === 0) {
            this.currentLang = code;
            this.translations = langData.translations;
        }
    }

    setLanguage(code) {
        if (this.languages[code]) {
            this.currentLang = code;
            this.translations = this.languages[code].translations;
        }
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.player.resize();
        this.starfield.resize();
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._boundLoop);
    }

    startGame() {
        this.audio.init();
        this.audio.resume();
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsDestroyed = 0;
        this.totalKeysPressed = 0;
        this.correctKeys = 0;
        this.missedWords = [];
        this.startTime = Date.now();
        this.enemies.reset();
        this.enemies.setDifficulty(
            document.getElementById('difficultySelect')?.value || 'normal'
        );
        this.enemies.buildWordPool(this.wordData, this.translations);
        this.particles.clear();
        this.player.lasers = [];
        this.waveOverlay = null;

        this._showScreen('gameHUD');
    }

    pause() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.PAUSED;
        this.audio.pauseMusic();
        this._showScreen('pauseScreen');
    }

    resume() {
        if (this.state !== GameState.PAUSED) return;
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        this.audio.resumeMusic();
        this._hideScreen('pauseScreen');
    }

    quit() {
        this.state = GameState.MENU;
        this.audio.stopMusic();
        this._hideScreen('pauseScreen');
        this._hideScreen('gameHUD');
        this._showScreen('menuScreen');
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('wordHunterHighScore', this.highScore.toString());
        }
        // Update game over UI
        this._updateGameOverUI();
        this._hideScreen('gameHUD');
        this._showScreen('gameOverScreen');
    }

    handleKeyPress(key) {
        if (this.state !== GameState.PLAYING) return;

        const char = key.toLowerCase();
        if (!/^[a-z]$/.test(char)) return;

        this.totalKeysPressed++;
        const target = this.enemies.activeTarget;

        if (target) {
            // Already targeting an enemy
            if (target.nextChar === char) {
                this._hitChar(target);
            } else {
                this._missChar();
            }
        } else {
            // Find new target
            const newTarget = this.enemies.findTarget(char);
            if (newTarget) {
                newTarget.isTarget = true;
                this.enemies.activeTarget = newTarget;
                this._hitChar(newTarget);
            } else {
                this._missChar();
            }
        }

        this._updateHUD();
    }

    _hitChar(enemy) {
        this.correctKeys++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // Fire laser
        this.player.fireLaser(enemy.x, enemy.y);
        this.audio.playLaser();
        this.particles.createLaserSpark(enemy.x, enemy.y - 15);

        // Score: base + combo bonus
        const comboBonus = Math.min(this.combo, 50);
        this.score += 10 + comboBonus;

        const wordComplete = enemy.typeChar();

        if (wordComplete) {
            this._destroyEnemy(enemy);
        }

        this._updateHUD();
    }

    _missChar() {
        this.audio.playError();
        this.combo = 0;
        this._updateHUD();
    }

    _destroyEnemy(enemy) {
        // Explosion!
        this.audio.playExplosion();
        this.particles.createExplosion(enemy.x, enemy.y, 25);
        this.particles.createLetterDebris(enemy.x, enemy.y - 20, enemy.word);
        this.particles.createTranslationPopup(enemy.x, enemy.y - 50, enemy.translation);

        // Bonus points for completing word
        this.score += enemy.word.length * 5;
        this.wordsDestroyed++;

        enemy.alive = false;
        enemy.isTarget = false;
        this.enemies.activeTarget = null;
        this.enemies.removeEnemy(enemy);

        // Screen shake
        this.shakeAmount = 4;
        this.shakeDuration = 0.15;
    }

    _damagePlayer(enemy) {
        this.lives--;
        this.audio.playExplosion();
        this.particles.createExplosion(enemy.x, enemy.y, 15, ['#ff4444', '#ff0000']);
        this.shakeAmount = 8;
        this.shakeDuration = 0.3;

        // Track missed words
        this.missedWords.push({ en: enemy.word, tr: enemy.translation });

        // If this was the active target, clear it
        if (this.enemies.activeTarget === enemy) {
            this.enemies.activeTarget = null;
        }
        this.enemies.removeEnemy(enemy);
        this.combo = 0;

        if (this.lives <= 0) {
            this.gameOver();
        }
        this._updateHUD();
    }

    _loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap at 50ms
        this.lastTime = timestamp;

        this._update(dt);
        this._draw();

        requestAnimationFrame(this._boundLoop);
    }

    _update(dt) {
        // Always update starfield (even in menu)
        this.starfield.update(dt);

        if (this.state !== GameState.PLAYING) return;

        // Update subsystems
        this.player.update(dt, this.particles);
        this.enemies.update(dt, this.wordData, this.translations);
        this.particles.update(dt);

        // Check wave change
        const prevWave = this.enemies.wave;
        if (this.enemies.betweenWaves && !this.waveOverlay) {
            this.waveOverlay = { text: `WAVE ${prevWave + 1}`, life: 2, maxLife: 2 };
            this.audio.playLevelUp();
        }
        if (this.waveOverlay) {
            this.waveOverlay.life -= dt;
            if (this.waveOverlay.life <= 0) {
                this.waveOverlay = null;
            }
        }

        // Screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            if (this.shakeDuration <= 0) {
                this.shakeAmount = 0;
            }
        }

        // Check enemies reaching bottom
        const bottomEnemies = this.enemies.getEnemiesAtBottom(this.height - 50);
        for (const enemy of bottomEnemies) {
            this._damagePlayer(enemy);
        }

        // Update HUD wave display
        document.getElementById('hudWave').textContent = this.enemies.wave;
    }

    _draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.save();

        // Screen shake offset
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount * 2;
            const sy = (Math.random() - 0.5) * this.shakeAmount * 2;
            ctx.translate(sx, sy);
        }

        // Clear
        ctx.fillStyle = '#060612';
        ctx.fillRect(-10, -10, w + 20, h + 20);

        // Background gradient
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        bgGrad.addColorStop(0, 'rgba(15, 10, 40, 1)');
        bgGrad.addColorStop(1, 'rgba(6, 6, 18, 1)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-10, -10, w + 20, h + 20);

        // Starfield
        this.starfield.draw(ctx);

        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
            // Enemies
            this.enemies.draw(ctx);

            // Player
            this.player.draw(ctx);

            // Particles (on top)
            this.particles.draw(ctx);

            // Wave overlay
            if (this.waveOverlay) {
                const alpha = this.waveOverlay.life > 1.5 
                    ? (2 - this.waveOverlay.life) * 2 
                    : Math.min(1, this.waveOverlay.life / 1.5);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 48px "Orbitron"';
                ctx.fillStyle = '#00ffd5';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#00ffd5';
                ctx.shadowBlur = 30;
                ctx.fillText(this.waveOverlay.text, w / 2, h / 2 - 50);
                ctx.restore();
            }
        }

        ctx.restore();
    }

    _updateHUD() {
        document.getElementById('hudScore').textContent = this.score.toLocaleString();
        document.getElementById('hudWave').textContent = this.enemies.wave;

        // WPM calculation
        const elapsed = (Date.now() - this.startTime) / 60000; // minutes
        const wpm = elapsed > 0 ? Math.round(this.wordsDestroyed / elapsed) : 0;
        document.getElementById('hudWpm').textContent = wpm;

        // Accuracy
        const accuracy = this.totalKeysPressed > 0
            ? Math.round((this.correctKeys / this.totalKeysPressed) * 100)
            : 100;
        document.getElementById('hudAccuracy').textContent = accuracy + '%';

        // Combo
        const comboEl = document.getElementById('hudCombo');
        if (this.combo >= 3) {
            comboEl.classList.remove('hidden');
            comboEl.querySelector('.combo-count').textContent = this.combo;
        } else {
            comboEl.classList.add('hidden');
        }

        // Lives
        let livesStr = '';
        for (let i = 0; i < this.maxLives; i++) {
            livesStr += i < this.lives ? '♥ ' : '♡ ';
        }
        document.getElementById('hudLives').textContent = livesStr.trim();

        // Current input
        const target = this.enemies.activeTarget;
        if (target) {
            document.getElementById('hudInput').textContent = target.word.substring(0, target.typedIndex) + '_';
        } else {
            document.getElementById('hudInput').textContent = '';
        }
    }

    _updateGameOverUI() {
        const elapsed = (Date.now() - this.startTime) / 60000;
        const wpm = elapsed > 0 ? Math.round(this.wordsDestroyed / elapsed) : 0;
        const accuracy = this.totalKeysPressed > 0
            ? Math.round((this.correctKeys / this.totalKeysPressed) * 100)
            : 100;

        document.getElementById('goScore').textContent = this.score.toLocaleString();
        document.getElementById('goWave').textContent = this.enemies.wave;
        document.getElementById('goWords').textContent = this.wordsDestroyed;
        document.getElementById('goWpm').textContent = wpm;
        document.getElementById('goAccuracy').textContent = accuracy + '%';
        document.getElementById('goCombo').textContent = this.maxCombo;
        document.getElementById('menuHighScore').textContent = this.highScore.toLocaleString();

        // Missed words list
        const list = document.getElementById('missedWordsList');
        const section = document.getElementById('missedWordsSection');
        list.innerHTML = '';
        if (this.missedWords.length > 0) {
            section.style.display = 'block';
            this.missedWords.forEach(w => {
                const div = document.createElement('div');
                div.className = 'missed-word-item';
                div.innerHTML = `<span class="en">${w.en}</span> → <span class="tr">${w.tr}</span>`;
                list.appendChild(div);
            });
        } else {
            section.style.display = 'none';
        }
    }

    _showScreen(id) {
        document.getElementById(id)?.classList.add('active');
    }

    _hideScreen(id) {
        document.getElementById(id)?.classList.remove('active');
    }
}
