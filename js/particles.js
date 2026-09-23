/* ============================================
   PARTICLE SYSTEM - Explosions, debris, text
   ============================================ */
class Particle {
    constructor(x, y, vx, vy, life, color, size, type = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.type = type; // 'circle', 'text', 'spark'
        this.text = '';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = 0;
        this.alpha = 1;
        this.scale = 1;
        this.font = '';
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += this.gravity * dt * 60;
        this.rotation += this.rotSpeed;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    get dead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, count = 30, colors = null) {
        const defaultColors = ['#ff4444', '#ff8800', '#ffcc00', '#ffffff', '#ff6622'];
        const c = colors || defaultColors;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 1.5 + Math.random() * 4;
            const p = new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.5 + Math.random() * 0.8,
                c[Math.floor(Math.random() * c.length)],
                2 + Math.random() * 4
            );
            p.gravity = 0.05;
            this.particles.push(p);
        }
    }

    createLetterDebris(x, y, word, color = '#ff8800') {
        const letters = word.split('');
        const spacing = 14;
        const startX = x - (letters.length * spacing) / 2;
        letters.forEach((letter, i) => {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 1 + Math.random() * 3;
            const p = new Particle(
                startX + i * spacing, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                0.8 + Math.random() * 0.5,
                color,
                16
            );
            p.type = 'text';
            p.text = letter;
            p.font = '16px "JetBrains Mono"';
            p.gravity = 0.08;
            p.rotSpeed = (Math.random() - 0.5) * 0.3;
            this.particles.push(p);
        });
    }

    createTranslationPopup(x, y, text) {
        const p = new Particle(
            x, y,
            0, -1.2,
            2.0,
            '#ffd700',
            28
        );
        p.type = 'text';
        p.text = text;
        p.font = 'bold 28px "Inter"';
        p.gravity = -0.01;
        p.rotSpeed = 0;
        p.scale = 0.5;
        this.particles.push(p);
    }

    createLaserSpark(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const p = new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.2 + Math.random() * 0.2,
                Math.random() > 0.5 ? '#00aaff' : '#00ffd5',
                1 + Math.random() * 2,
                'spark'
            );
            this.particles.push(p);
        }
    }

    createEngineTrail(x, y) {
        for (let i = 0; i < 2; i++) {
            const p = new Particle(
                x + (Math.random() - 0.5) * 8, y,
                (Math.random() - 0.5) * 0.5,
                1 + Math.random() * 1.5,
                0.3 + Math.random() * 0.3,
                Math.random() > 0.5 ? '#00ffd5' : '#0088ff',
                2 + Math.random() * 3
            );
            this.particles.push(p);
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            // Text must always stay upright (never tilted / rotated / mirrored)
            if (p.type !== 'text') {
                ctx.rotate(p.rotation);
            }

            if (p.type === 'text') {
                // Scale animation for translation popup
                const s = p.text.length > 3 ? Math.min(1, (1 - p.life / p.maxLife) * 4 + 0.5) : 1;
                ctx.scale(s, s);
                ctx.font = p.font;
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Text glow
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15;
                ctx.fillText(p.text, 0, 0);
                ctx.shadowBlur = 0;
            } else if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * p.alpha, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.globalAlpha = p.alpha * 0.3;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * p.alpha * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
    }
}
