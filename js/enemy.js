/* ============================================
   ENEMY - Enemy ships with word display
   ============================================ */
class Enemy {
    constructor(x, y, word, translation, speed) {
        this.x = x;
        this.y = y;
        this.word = word.toLowerCase();
        this.translation = translation;
        this.speed = speed;
        this.typedIndex = 0; // How many chars have been typed
        this.isTarget = false; // Currently being targeted
        this.alive = true;
        this.width = 24;
        this.height = 24;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 1 + Math.random() * 2;
        this.wobbleAmp = 0.3 + Math.random() * 0.5;
        this.glowPhase = Math.random() * Math.PI * 2;
        // Movement pattern
        this.baseX = x;
        this.movePattern = Math.floor(Math.random() * 3); // 0=straight, 1=sine, 2=zigzag
        this.moveTimer = 0;
    }

    update(dt) {
        this.moveTimer += dt;
        this.wobble += this.wobbleSpeed * dt;
        this.glowPhase += dt * 3;

        // Movement patterns
        switch (this.movePattern) {
            case 0: // Straight down
                this.y += this.speed * dt * 60;
                break;
            case 1: // Sine wave
                this.y += this.speed * dt * 60;
                this.x = this.baseX + Math.sin(this.moveTimer * 2) * 40;
                break;
            case 2: // Gentle drift
                this.y += this.speed * dt * 60;
                this.x = this.baseX + Math.sin(this.moveTimer * 0.8) * 20;
                break;
        }
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y;
        const glow = 0.6 + 0.4 * Math.sin(this.glowPhase);

        ctx.save();
        ctx.translate(x, y);

        // Enemy ship body
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-8, -12);
        ctx.lineTo(0, -8);
        ctx.lineTo(8, -12);
        ctx.lineTo(15, -5);
        ctx.closePath();

        const shipColor = this.isTarget ? '#ff4444' : '#aa3355';
        const grad = ctx.createLinearGradient(0, -12, 0, 15);
        grad.addColorStop(0, shipColor);
        grad.addColorStop(1, '#331122');
        ctx.fillStyle = grad;
        ctx.fill();

        if (this.isTarget) {
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 15 * glow;
        }
        ctx.strokeStyle = this.isTarget
            ? `rgba(255, 68, 68, ${glow})`
            : `rgba(170, 51, 85, ${glow * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core light
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.isTarget
            ? `rgba(255, 100, 100, ${glow})`
            : `rgba(200, 80, 120, ${glow * 0.7})`;
        ctx.fill();

        ctx.restore();

        // Draw word above enemy
        this.drawWord(ctx);
    }

    drawWord(ctx) {
        const word = this.word;
        const fontSize = 16;
        ctx.font = `bold ${fontSize}px "JetBrains Mono"`;
        const metrics = ctx.measureText(word);
        const textWidth = metrics.width;
        const textX = this.x - textWidth / 2;
        const textY = this.y - 24;

        // Background pill
        ctx.save();
        const padding = 6;
        const pillX = textX - padding;
        const pillY = textY - fontSize + 2 - padding / 2;
        const pillW = textWidth + padding * 2;
        const pillH = fontSize + padding;
        const radius = 4;

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = this.isTarget ? 'rgba(60, 0, 0, 0.9)' : 'rgba(0, 0, 20, 0.8)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.fill();

        if (this.isTarget) {
            ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Draw each character
        let charX = textX;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            if (i < this.typedIndex) {
                // Already typed - dimmed/struck
                ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            } else if (i === this.typedIndex && this.isTarget) {
                // Next char to type - highlighted
                ctx.fillStyle = '#00ffd5';
                ctx.shadowColor = '#00ffd5';
                ctx.shadowBlur = 10;
            } else {
                // Not yet typed
                ctx.fillStyle = '#eef2ff';
                ctx.shadowBlur = 0;
            }
            ctx.fillText(ch, charX, textY);
            ctx.shadowBlur = 0;
            charX += ctx.measureText(ch).width;
        }
        ctx.restore();
    }

    get nextChar() {
        if (this.typedIndex >= this.word.length) return null;
        return this.word[this.typedIndex];
    }

    typeChar() {
        this.typedIndex++;
        return this.typedIndex >= this.word.length;
    }

    get completed() {
        return this.typedIndex >= this.word.length;
    }
}

class EnemyManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.spawnTimer = 0;
        this.wave = 1;
        this.wordsInWave = 0;
        this.maxWordsInWave = 5;
        this.waveDelay = 3; // seconds between waves
        this.waveDelayTimer = 0;
        this.betweenWaves = false;
        this.activeTarget = null;
        this.usedWords = new Set();
        this.wordPool = [];
        this.difficulty = 'normal';
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    buildWordPool(wordData, translations) {
        // Build pool based on current wave difficulty
        this.wordPool = [];
        const maxLevel = Math.min(10, Math.floor(this.wave / 3) + 2);
        const minLevel = Math.max(1, maxLevel - 3);

        for (const w of wordData) {
            if (w.level >= minLevel && w.level <= maxLevel && !this.usedWords.has(w.en)) {
                const trans = translations[w.en];
                if (trans) {
                    this.wordPool.push({ en: w.en, translation: trans });
                }
            }
        }

        // Shuffle
        for (let i = this.wordPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.wordPool[i], this.wordPool[j]] = [this.wordPool[j], this.wordPool[i]];
        }
    }

    getSpawnInterval() {
        const base = { easy: 3.0, normal: 2.0, hard: 1.2 }[this.difficulty] || 2.0;
        return Math.max(0.5, base - this.wave * 0.08);
    }

    getEnemySpeed() {
        const base = { easy: 0.3, normal: 0.5, hard: 0.8 }[this.difficulty] || 0.5;
        return base + this.wave * 0.03 + Math.random() * 0.2;
    }

    getMaxWordsInWave() {
        const base = { easy: 4, normal: 5, hard: 7 }[this.difficulty] || 5;
        return base + Math.floor(this.wave * 0.8);
    }

    spawnEnemy(wordData, translations) {
        if (this.wordPool.length === 0) {
            this.buildWordPool(wordData, translations);
        }
        if (this.wordPool.length === 0) {
            // All words used, reset
            this.usedWords.clear();
            this.buildWordPool(wordData, translations);
        }
        if (this.wordPool.length === 0) return;

        const wordEntry = this.wordPool.pop();
        this.usedWords.add(wordEntry.en);

        const margin = 60;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = -30;
        const speed = this.getEnemySpeed();

        const enemy = new Enemy(x, y, wordEntry.en, wordEntry.translation, speed);
        this.enemies.push(enemy);
        this.wordsInWave++;
    }

    update(dt, wordData, translations) {
        if (this.betweenWaves) {
            this.waveDelayTimer -= dt;
            if (this.waveDelayTimer <= 0) {
                this.betweenWaves = false;
                this.wave++;
                this.wordsInWave = 0;
                this.maxWordsInWave = this.getMaxWordsInWave();
                this.buildWordPool(wordData, translations);
            }
            // Still update existing enemies
        } else {
            // Spawn logic
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.wordsInWave < this.maxWordsInWave) {
                this.spawnEnemy(wordData, translations);
                this.spawnTimer = this.getSpawnInterval();
            }

            // Check if wave is complete (all spawned and all destroyed)
            if (this.wordsInWave >= this.maxWordsInWave && this.enemies.length === 0) {
                this.betweenWaves = true;
                this.waveDelayTimer = this.waveDelay;
            }
        }

        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(dt);
        }
    }

    draw(ctx) {
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                enemy.draw(ctx);
            }
        }
    }

    findTarget(char) {
        // Find enemy whose next char matches the pressed key
        for (const enemy of this.enemies) {
            if (enemy.alive && enemy.typedIndex === 0 && enemy.word[0] === char) {
                return enemy;
            }
        }
        return null;
    }

    removeEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
        }
        if (this.activeTarget === enemy) {
            this.activeTarget = null;
        }
    }

    getEnemiesAtBottom(threshold) {
        return this.enemies.filter(e => e.alive && e.y >= threshold);
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.wave = 1;
        this.wordsInWave = 0;
        this.maxWordsInWave = 5;
        this.betweenWaves = false;
        this.waveDelayTimer = 0;
        this.activeTarget = null;
        this.usedWords.clear();
        this.wordPool = [];
    }
}
