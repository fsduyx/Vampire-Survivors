
var GameCanvas = (function () {
    var canvas = null;
    var ctx = null;
    var animationId = null;

    var images = {
        player: "assets/images/palyer/idle.png",
        playerGun: null,
        enemies: { chaser: null, interceptor: null, flanker: null },
        bullet: null,
        heart: null
    };

    var imagesLoaded = false;
    var imagesToLoad = 0;
    var imagesLoadedCount = 0;

    function init() {
        console.log('[Canvas] init вызван');
        
        canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';

        ctx = canvas.getContext('2d');

        var gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(canvas);
        } else {
            console.error('[Canvas] game-container не найден');
            return;
        }

        loadAllImages();
        setupResizeHandler();
    }

    function setupResizeHandler() {
        window.addEventListener('resize', function () {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                if (typeof GameState !== 'undefined') {
                    GameState.updateWindowSize();
                }
            }
        });
    }

    function loadAllImages() {
        var assets = GameConfig.ASSETS.images;
        
        imagesToLoad = 1 + 1 + 3 + 1 + 1;
        imagesLoadedCount = 0;
        
        images.player = new Image();
        images.player.onload = onImageLoaded;
        images.player.src = assets.player;
        
        images.playerGun = new Image();
        images.playerGun.onload = onImageLoaded;
        images.playerGun.src = assets.playerGun;
        
        images.enemies.chaser = new Image();
        images.enemies.chaser.onload = onImageLoaded;
        images.enemies.chaser.src = assets.enemies.chaser;
        
        images.enemies.interceptor = new Image();
        images.enemies.interceptor.onload = onImageLoaded;
        images.enemies.interceptor.src = assets.enemies.interceptor;
        
        images.enemies.flanker = new Image();
        images.enemies.flanker.onload = onImageLoaded;
        images.enemies.flanker.src = assets.enemies.flanker;
        
        images.bullet = new Image();
        images.bullet.onload = onImageLoaded;
        images.bullet.src = assets.bullet;
        
        images.heart = new Image();
        images.heart.onload = onImageLoaded;
        images.heart.src = assets.heart;
    }
    
    function onImageLoaded() {
        imagesLoadedCount++;
        if (imagesLoadedCount >= imagesToLoad) {
            imagesLoaded = true;
            if (typeof GameLogger !== 'undefined' && GameLogger.info) {
                GameLogger.info('Все изображения загружены');
            } else {
                console.log('[Canvas] Все изображения загружены');
            }
        }
    }

    function render() {
        if (!ctx || !imagesLoaded) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рисуем пол (Участник 1)
        if (typeof window.drawFloor === 'function') {
            window.drawFloor(ctx);
        }

        renderEnemies();
        renderBullets();
        renderPlayer();
    }
    
    function renderPlayer() {
        var player = GameState.player();
        if (!player || !images.player) return;
        
        ctx.save();
        ctx.translate(player.x + 10, player.y + 10);
        ctx.drawImage(images.player, -10, -10, 20, 20);
        
        var angle = player.gunAngle || 0;
        ctx.rotate(angle);
        ctx.drawImage(images.playerGun, 5, -5, 10, 10);
        ctx.restore();
        
        var healthPercent = player.health / 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(player.x, player.y - 8, 20, 4);
        ctx.fillStyle = healthPercent > 0.6 ? '#2ecc40' : (healthPercent > 0.3 ? '#ffdc00' : '#ff4136');
        ctx.fillRect(player.x, player.y - 8, 20 * healthPercent, 4);
    }
    
    function renderEnemies() {
        var enemies = GameState.enemies();
        var imagesMap = {
            'chaser': images.enemies.chaser,
            'interceptor': images.enemies.interceptor,
            'flanker': images.enemies.flanker
        };
        
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            var img = imagesMap[e.role] || images.enemies.chaser;
            
            if (img) {
                ctx.drawImage(img, e.posX, e.posY, 20, 20);
            } else {
                ctx.fillStyle = 'darkred';
                ctx.fillRect(e.posX, e.posY, 20, 20);
            }
            
            var healthPercent = e.health / e.maxHealth;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(e.posX, e.posY - 5, 20, 3);
            ctx.fillStyle = '#ff4136';
            ctx.fillRect(e.posX, e.posY - 5, 20 * healthPercent, 3);
        }
    }

    function renderBullets() {
        var bullets = GameState.bullets();
        
        for (var i = 0; i < bullets.length; i++) {
            var b = bullets[i];
            if (images.bullet) {
                ctx.drawImage(images.bullet, b.posX, b.posY, 5, 5);
            } else {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(b.posX, b.posY, 5, 5);
            }
        }
    }

    function startRenderLoop() {
        console.log('[Canvas] startRenderLoop вызван');
        if (animationId) cancelAnimationFrame(animationId);
        
        function renderLoop() {
            render();
            animationId = requestAnimationFrame(renderLoop);
        }
        
        renderLoop();
    }
    
    function stopRenderLoop() {
        console.log('[Canvas] stopRenderLoop вызван');
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    return {
        init: init,
        render: render,
        startRenderLoop: startRenderLoop,
        stopRenderLoop: stopRenderLoop,
        getContext: function () { return ctx; },
        getCanvas: function () { return canvas; },
        isReady: function () { return imagesLoaded; }
    };
})();
