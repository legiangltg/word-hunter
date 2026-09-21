/* ============================================
   STARFIELD - Parallax space background
   ============================================ */
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth || canvas.width;
        this.height = window.innerHeight || canvas.height;
        this.layers = [];
        this.layerCount = 3;
        this.starsPerLayer = [120, 80, 40];
        this.speeds = [0.3, 0.7, 1.5];
        this.sizes = [1, 1.5, 2.5];
        this.colors = [
            'rgba(150,160,200,0.4)',
            'rgba(180,190,220,0.6)',
            'rgba(220,230,255,0.9)'
        ];
        this.init();
    }

    init() {
        for (let l = 0; l < this.layerCount; l++) {
            const stars = [];
            for (let i = 0; i < this.starsPerLayer[l]; i++) {
                stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    twinkle: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.04
                });
            }
            this.layers.push(stars);
        }
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        for (let l = 0; l < this.layerCount; l++) {
            for (const star of this.layers[l]) {
                if (star.x > this.width) star.x = Math.random() * this.width;
                if (star.y > this.height) star.y = Math.random() * this.height;
            }
        }
    }

    update(dt) {
        for (let l = 0; l < this.layerCount; l++) {
            for (const star of this.layers[l]) {
                star.y += this.speeds[l] * dt * 60;
                star.twinkle += star.twinkleSpeed;
                if (star.y > this.height) {
                    star.y = -5;
                    star.x = Math.random() * this.width;
                }
            }
        }
    }

    draw(ctx) {
        for (let l = 0; l < this.layerCount; l++) {
            for (const star of this.layers[l]) {
                const alpha = 0.5 + 0.5 * Math.sin(star.twinkle);
                const size = this.sizes[l] * (0.8 + 0.2 * alpha);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.colors[l];
                ctx.beginPath();
                ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
                ctx.fill();
                // Glow for brightest stars
                if (l === 2 && alpha > 0.8) {
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.globalAlpha = 1;
    }
}
