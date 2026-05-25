// ===========================
// VAMPIRE SURVIVORS — PLAYER.JS
// Player state, movement, rendering
// ===========================

class Player {
  constructor() { this.reset(); }

  reset() {
    // Position
    this.x = 0; this.y = 0;

    // Stats
    this.maxHp       = CONFIG.PLAYER_BASE_HP;
    this.hp          = this.maxHp;
    this.speed       = CONFIG.PLAYER_BASE_SPEED;
    this.armor       = 0;
    this.regen       = 0;
    this.regenTimer  = 0;
    this.critChance  = 5;
    this.cdMult      = 1.0;
    this.dmgMult     = 1.0;
    this.xpMult      = 1.0;
    this.xpMagnetRadius = 60;

    // Level / XP
    this.level   = 1;
    this.xp      = 0;
    this.xpToNext = CONFIG.XP_LEVELS[1];

    // Combat
    this.radius     = CONFIG.PLAYER_RADIUS;
    this.invincible = false;
    this.iframeTimer = 0;

    // Weapons / passives
    this.weapons    = [];
    this.passives   = {}; // { id: level }

    // Visual
    this.lastDir    = 0;
    this.facing     = 1; // 1 = right, -1 = left
    this.bobOffset  = 0;
    this.walkAnim   = 0;
    this.isMoving   = false;

    // Input state
    this.keys = { up:false, down:false, left:false, right:false };
  }

  addWeapon(weaponId) {
    const data = WEAPONS_DATA[weaponId];
    if (!data) return;
    const existing = this.weapons.find(w => w.data.id === weaponId);
    if (existing) { existing.upgrade(); return; }
    this.weapons.push(new WeaponInstance(data, this));
  }

  addPassive(passiveId) {
    const data = PASSIVES_DATA[passiveId];
    if (!data) return;
    const lvl = (this.passives[passiveId] || 0) + 1;
    if (lvl > data.maxLevel) return;
    this.passives[passiveId] = lvl;
    data.apply(this);
  }

  gainXp(amount) {
    const actual = Math.round(amount * (this.xpMult || 1));
    this.xp += actual;
    let leveled = false;
    while (this.level < CONFIG.XP_LEVELS.length - 1 && this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = CONFIG.XP_LEVELS[this.level] - CONFIG.XP_LEVELS[this.level - 1];
      leveled = true;
    }
    return leveled;
  }

  getXpPercent() {
    return Utils.clamp(this.xp / this.xpToNext, 0, 1);
  }

  takeDamage(amount) {
    if (this.invincible) return 0;
    const actual = Math.max(1, amount - (this.armor || 0));
    this.hp = Math.max(0, this.hp - actual);
    this.invincible = true;
    this.iframeTimer = CONFIG.PLAYER_IFRAMES / 1000;
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(dt, input) {
    // I-frames
    if (this.invincible) {
      this.iframeTimer -= dt;
      if (this.iframeTimer <= 0) { this.invincible = false; }
    }

    // Regen
    if (this.regen > 0) {
      this.regenTimer += dt;
      if (this.regenTimer >= 1.0) {
        this.regenTimer = 0;
        this.heal(this.regen);
      }
    }

    // Movement
    let dx = 0, dy = 0;
    if (input.up   || input.w) dy -= 1;
    if (input.down || input.s) dy += 1;
    if (input.left || input.a) dx -= 1;
    if (input.right|| input.d) dx += 1;

    const moving = dx !== 0 || dy !== 0;
    this.isMoving = moving;

    if (moving) {
      const norm = Utils.normalize(dx, dy);
      this.x += norm.x * this.speed * dt;
      this.y += norm.y * this.speed * dt;
      this.lastDir = Math.atan2(dy, dx);
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      this.walkAnim += dt * 8;
    }

    // Clamp to world
    this.x = Utils.clamp(this.x, -CONFIG.WORLD_W / 2, CONFIG.WORLD_W / 2);
    this.y = Utils.clamp(this.y, -CONFIG.WORLD_H / 2, CONFIG.WORLD_H / 2);
  }

  draw(ctx, camX, camY, W, H) {
    const sx = this.x - camX + W / 2;
    const sy = this.y - camY + H / 2;
    
    ctx.save();
    
    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius * 0.5, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // I-frame мерцание
    const now = performance.now() * 0.001;
    if (this.invincible && Math.floor(now * 12) % 2 === 0) {
        ctx.restore();
        return;
    }
    
    // Основной круг игрока
    ctx.fillStyle = '#c0152a';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (направление)
    ctx.fillStyle = '#ffffff';
    const eyeOffset = this.facing === 1 ? 4 : -4;
    ctx.beginPath();
    ctx.arc(sx + eyeOffset, sy - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(sx + eyeOffset + (this.facing === 1 ? 1 : -1), sy - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Полоска здоровья
    this._drawHealthBar(ctx, sx, sy - this.radius - 8, this.radius * 2, 5, this.hp, this.maxHp);
    
    // Аура Garlic
    const garlicWeapon = this.weapons.find(w => w.data.id === 'GARLIC');
    if (garlicWeapon) {
        ctx.save();
        ctx.strokeStyle = `rgba(100,255,100,${0.3 + 0.1 * Math.sin(now * 4)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, garlicWeapon.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
  }

_drawFallback(ctx, camX, camY, W, H) {
    const sx = this.x - camX + W / 2;
    const sy = this.y - camY + H / 2;
    
    ctx.save();
    ctx.fillStyle = '#c0152a';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    this._drawHealthBar(ctx, sx, sy - this.radius - 5, this.radius * 2, 4, this.hp, this.maxHp);
}

_drawHealthBar(ctx, x, y, w, h, current, max) {
    const pct = Math.min(1, Math.max(0, current / max));
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - w/2, y, w, h);
    const color = pct > 0.5 ? '#2ecc71' : (pct > 0.25 ? '#f39c12' : '#c0152a');
    ctx.fillStyle = color;
    ctx.fillRect(x - w/2, y, w * pct, h);
}
getXpPercent() {
    return Utils.clamp(this.xp / this.xpToNext, 0, 1);
}
}

