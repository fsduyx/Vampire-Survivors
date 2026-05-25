// ===========================
// VAMPIRE SURVIVORS — UI.JS
// ===========================

class UIManager {
  constructor(game) {
    this.game = game;

    this.hpBar = document.getElementById('hpBar');
    this.hpText = document.getElementById('hpText');
    this.xpBar = document.getElementById('xpBar');
    this.timerEl = document.getElementById('timerDisplay');
    this.scoreEl = document.getElementById('scoreDisplay');
    this.levelEl = document.getElementById('levelDisplay');
    this.killEl = document.getElementById('killCount');
    this.weapHud = document.getElementById('weaponsHud');
    this.levelUpChoices = document.getElementById('levelUpChoices');
    this.newLevelEl = document.getElementById('newLevel');
    this.lowHpOverlay = null;
  }

  updateHUD(player, gameTime, score, kills) {
    if (!this.hpBar) return;
    
    const hpPct = Utils.clamp(player.hp / player.maxHp, 0, 1) * 100;
    this.hpBar.style.width = hpPct + '%';
    this.hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    this.xpBar.style.width = (player.getXpPercent() * 100) + '%';
    this.timerEl.textContent = Utils.formatTime(gameTime);
    this.scoreEl.textContent = Utils.formatNum(score);
    this.levelEl.textContent = player.level;
    this.killEl.textContent = `☠ ${kills}`;
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  spawnFloatText(text, x, y, type = 'damage') {
    const el = document.createElement('div');
    el.className = `float-text ${type}`;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  screenFlash(color) {
    const el = document.createElement('div');
    el.className = `screen-flash ${color}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 400);
  }

  showGameOver(player, gameTime, score, kills, victory) {
    document.getElementById('finalTime').textContent = Utils.formatTime(gameTime);
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('finalLevel').textContent = player.level;
    document.getElementById('finalScore').textContent = Utils.formatNum(score);
    this.showScreen('gameOverScreen');
  }

  showLevelUp(player, callback) {
    this.newLevelEl.textContent = player.level;
    this.levelUpChoices.innerHTML = '<div>Выберите улучшение</div>';
    this.showScreen('levelUpScreen');
  }
}
