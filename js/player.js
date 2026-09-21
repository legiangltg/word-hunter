/* ============================================
   PLAYER - Ship rendering & laser beams
   ============================================ */
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height - 80;
        this.width = 40;
        this.height = 50;
        this.glowPhase = 0;
        this.lasers = []; // Active laser beams
    }

    resize() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 80;
    }

    fireLaser(targetX, targetY) {
        this.lasers.push({
            x1: this.x,
            y1: this.y - this.height / 2,
            x2: targetX,
            y2: targetY,
            life: 0.15,
            maxLife: 0.15,
            width: 3
        });
    }

    update(dt, particleSystem) {
        this.glowPhase += dt * 4;

        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].life -= dt;
            if (this.lasers[i].life <= 0) {
                this.lasers.splice(i, 1);
            }
        }

        // Engine particles
        if (Math.random() > 0.5) {
            particleSystem.createEngineTrail(this.x, this.y + this.height / 2 - 5);
        }
    }

    drawShip(ctx) {
        const x = this.x;
        const y = this.y;
        const glow = 0.6 + 0.4 * Math.sin(this.glowPhase);

        ctx.save();
        ctx.translate(x, y);

        // Ship body - sleek triangle
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-18, 20);
        ctx.lineTo(-8, 15);
        ctx.lineTo(0, 18);
        ctx.lineTo(8, 15);
        ctx.lineTo(18, 20);
        ctx.closePath();

        // Ship gradient
        const grad = ctx.createLinearGradient(0, -25, 0, 20);
        grad.addColorStop(0, '#00ffd5');
        grad.addColorStop(0.5, '#0088aa');
        grad.addColorStop(1, '#003344');
        ctx.fillStyle = grad;
        ctx.fill();

        // Ship outline glow
        ctx.strokeStyle = `rgba(0, 255, 213, ${glow * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cockpit
        ctx.beginPath();
        ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 213, ${glow})`;
        ctx.fill();

        // Engine glow
        ctx.beginPath();
        ctx.moveTo(-6, 18);
        ctx.lineTo(0, 18 + 8 + glow * 6);
        ctx.lineTo(6, 18);
        ctx.fillStyle = `rgba(0, 170, 255, ${glow * 0.8})`;
        ctx.fill();

        // Wing tips
        ctx.beginPath();
        ctx.arc(-18, 20, 2, 0, Math.PI * 2);
        ctx.arc(18, 20, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 213, ${glow})`;
        ctx.fill();

        // Ship glow aura
        ctx.shadowColor = '#00ffd5';
        ctx.shadowBlur = 20 * glow;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawLasers(ctx) {
        for (const laser of this.lasers) {
            const alpha = laser.life / laser.maxLife;
            
            // Outer glow
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = laser.width * 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();

            // Mid glow
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = '#44ccff';
            ctx.lineWidth = laser.width * 2;
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();

            // Core beam
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = laser.width;
            ctx.beginPath();
            ctx.moveTo(laser.x1, laser.y1);
            ctx.lineTo(laser.x2, laser.y2);
            ctx.stroke();

            ctx.restore();
        }
    }

    draw(ctx) {
        this.drawLasers(ctx);
        this.drawShip(ctx);
    }
}
