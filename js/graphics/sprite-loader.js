// ===========================
// SPRITE LOADER - Исправленная версия
// ===========================

const SpriteLoader = {
    images: {},
    loaded: false,
    total: 0,
    count: 0,
    callbacks: [],
    
    load() {
        const assets = window.ASSETS?.images;
        if (!assets) {
            console.error('[SpriteLoader] ASSETS не найден');
            this._complete();
            return;
        }
        
        // Считаем: player + playerGun + все враги
        let totalCount = 2;
        if (assets.enemies) {
            totalCount += Object.keys(assets.enemies).length;
        }
        this.total = totalCount;
        this.count = 0;
        
        console.log('[SpriteLoader] Загрузка ' + this.total + ' спрайтов...');
        
        this._load('player', assets.player);
        this._load('playerGun', assets.playerGun);
        
        for (let type in assets.enemies) {
            this._load('enemy_' + type, assets.enemies[type]);
        }
        
        // Таймаут через 3 секунды — принудительный запуск
        setTimeout(() => {
            if (!this.loaded) {
                console.warn('[SpriteLoader] Таймаут, запускаем игру без картинок');
                this._complete();
            }
        }, 3000);
    },
    
    _load(key, src) {
        if (!src) {
            console.warn('[SpriteLoader] Нет пути для:', key);
            this.count++;
            this._checkComplete();
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            this.images[key] = img;
            console.log('[SpriteLoader] ✓ Загружен:', key);
            this.count++;
            this._checkComplete();
        };
        img.onerror = () => {
            console.warn('[SpriteLoader] ✗ Не загружен:', key, src);
            this.count++;
            this._checkComplete();
        };
        img.src = src;
    },
    
    _checkComplete() {
        if (this.count >= this.total && !this.loaded) {
            this._complete();
        }
    },
    
    _complete() {
        this.loaded = true;
        console.log('[SpriteLoader] Загрузка завершена');
        this.callbacks.forEach(cb => cb());
        this.callbacks = [];
    },
    
    get(key) {
        return this.images[key] || null;
    },
    
    onReady(callback) {
        if (this.loaded) callback();
        else this.callbacks.push(callback);
    }
    
};

window.SpriteLoader = SpriteLoader;