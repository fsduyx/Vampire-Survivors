// ============================================================
// particles.js - Система частиц для визуальных эффектов
// ============================================================

var GameParticles = (function() {
    var particles = [];
    var PARTICLE_LIFETIME = 500; // 0.5 секунды в миллисекундах
    
    function createParticle(x, y, vx, vy, color, size) {
        particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            size: size,
            life: PARTICLE_LIFETIME,
            maxLife: PARTICLE_LIFETIME
        });
    }
    
    function createShotParticles(x, y, angle) {
        if (!GameConfig.VISUAL_CONFIG.particleEffects) return;
        
        var count = 3 + Math.floor(Math.random() * 3); // 3-5 частиц
        for (var i = 0; i < count; i++) {
            var spread = (Math.random() - 0.5) * 1.5;
            var speed = 2 + Math.random() * 3;
            var a = angle + Math.PI + spread; // назад от игрока
            
            createParticle(
                x, y,
                Math.cos(a) * speed,
                Math.sin(a) * speed,
                '#ff9500', // оранжевый
                3 + Math.random() * 2
            );
        }
    }
    
    function createHitParticles(x, y) {
        if (!GameConfig.VISUAL_CONFIG.particleEffects) return;
        
        var count = 5 + Math.floor(Math.random() * 3); // 5-7 частиц
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 3;
            
            createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff4136', // красный
                2 + Math.random() * 3
            );
        }
    }
    
    function createDeathParticles(x, y) {
        if (!GameConfig.VISUAL_CONFIG.particleEffects) return;
        
        var count = 8 + Math.floor(Math.random() * 3); // 8-10 частиц
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 2 + Math.random() * 4;
            
            createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#8b0000', // темно-красный
                3 + Math.random() * 4
            );
        }
    }
    
    function update(deltaTime) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95; // замедление
            p.vy *= 0.95;
        }
    }
    
    function render(ctx) {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var alpha = p.life / p.maxLife;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    function clear() {
        particles = [];
    }
    
    return {
        createShotParticles: createShotParticles,
        createHitParticles: createHitParticles,
        createDeathParticles: createDeathParticles,
        update: update,
        render: render,
        clear: clear,
        getParticles: function() { return particles; }
    };
    // ===== ДОБАВИТЬ В GameParticles =====
    var expOrbs = [];

    function createExpOrb(x, y, value) {
        expOrbs.push({
        x: x,
        y: y,
        value: value,
        radius: 8,
        life: 10000, // 10 секунд
        attracted: false
    });
}

    function updateExpOrbs() {
        var player = GameState.player();
        var pickupRange = 100 + (GameConfig.getPickupRangeBonus ? GameConfig.getPickupRangeBonus() : 0);
    
    for (var i = expOrbs.length - 1; i >= 0; i--) {
        var orb = expOrbs[i];
        
        // Уменьшаем время жизни
        orb.life -= 16; // примерно 60fps
        
        if (orb.life <= 0) {
            expOrbs.splice(i, 1);
            continue;
        }
        
        // Проверка расстояния до игрока
        var dx = player.x - orb.x;
        var dy = player.y - orb.y;
        var dist = Math.hypot(dx, dy);
        
        // Притяжение к игроку
        if (dist < pickupRange || orb.attracted) {
            orb.attracted = true;
            if (dist > 5) {
                var speed = 5;
                orb.x += (dx / dist) * speed;
                orb.y += (dy / dist) * speed;
            } else {
                // Сбор сферы
                var levelUp = GameState.addExp(orb.value);
                if (typeof Sound !== 'undefined' && Sound.playExpCollect) {
                    Sound.playExpCollect();
                }
                
                // Обновляем UI
                if (typeof GameUI !== 'undefined') {
                    GameUI.updateLevelDisplay();
                }
                
                // Проверяем повышение уровня
                if (levelUp) {
                    if (typeof GameCore !== 'undefined' && GameCore.onLevelUp) {
                        GameCore.onLevelUp();
                    }
                }
                
                expOrbs.splice(i, 1);
            }
        }
    }
}

function renderExpOrbs(ctx) {
    for (var i = 0; i < expOrbs.length; i++) {
        var orb = expOrbs[i];
        
        // Градиент для сферы опыта
        var gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, '#ffdd88');
        gradient.addColorStop(1, '#ffaa22');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутренний блик
        ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(orb.x - 2, orb.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Экспортируем новые функции
return {
    // ... существующие методы ...
    createExpOrb: createExpOrb,
    updateExpOrbs: updateExpOrbs,
    renderExpOrbs: renderExpOrbs,
    getExpOrbs: function() { return expOrbs; },
    clearExpOrbs: function() { expOrbs = []; }
};
})();
