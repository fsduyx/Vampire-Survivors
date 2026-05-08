// ===========================
// SPRITE LOADER - Упрощённая версия (без реальных изображений)
// ===========================

const SpriteLoader = {
    images: {},
    loaded: false,
    callbacks: [],
    
    load() {
        console.log('[SpriteLoader] Используется упрощённый режим (без текстур)');
        // Просто помечаем как загруженные, не загружая реальные файлы
        this.loaded = true;
        this.callbacks.forEach(cb => cb());
        this.callbacks = [];
    },
    
    get(key) {
        return null; // Возвращаем null, игра будет рисовать примитивами
    },
    
    onReady(callback) {
        if (this.loaded) callback();
        else this.callbacks.push(callback);
    }
};

window.SpriteLoader = SpriteLoader;