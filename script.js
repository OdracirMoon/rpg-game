/* Sfx, bgm y lógica de audio (Se mantiene igual que la versión anterior) */
let soundEnabled = true;
const sfx = { ui_click: new Audio('sounds/ui/ui_click.wav'), shop_open: new Audio('sounds/ui/shop_open.wav'), shop_close: new Audio('sounds/ui/shop_close.wav'), quest_accept: new Audio('sounds/ui/quest_accept.wav'), quest_complete: new Audio('sounds/ui/quest_complete.wav'), error: new Audio('sounds/ui/error.wav'), step: new Audio('sounds/movement/step.wav'), city_enter: new Audio('sounds/movement/city_enter.wav'), map_change: new Audio('sounds/movement/map_change.wav'), attack: new Audio('sounds/combat/attack.wav'), hurt: new Audio('sounds/combat/hurt.wav'), enemy_die: new Audio('sounds/combat/enemy_die.wav'), level_up: new Audio('sounds/combat/level_up.wav'), enemy_spawn: new Audio('sounds/enemies/enemy_spawn.wav'), boss_spawn: new Audio('sounds/boss/boss_spawn.wav'), buy_item: new Audio('sounds/items/buy_item.wav'), sell_item: new Audio('sounds/items/sell_item.wav'), use_potion: new Audio('sounds/items/use_potion.wav'), equip: new Audio('sounds/items/equip.wav') };
const bgm = { city: new Audio('sounds/ambient/amb_city.mp3'), field: new Audio('sounds/ambient/amb_field.mp3'), boss: new Audio('sounds/ambient/amb_boss.mp3') };
Object.values(bgm).forEach(t => { t.loop = true; t.volume = 0.3; });
function playSFX(o) { if (!soundEnabled || !o) return; o.currentTime = 0; o.play().catch(e=>{}); }
function playBGM(type) { if (!soundEnabled) return; let target = bgm[type]; if (currentBGM === target) return; Object.values(bgm).forEach(t => t.pause()); if (target) { target.play().catch(e=>{}); currentBGM = target; } }

/* MUNDO Y JUGADOR */
const MAP_W = 100; const MAP_H = 100;
let worldMap = []; let flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };
let currentZoneIndex = 0; let isMenuOpen = false;
let player = { x: 16, y: 25, hp: 0, mp: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, level: 1, baseMaxHp: 0, baseMaxMp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '', inventory: { weapons: [], armors: [] } };
let quest = null; let inCombat = false; let currentEnemyTile = null; let lastPlayerPos = { x: 16, y: 25 };
let currentBGM = null; let wasInCity = false;

/* RECURSOS */
const mapData = [
    { rarity: 'Común', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, shop: { weapons: [{ name: 'Daga', atk: 3, mag: 0, price: 30, icon: 'sword.png' }], armors: [{ name: 'Cuero', def: 2, hpBonus: 15, mpBonus: 0, price: 40, icon: 'armor.png' }] } },
    { rarity: 'Poco Común', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, shop: { weapons: [{ name: 'Espada', atk: 6, mag: 0, price: 80, icon: 'sword.png' }], armors: [{ name: 'Cota', def: 4, hpBonus: 30, mpBonus: 0, price: 120, icon: 'armor.png' }] } }
    // ... Agregas el resto de biomas aquí igual que antes
];

/* FUNCIONES DE APOYO */
function getMaxHp() { return player.baseMaxHp + (player.armor ? player.armor.hpBonus : 0); }
function getMaxMp() { return player.baseMaxMp + (player.armor ? player.armor.mpBonus : 0); }
function getAtk() { return player.baseAtk + (player.weapon ? player.weapon.atk : 0); }
function getDef() { return player.baseDef + (player.armor ? player.armor.def : 0); }
function getMag() { return player.baseMag + (player.weapon ? player.weapon.mag : 0); }
function getHpColor(p) { return p > 50 ? '#4caf50' : (p > 20 ? '#ffeb3b' : '#f44336'); }
function logMsg(t) { console.log(t); }

/* SISTEMA TÁCTIL (D-PAD) */
function startTouchMove(dx, dy) {
    playSFX(sfx.ui_click);
    move(dx, dy);
}

function toggleMainMenu() {
    if (inCombat) return;
    isMenuOpen = !isMenuOpen;
    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
    if(isMenuOpen) updateHUD();
}

/* GENERACIÓN Y RENDER */
function getZoneIndex(x, y) { return y < 50 ? (x < 33 ? 0 : (x < 66 ? 1 : 2)) : (x > 65 ? 3 : (x > 32 ? 4 : 5)); }

function generateWorld() {
    worldMap = new Array(MAP_W * MAP_H);
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            let type = 'grass';
            if(x===0 || y===0 || x===MAP_W-1 || y===MAP_H-1) type = 'water';
            else if (x === 32 || x === 65 || y === 50) type = 'wall'; 
            worldMap[y * MAP_W + x] = { x, y, type, enemy: null, isCity: false, discovered: false, zone: getZoneIndex(x,y) };
        }
    }
    // Simplificado para el ejemplo: Pueblo inicial
    for(let cy=25; cy<=26; cy++) for(let cx=16; cx<=17; cx++) worldMap[cy*MAP_W+cx].isCity = true;
    
    // Colocar al primer jefe (candado)
    let bTile = worldMap[25 * MAP_W + 31];
    bTile.enemy = JSON.parse(JSON.stringify(mapData[0].boss));
    bTile.enemy.isBoss = true; bTile.enemy.zone = 0;
    let gTile = worldMap[25 * MAP_W + 32]; gTile.type = 'gate'; gTile.gateIndex = 0;

    player.x = 16; player.y = 25;
    updateFOV(); render();
}

function updateFOV() {
    for(let y=player.y-3; y<=player.y+3; y++) {
        for(let x=player.x-3; x<=player.x+3; x++) {
            if(x>=0 && x<MAP_W && y>=0 && y<MAP_H) worldMap[y*MAP_W+x].discovered = true;
        }
    }
}

function centerCamera() {
    const m = document.getElementById('map');
    const ts = 514;
    m.scrollTo({ left: (player.x*ts)+(256)-(m.clientWidth/2), top: (player.y*ts)+(256)-(m.clientHeight/2), behavior: 'smooth' });
}

function render() {
    const m = document.getElementById('map');
    m.style.gridTemplateColumns = `repeat(${MAP_W}, 512px)`;
    m.style.gridAutoRows = `512px`;
    m.innerHTML = '';
    
    let inCity = false;
    currentZoneIndex = getZoneIndex(player.x, player.y);

    for(let y=player.y-3; y<=player.y+3; y++) {
        for(let x=player.x-3; x<=player.x+3; x++) {
            if(x<0 || x>=MAP_W || y<0 || y>=MAP_H) continue;
            let t = worldMap[y*MAP_W+x];
            const d = document.createElement('div');
            d.style.gridColumn = x+1; d.style.gridRow = y+1;
            d.className = 'tile ' + (t.discovered ? t.type : 'fog');
            if(t.type === 'gate' && flags['boss'+t.gateIndex]) d.className = 'tile path';
            
            if(player.x === x && player.y === y) {
                d.innerHTML = `<img src="img/player/heroe.png">`;
                if(t.isCity) inCity = true;
            } else if(t.enemy && t.discovered) {
                d.innerHTML = `<img src="${t.enemy.img}">`;
            }
            m.appendChild(d);
        }
    }
    document.getElementById('contextActionBar').style.display = inCity && !inCombat ? 'flex' : 'none';
    document.getElementById('mapName').textContent = mapData[currentZoneIndex].rarity;
    setTimeout(centerCamera, 10);
    updateHUD();
}

function move(dx, dy) {
    if(inCombat || isMenuOpen) return;
    let nx = player.x + dx, ny = player.y + dy;
    let t = worldMap[ny * MAP_W + nx];
    if(!t || t.type === 'water' || t.type === 'wall') return;
    if(t.type === 'gate' && !flags['boss'+t.gateIndex]) return;
    
    playSFX(sfx.step);
    player.x = nx; player.y = ny;
    updateFOV(); render();
    if(t.enemy) startCombat(t);
}

/* COMBATE, TIENDA E INVENTARIO (Simplificados para esta versión responsive) */
function startCombat(t) {
    inCombat = true; currentEnemyTile = t;
    document.getElementById('combatModal').style.display = 'flex';
    document.getElementById('modalName').textContent = t.enemy.name;
    document.getElementById('modalImg').src = t.enemy.img;
    updateCombatUI();
}

function doAttack() {
    let e = currentEnemyTile.enemy;
    e.hp -= Math.max(1, getAtk() - e.def);
    if(e.hp <= 0) {
        if(e.isBoss) flags['boss'+e.zone] = true;
        currentEnemyTile.enemy = null;
        inCombat = false;
        document.getElementById('combatModal').style.display = 'none';
        render();
    } else {
        player.hp -= Math.max(1, e.atk - getDef());
        if(player.hp <= 0) location.reload();
    }
    updateCombatUI(); updateHUD();
}

function updateCombatUI() {
    let e = currentEnemyTile.enemy;
    document.getElementById('enemyHpBar').style.width = (e.hp/e.hp)*100 + '%';
    document.getElementById('combatPlayerHpBar').style.width = (player.hp/getMaxHp())*100 + '%';
}

function updateHUD() {
    const hpP = (player.hp/getMaxHp())*100;
    document.getElementById('playerHpBar').style.width = hpP + '%';
    document.getElementById('playerHpBar').style.backgroundColor = getHpColor(hpP);
    document.getElementById('playerHpText').textContent = `${player.hp}/${getMaxHp()}`;
    
    const mpP = (player.mp/getMaxMp())*100;
    document.getElementById('playerMpBar').style.width = mpP + '%';
    document.getElementById('playerMpText').textContent = `${player.mp}/${getMaxMp()}`;
    
    document.getElementById('playerClassName').textContent = player.playerClass;
    document.getElementById('playerLevel').textContent = `(Lv. ${player.level})`;
}

function selectClass(c) {
    player.playerClass = c;
    player.baseMaxHp = c === 'Guerrero' ? 60 : 35;
    player.hp = player.baseMaxHp;
    player.baseMaxMp = c === 'Guerrero' ? 10 : 40;
    player.mp = player.baseMaxMp;
    player.baseAtk = c === 'Guerrero' ? 5 : 2;
    player.baseDef = c === 'Guerrero' ? 4 : 1;
    document.getElementById('classModal').style.display = 'none';
    generateWorld();
}

/* Iniciar Juego */
window.addEventListener('keydown', e => {
    if(e.key === 'Escape') toggleMainMenu();
    if(e.key === 'w') move(0,-1); if(e.key === 's') move(0,1);
    if(e.key === 'a') move(-1,0); if(e.key === 'd') move(1,0);
});

initGame();


