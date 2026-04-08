
// ============================================================
// core.js - Главный цикл игры
// ============================================================

var GameCore = (function() {
    
    function init() {
        console.log('GameCore.init() вызван');
        // Проверяем, что все зависимости загружены
        if (typeof GameUI === 'undefined') {
            console.error('GameUI не загружен!');
            return;
        }
        if (typeof GameHero === 'undefined') {
            console.error('GameHero не загружен!');
            return;
        }
        
        // Инициализируем модули
        GameUI.init();
        GameHero.init();
        setupPauseHandler();
        setupResizeHandler();
        
        if (typeof GameLogger !== 'undefined') {
            GameLogger.info('Игра инициализирована');
        }
    }

    function startGame() {
        GameState.reset();
        GameState.setPlayerPosition(
            GameState.windowWidth() / 2,
            GameState.windowHeight() / 2
        );
        
        GameUI.showGameUI();
        GameUI.hideAllMenus();
        
        GameUI.createPlayer();
        GameUI.updateAmmo();
        GameUI.updateKills();
        GameUI.updateHealth();
        
        GameWaves.startNextWave();
        GameLogger.logGameStart();
        
        gameLoop();
    }

    function gameLoop() {
        if (!GameState.isPlaying() || GameState.isPaused()) return;
        
        requestAnimationFrame(gameLoop);
        
        GameHero.updatePosition();
        GameAI.moveBullets();
        GameAI.shootAtNearestEnemy();
        
        var playerDied = GameAI.updateEnemies();
        if (playerDied) {
            endGame();
        }
    }

    function setupPauseHandler() {
        document.addEventListener('keydown', function(e) {
            if (e.code !== 'Escape' || !GameState.isPlaying()) return;
            
            if (GameState.isPaused()) {
                resumeGame();
            } else {
                pauseGame();
            }
        });
    }

    function pauseGame() {
        if (!GameState.isPlaying()) return;
        GameState.setPaused(true);
        if (GameUI.elements && GameUI.elements.pauseMenu) {
            GameUI.elements.pauseMenu.style.display = 'flex';
        }
        GameLogger.logPause();
    }

    function resumeGame() {
        if (!GameState.isPlaying()) return;
        GameState.setPaused(false);
        if (GameUI.elements && GameUI.elements.pauseMenu) {
            GameUI.elements.pauseMenu.style.display = 'none';
        }
        GameLogger.logResume();
        gameLoop();
    }

    function endGame() {
        GameState.setPlaying(false);
        GameUI.showGameOver();
        GameLogger.logGameOver();
    }

    function setupResizeHandler() {
        window.addEventListener('resize', function() {
            GameState.updateWindowSize();
        });
    }

    // Публичные методы
    return {
        init: init,
        startGame: startGame,
        pauseGame: pauseGame,
        resumeGame: resumeGame
    };
})();
// ========== ОПТИМИЗИРОВАННЫЙ GameAI ==========
var GameAI = (function() {
    var enemies = [];
    var bullets = [];
    
    // Оптимизированная функция поиска ближайшего врага
    function findNearestEnemy(playerX, playerY, maxDistance) {
        var nearest = null;
        var nearestDistSq = maxDistance ? maxDistance * maxDistance : Infinity;
        
        // Ранний выход из циклов при обнаружении ближайшего врага
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (!enemy || !enemy.active) continue;
            
            // Замена Math.hypot на Math.sqrt(x*x + y*y)
            // Используем квадрат расстояния для сравнения (быстрее)
            var dx = enemy.x - playerX;
            var dy = enemy.y - playerY;
            var distSq = dx * dx + dy * dy;
            
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearest = enemy;
                
                // Ранний выход: если нашли врага с нулевым расстоянием, дальше искать смысла нет
                if (nearestDistSq === 0) break;
            }
        }
        
        // Возвращаем врага и реальное расстояние (если нужно)
        return {
            enemy: nearest,
            distance: nearest ? Math.sqrt(nearestDistSq) : Infinity
        };
    }
    
    // Оптимизированная функция разделения врагов
    function separateEnemies() {
        var count = enemies.length;
        if (count < 2) return;
        
        // Массив для хранения сил отталкивания
        var separationForces = new Array(count);
        for (var i = 0; i < count; i++) {
            separationForces[i] = { x: 0, y: 0 };
        }
        
        // Оптимизированный двойной цикл с ранним выходом
        for (var i = 0; i < count - 1; i++) {
            var enemyA = enemies[i];
            if (!enemyA || !enemyA.active) continue;
            
            for (var j = i + 1; j < count; j++) {
                var enemyB = enemies[j];
                if (!enemyB || !enemyB.active) continue;
                
                // Замена Math.hypot на прямое вычисление
                var dx = enemyB.x - enemyA.x;
                var dy = enemyB.y - enemyA.y;
                var distSq = dx * dx + dy * dy;
                
                var minDist = 40; // Минимальная дистанция между врагами
                var minDistSq = minDist * minDist;
                
                if (distSq < minDistSq && distSq > 0.01) {
                    var dist = Math.sqrt(distSq);
                    var overlap = minDist - dist;
                    var force = overlap * 0.5; // Коэффициент силы отталкивания
                    
                    var nx = dx / dist;
                    var ny = dy / dist;
                    
                    separationForces[i].x -= nx * force;
                    separationForces[i].y -= ny * force;
                    separationForces[j].x += nx * force;
                    separationForces[j].y += ny * force;
                }
            }
        }
        
        // Применяем силы
        for (var i = 0; i < count; i++) {
            var enemy = enemies[i];
            if (enemy && enemy.active) {
                enemy.x += separationForces[i].x;
                enemy.y += separationForces[i].y;
                
                // Ограничиваем координаты в пределах экрана
                enemy.x = Math.max(20, Math.min(GameState.windowWidth() - 20, enemy.x));
                enemy.y = Math.max(20, Math.min(GameState.windowHeight() - 20, enemy.y));
            }
        }
    }
    
    // Оптимизированное обновление врагов
    function updateEnemies() {
        // Обновляем позиции врагов
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (!enemy || !enemy.active) continue;
            
            // Движение к игроку (оптимизированное)
            var playerX = GameState.getPlayerX();
            var playerY = GameState.getPlayerY();
            
            var dx = playerX - enemy.x;
            var dy = playerY - enemy.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0.01) {
                var speed = enemy.speed || 2;
                enemy.x += (dx / dist) * speed;
                enemy.y += (dy / dist) * speed;
            }
        }
        
        // Разделяем врагов (оптимизированная версия)
        separateEnemies();
        
        // Проверка столкновений с игроком
        var playerX = GameState.getPlayerX();
        var playerY = GameState.getPlayerY();
        var playerRadius = 20;
        
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (!enemy || !enemy.active) continue;
            
            // Оптимизированная проверка столкновения
            var dx = enemy.x - playerX;
            var dy = enemy.y - playerY;
            var distSq = dx * dx + dy * dy;
            var collisionDist = (enemy.radius || 15) + playerRadius;
            var collisionDistSq = collisionDist * collisionDist;
            
            if (distSq < collisionDistSq) {
                GameState.reduceHealth(10);
                enemy.active = false;
                
                if (GameState.getHealth() <= 0) {
                    return true; // Игрок умер
                }
                break;
            }
        }
        
        // Удаляем неактивных врагов
        enemies = enemies.filter(function(e) { return e && e.active; });
        
        return false; // Игрок жив
    }
    
    // Оптимизированная стрельба по ближайшему врагу
    function shootAtNearestEnemy() {
        var playerX = GameState.getPlayerX();
        var playerY = GameState.getPlayerY();
        
        var nearestInfo = findNearestEnemy(playerX, playerY, 500);
        
        if (nearestInfo.enemy && nearestInfo.distance < 500) {
            // Создаём пулю, направленную на врага
            var dx = nearestInfo.enemy.x - playerX;
            var dy = nearestInfo.enemy.y - playerY;
            var dist = nearestInfo.distance;
            
            if (dist > 0.01) {
                bullets.push({
                    x: playerX,
                    y: playerY,
                    vx: (dx / dist) * 8,
                    vy: (dy / dist) * 8,
                    active: true
                });
            }
        }
    }
    
    // Оптимизированное движение пуль
    function moveBullets() {
        for (var i = bullets.length - 1; i >= 0; i--) {
            var bullet = bullets[i];
            if (!bullet || !bullet.active) {
                bullets.splice(i, 1);
                continue;
            }
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Проверка выхода за границы
            if (bullet.x < 0 || bullet.x > GameState.windowWidth() ||
                bullet.y < 0 || bullet.y > GameState.windowHeight()) {
                bullets.splice(i, 1);
                continue;
            }
            
            // Проверка попаданий во врагов
            for (var j = 0; j < enemies.length; j++) {
                var enemy = enemies[j];
                if (!enemy || !enemy.active) continue;
                
                var dx = bullet.x - enemy.x;
                var dy = bullet.y - enemy.y;
                var distSq = dx * dx + dy * dy;
                var enemyRadius = enemy.radius || 15;
                
                if (distSq < enemyRadius * enemyRadius) {
                    enemy.active = false;
                    bullets.splice(i, 1);
                    GameState.addKill();
                    GameUI.updateKills();
                    break;
                }
            }
        }
    }
    
    // Публичное API
    return {
        enemies: enemies,
        bullets: bullets,
        findNearestEnemy: findNearestEnemy,
        separateEnemies: separateEnemies,
        updateEnemies: updateEnemies,
        shootAtNearestEnemy: shootAtNearestEnemy,
        moveBullets: moveBullets
    };
})();
