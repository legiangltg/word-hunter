/* ============================================
   PLAYER - Gun rendering & laser beams
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
            y1: this.y - 36,
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

        // (gun: no engine trail)
    }

    drawShip(ctx) {
        const x = this.x;
        const y = this.y;
        const glow = 0.6 + 0.4 * Math.sin(this.glowPhase);

        ctx.save();
        ctx.translate(x, y);

        const steelLight = '#4a6a80';
        const steel = '#2b4256';
        const steelDark = '#141f2a';
        const neon = '#00ffd5';

        // Muzzle flash glow (barrel tip)
        ctx.save();
        ctx.shadowColor = neon;
        ctx.shadowBlur = 16 * glow;
        ctx.beginPath();
        ctx.ellipse(0, -38, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 213, ${0.55 + 0.45 * glow})`;
        ctx.fill();
        ctx.restore();

        // Barrel (nòng súng)
        const barrelGrad = ctx.createLinearGradient(0, -38, 0, -8);
        barrelGrad.addColorStop(0, steelLight);
        barrelGrad.addColorStop(1, steel);
        ctx.beginPath();
        ctx.moveTo(-4, -38);
        ctx.lineTo(4, -38);
        ctx.lineTo(7, -8);
        ctx.lineTo(-7, -8);
        ctx.closePath();
        ctx.fillStyle = barrelGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 255, 213, ${glow * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Muzzle brake ring
        ctx.fillStyle = steelLight;
        ctx.fillRect(-5, -38, 10, 4);

        // Receiver / slide (thân súng)
        const bodyGrad = ctx.createLinearGradient(0, -8, 0, 16);
        bodyGrad.addColorStop(0, steelLight);
        bodyGrad.addColorStop(1, steelDark);
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(15, -8);
        ctx.lineTo(15, 8);
        ctx.quadraticCurveTo(15, 16, 9, 16);
        ctx.lineTo(-9, 16);
        ctx.quadraticCurveTo(-15, 16, -15, 8);
        ctx.closePath();
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Slide serrations (grooves)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
            const sy = -4 + i * 6;
            ctx.beginPath();
            ctx.moveTo(-14, sy);
            ctx.lineTo(-5, sy);
            ctx.stroke();
        }

        // Energy cell (side vent glow)
        ctx.save();
        ctx.shadowColor = neon;
        ctx.shadowBlur = 8 * glow;
        ctx.beginPath();
        ctx.ellipse(11, 1, 2.5, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 213, ${glow})`;
        ctx.fill();
        ctx.restore();

        // Grip (tay cầm)
        const gripGrad = ctx.createLinearGradient(0, 16, 0, 34);
        gripGrad.addColorStop(0, steel);
        gripGrad.addColorStop(1, steelDark);
        ctx.beginPath();
        ctx.moveTo(-9, 16);
        ctx.lineTo(10, 16);
        ctx.lineTo(7, 34);
        ctx.lineTo(-6, 34);
        ctx.closePath();
        ctx.fillStyle = gripGrad;
        ctx.fill();

        // Trigger guard
        ctx.beginPath();
        ctx.ellipse(-2, 18, 8, 9, 0, 0, Math.PI * 2);
        ctx.strokeStyle = steelLight;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Trigger
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(-4, 20);
        ctx.strokeStyle = `rgba(0, 255, 213, ${glow * 0.85})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

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
