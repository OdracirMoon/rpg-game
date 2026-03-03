/* =========================================
   SISTEMA DE AUDIO INTEGRAL
   ========================================= */
let soundEnabled = true;

const sfx = {
    ui_click: new Audio('sounds/ui/ui_click.wav'),
    shop_open: new Audio('sounds/ui/shop_open.wav'),
    shop_close: new Audio('sounds/ui/shop_close.wav'),
    quest_accept: new Audio('sounds/ui/quest_accept.wav'),
    quest_complete: new Audio('sounds/ui/quest_complete.wav'),
    error: new Audio('sounds/ui/error.wav'),
    step: new Audio('sounds/movement/step.wav'),
    city_enter: new Audio('sounds/movement/city_enter.wav'),
    map_change: new Audio('sounds/movement/map_change.wav'),
    attack: new Audio('sounds/combat/attack.wav'),
    hurt: new Audio('sounds/combat/hurt.wav'),
    enemy_die: new Audio('sounds/combat/enemy_die.wav'),
    level_up: new Audio('sounds/combat/level_up.wav'),
    enemy_spawn: new Audio('sounds/enemies/enemy_spawn.wav'),
    boss_spawn: new Audio('sounds/boss/boss_spawn.wav'),
    buy_item: new Audio('sounds/items/buy_item.wav'),
    sell_item: new Audio('sounds/items/sell_item.wav'),
    use_potion: new Audio('sounds/items/use_potion.wav'),
    equip: new Audio('sounds/items/equip.wav')
};

const bgm = {
    city: new Audio('sounds/ambient/amb_city.mp3'),
    field: new Audio('sounds/ambient/amb_field.mp3'),
    boss: new Audio('sounds/ambient/amb_boss.mp3')
};

Object.values(bgm).forEach(t => { t.loop = true; t.volume = 0.3; });
function playSFX(o) { if (!soundEnabled || !o) return; try{o.currentTime = 0; o.play().catch(e=>{});}catch(e){} }
function playBGM(type) { if (!soundEnabled) return; let target = bgm[type]; if (currentBGM === target) return; Object.values(bgm).forEach(t => t.pause()); if (target) { target.play().catch(e=>{}); currentBGM = target; } }

function toggleAudio() {
    soundEnabled = !soundEnabled;
    document.getElementById('btnAudio').textContent = soundEnabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
    if (soundEnabled) {
        playSFX(sfx.ui_click);
        if (inCombat && currentEnemyTile && currentEnemyTile.enemy.isBoss) playBGM('boss');
        else if (wasInCity) playBGM('city');
        else playBGM('field');
    } else { Object.values(bgm).forEach(t => t.pause()); }
}

function toggleFullscreen() {
    playSFX(sfx.ui_click);
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else { document.exitFullscreen(); }
}

/* =========================================
   MUNDO Y JUGADOR
   ========================================= */
const MAP_W = 100; const MAP_H = 100;
let worldMap = []; 
let flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };
let currentZoneIndex = 0; let isMenuOpen = false;

let player = { 
    x: 16, y: 25, 
    hp: 0, mp: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, level: 1, 
    baseMaxHp: 0, baseMaxMp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '', 
    inventory: { weapons: [], armors: [] } 
};
let quest = null; let inCombat = false; let currentEnemyTile = null; let lastPlayerPos = { x: 16, y: 25 };
let currentBGM = null; let wasInCity = false;

// LA BASE DE DATOS COMPLETA (¡No borrar nada de aquí!)
const mapData = [
    { rarity: 'Común', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, shop: { weapons: [{ name: 'Daga de Hierro', atk: 3, mag: 0, price: 30, icon: 'sword.png' }, { name: 'Varita de Hueso', atk: 0, mag: 4, price: 40, icon: 'staff.png' }], armors: [{ name: 'Chaleco de cuero', def: 2, hpBonus: 15, mpBonus: 0, price: 40, icon: 'armor.png' }, { name: 'Túnica de aprendiz', def: 1, hpBonus: 0, mpBonus: 20, price: 40, icon: 'robe.png' }] } },
    { rarity: 'Poco Común', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, shop: { weapons: [{ name: 'Espada corta', atk: 6, mag: 0, price: 80, icon: 'sword.png' }, { name: 'Cetro de cristal', atk: 0, mag: 7, price: 100, icon: 'staff.png' }], armors: [{ name: 'Cota verde', def: 4, hpBonus: 30, mpBonus: 0, price: 120, icon: 'armor.png' }, { name: 'Manto místico', def: 2, hpBonus: 10, mpBonus: 40, price: 120, icon: 'robe.png' }] } },
    { rarity: 'Raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 40, atk: 18, def: 3, mag: 0, gold: 12, xp: 14, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 150, atk: 25, def: 6, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, shop: { weapons: [{ name: 'Espada larga', atk: 12, mag: 0, price: 250, icon: 'sword.png' }, { name: 'Bastón lunar', atk: 0, mag: 12, price: 300, icon: 'staff.png' }], armors: [{ name: 'Armadura de acero', def: 8, hpBonus: 60, mpBonus: 0, price: 400, icon: 'armor.png' }, { name: 'Túnica estelar', def: 4, hpBonus: 15, mpBonus: 80, price: 400, icon: 'robe.png' }] } },
    { rarity: 'Épico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 65, atk: 25, def: 6, mag: 10, gold: 25, xp: 28, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 250, atk: 35, def: 10, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, shop: { weapons: [{ name: 'Mandoble oscuro', atk: 20, mag: 0, price: 700, icon: 'sword.png' }, { name: 'Bastón del vacío', atk: 0, mag: 22, price: 800, icon: 'staff.png' }], armors: [{ name: 'Coraza oscura', def: 15, hpBonus: 120, mpBonus: 0, price: 1200, icon: 'armor.png' }, { name: 'Túnica espectral', def: 7, hpBonus: 30, mpBonus: 150, price: 1200, icon: 'robe.png' }] } },
    { rarity: 'Legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio Infernal', hp: 100, atk: 35, def: 8, mag: 20, gold: 50, xp: 60, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 450, atk: 50, def: 15, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, shop: { weapons: [{ name: 'Hacha del Caos', atk: 35, mag: 0, price: 2000, icon: 'sword.png' }, { name: 'Cetro solar', atk: 0, mag: 38, price: 2500, icon: 'staff.png' }], armors: [{ name: 'Coraza del caos', def: 25, hpBonus: 250, mpBonus: 0, price: 3500, icon: 'armor.png' }, { name: 'Manto infernal', def: 12, hpBonus: 50, mpBonus: 300, price: 3500, icon: 'robe.png' }] } },
    { rarity: 'Mítico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 180, atk: 50, def: 12, mag: 30, gold: 100, xp: 120, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 800, atk: 70, def: 25, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, shop: { weapons: [{ name: 'Lanza divina', atk: 60, mag: 0, price: 6000, icon: 'sword.png' }, { name: 'Báculo del tiempo', atk: 0, mag: 65, price: 8000, icon: 'staff.png' }], armors: [{ name: 'Coraza divina', def: 40, hpBonus: 500, mpBonus: 0, price: 12000, icon: 'armor.png' }, { name: 'Túnica astral', def: 20, hpBonus: 100, mpBonus: 600, price: 12000, icon: 'robe.png' }] } }
];

/* FUNCIONES DE APOYO */
function getMaxHp() { return player.baseMaxHp + (player.armor ? player.armor.hpBonus : 0); }
function getMaxMp() { return player.baseMaxMp + (player.armor ? player.armor.mpBonus : 0); }
function getAtk() { return player.baseAtk + (player.weapon ? player.weapon.atk : 0); }
function getDef() { return player.baseDef + (player.armor ? player.armor.def : 0); }
function getMag() { return player.baseMag + (player.weapon ? player.weapon.mag : 0); }
function getHpColor(p) { return p > 50 ? '#4caf50' : (p > 20 ? '#ffeb3b' : '#f44336'); }

function logMsg(t) { 
    const el = document.getElementById('menuLog');
    if(el) {
        const d = document.createElement('div'); d.textContent = `> ${t}`; el.prepend(d); 
    }
}

/* CARGAR Y GUARDAR */
function saveGame() {
    try {
        const saveData = { playerData: player, flagsData: flags, questData: quest, mapDataState: worldMap };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        logMsg("Partida guardada.");
    } catch (e) {}
}

function loadGameBtn() {
    playSFX(sfx.ui_click);
    try {
        const savedString = localStorage.getItem(SAVE_KEY);
        if (savedString) {
            const saveData = JSON.parse(savedString);
            
            // Si cargan un mundo viejo, lo borramos automáticamente para evitar la pantalla negra.
            if (!saveData.mapDataState || saveData.mapDataState.length !== 10000) {
                console.log("Mundo antiguo detectado. Se creará uno nuevo.");
                return false;
            }
            
            player = saveData.playerData; flags = saveData.flagsData; quest = saveData.questData; worldMap = saveData.mapDataState;
            if(!player.inventory) player.inventory = { weapons: [], armors: [] };
            if(!player.playerClass) player.playerClass = "Héroe";

            document.getElementById('classModal').style.display = 'none';
            updateFOV(); render(); return true;
        } 
    } catch (e) {}
    return false;
}

function resetGame() {
    playSFX(sfx.ui_click);
    if (confirm("¿Estás seguro de borrar tu partida?")) {
        try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
        location.reload(); 
    }
}

function initGame() {
    let hasLoaded = false;
    try { if (localStorage.getItem(SAVE_KEY)) { hasLoaded = loadGameBtn(); } } catch(e) {}
    if (!hasLoaded) { document.getElementById('classModal').style.display = 'flex'; }
}

function selectClass(className) {
    playSFX(sfx.ui_click);
    player.playerClass = className;
    if (className === 'Guerrero') {
        player.baseMaxHp = 60; player.hp = 60;
        player.baseMaxMp = 10; player.mp = 10;
        player.baseAtk = 5; player.baseDef = 4; player.baseMag = 1;
        player.weapon = { name: 'Espada Rota', atk: 2, mag: 0, price: 10, colorClass: 'color-comun', icon: 'sword.png' };
    } else {
        player.baseMaxHp = 35; player.hp = 35;
        player.baseMaxMp = 40; player.mp = 40;
        player.baseAtk = 2; player.baseDef = 1; player.baseMag = 5;
        player.weapon = { name: 'Varita Astillada', atk: 0, mag: 3, price: 10, colorClass: 'color-comun', icon: 'staff.png' };
    }
    document.getElementById('classModal').style.display = 'none';
    playBGM('field');
    generateWorld(); 
}

/* SISTEMA TÁCTIL Y MENÚS */
function startTouchMove(dx, dy) {
    playSFX(sfx.ui_click);
    move(dx, dy);
}

function toggleMainMenu() {
    if (inCombat || document.getElementById('classModal').style.display === 'flex') return;
    isMenuOpen = !isMenuOpen;
    playSFX(sfx.ui_click);
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'none';
    document.getElementById('npcModal').style.display = 'none';
    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
    if(isMenuOpen) updateHUD();
}

/* MAPA PROCEDURAL */
function getZoneIndex(x, y) { return y < 50 ? (x < 33 ? 0 : (x < 66 ? 1 : 2)) : (x > 65 ? 3 : (x > 32 ? 4 : 5)); }

function drawPathWorld(startX, startY, endX, endY) {
    let x = startX, y = startY;
    while(x !== endX || y !== endY) {
        let t = worldMap[y * MAP_W + x];
        if(t && t.type === 'grass') t.type = 'path';
        if(Math.random() < 0.5) { if(x < endX) x++; else if(x > endX) x--; else if(y < endY) y++; else if(y > endY) y--; } 
        else { if(y < endY) y++; else if(y > endY) y--; else if(x < endX) x++; else if(x > endX) x--; }
    }
}

function scaleEnemy(template, isBoss, zoneIdx) {
    let e = JSON.parse(JSON.stringify(template));
    let mapScale = 1 + (zoneIdx * 0.6); 
    let lvlScale = 1 + ((player.level - 1) * 0.25); 
    let finalHpMulti = 1.4 * mapScale * lvlScale; 
    let finalAtkMulti = 1.3 * mapScale * lvlScale;
    let finalDefMulti = 1.2 * mapScale * lvlScale;
    
    if(isBoss) { finalHpMulti *= 1.6; finalAtkMulti *= 1.4; finalDefMulti *= 1.3; } 

    e.hp = Math.floor(e.hp * finalHpMulti); e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * finalAtkMulti); e.def = Math.floor(e.def * finalDefMulti); e.mag = Math.floor(e.mag * finalAtkMulti);
    e.gold = Math.floor(e.gold * (1 + zoneIdx * 0.3)); e.xp = Math.floor(e.xp * (1 + zoneIdx * 0.4));
    e.isBoss = isBoss; e.zone = zoneIdx;
    return e;
}

function generateWorld() {
    worldMap = new Array(MAP_W * MAP_H);
    flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };

    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            let type = 'grass';
            if(x===0 || y===0 || x===MAP_W-1 || y===MAP_H-1) type = 'water';
            else if (x === 32 || x === 65 || y === 50) type = 'wall'; 
            worldMap[y * MAP_W + x] = { x, y, type, enemy: null, isCity: false, isBossTile: false, discovered: false, zone: getZoneIndex(x,y) };
        }
    }

    const pois = [
        { cX: 16, cY: 25, bX: 31, bY: 25, gX: 32, gY: 25, bIdx: 0 },
        { cX: 49, cY: 25, bX: 64, bY: 25, gX: 65, gY: 25, bIdx: 1 },
        { cX: 82, cY: 25, bX: 82, bY: 49, gX: 82, gY: 50, bIdx: 2 },
        { cX: 82, cY: 75, bX: 66, bY: 75, gX: 65, gY: 75, bIdx: 3 },
        { cX: 49, cY: 75, bX: 33, bY: 75, gX: 32, gY: 75, bIdx: 4 },
        { cX: 16, cY: 75, bX: 16, bY: 90, gX: null, gY: null, bIdx: 5 }
    ];

    pois.forEach((poi, i) => {
        drawPathWorld(poi.cX, poi.cY, poi.bX, poi.bY);
        if(poi.gX) drawPathWorld(poi.bX, poi.bY, poi.gX, poi.gY);
        if(i < pois.length - 1) {
            let nextPoi = pois[i+1];
            if(poi.gX) drawPathWorld(poi.gX, poi.gY, nextPoi.cX, nextPoi.cY);
        }
        for(let cy = poi.cY; cy <= poi.cY+1; cy++){
            for(let cx = poi.cX; cx <= poi.cX+1; cx++){
                let t = worldMap[cy * MAP_W + cx];
                t.isCity = true;
                if(cx===poi.cX && cy===poi.cY) t.type = 'city city-tl';
                if(cx===poi.cX+1 && cy===poi.cY) t.type = 'city city-tr';
                if(cx===poi.cX && cy===poi.cY+1) t.type = 'city city-bl';
                if(cx===poi.cX+1 && cy===poi.cY+1) t.type = 'city city-br';
            }
        }
        let bTile = worldMap[poi.bY * MAP_W + poi.bX];
        bTile.isBossTile = true;
        bTile.enemy = scaleEnemy(mapData[poi.bIdx].boss, true, poi.bIdx);

        if(poi.gX) {
            let gTile = worldMap[poi.gY * MAP_W + poi.gX];
            gTile.type = 'gate';
            gTile.gateIndex = poi.bIdx;
        }
    });

    let enemiesPools = [[],[],[],[],[],[]];
    for(let z=0; z<=5; z++) { for(let i=0; i<=z; i++) enemiesPools[z].push(...mapData[i].newEnemies); }

    for(let i=0; i < MAP_W * MAP_H; i++) {
        let t = worldMap[i];
        if(t.type === 'grass' || t.type === 'path') {
            if(!t.isCity && !t.isBossTile && !(t.x === 16 && t.y === 25)) { 
                if(Math.random() < 0.06) {
                    let pool = enemiesPools[t.zone];
                    let template = pool[Math.floor(Math.random() * pool.length)];
                    t.enemy = scaleEnemy(template, false, t.zone);
                } else if (Math.random() < 0.12 && t.type === 'grass') {
                    t.type = 'wall';
                }
            }
        }
    }

    player.x = 16; player.y = 25; 
    playSFX(sfx.map_change);
    updateFOV(); render(); saveGame();
}

function updateFOV() {
    for(let y = Math.max(0, player.y - 3); y <= Math.min(MAP_H - 1, player.y + 3); y++) {
        for(let x = Math.max(0, player.x - 3); x <= Math.min(MAP_W - 1, player.x + 3); x++) {
            if (Math.hypot(x - player.x, y - player.y) <= 3) {
                worldMap[y * MAP_W + x].discovered = true;
            }
        }
    }
}

/* =========================================
   RENDER ABSOLUTO LIGERO (ANTI-CRASH)
   ========================================= */
function render() {
    const m = document.getElementById('map'); 
    m.innerHTML = ''; 
    
    let inCityArea = false;
    currentZoneIndex = getZoneIndex(player.x, player.y);
    
    const ts = 512; 
    const screenCenterX = m.clientWidth / 2;
    const screenCenterY = m.clientHeight / 2;

    // Solo dibuja el área visible. En móviles no crashea porque son muy pocos elementos en el DOM
    const vRadius = 2; 

    for(let y = Math.max(0, player.y - vRadius); y <= Math.min(MAP_H - 1, player.y + vRadius); y++) {
        for(let x = Math.max(0, player.x - vRadius); x <= Math.min(MAP_W - 1, player.x + vRadius); x++) {
            let t = worldMap[y * MAP_W + x];
            if(!t) continue;

            const d = document.createElement('div'); 
            d.className = 'tile ' + (t.discovered ? t.type : 'fog');
            
            const offsetX = (x - player.x) * ts;
            const offsetY = (y - player.y) * ts;
            d.style.left = `${screenCenterX + offsetX - (ts / 2)}px`;
            d.style.top = `${screenCenterY + offsetY - (ts / 2)}px`;

            if (t.isBossTile) d.classList.add(mapData[t.zone].css);
            if (t.type === 'gate' && flags['boss' + t.gateIndex]) d.className = 'tile path';

            if (player.x === t.x && player.y === t.y) { 
                d.innerHTML = `<img src="img/player/heroe.png">`; 
                if (t.isCity) inCityArea = true; 
            } 
            else if (t.enemy && t.discovered) { d.innerHTML = `<img src="${t.enemy.img}">`; }
            
            m.appendChild(d);
        }
    }
    
    if (!inCombat) {
        if (inCityArea && !wasInCity) { playSFX(sfx.city_enter); playBGM('city'); } 
        else if (!inCityArea && wasInCity) { playBGM('field'); }
    }
    wasInCity = inCityArea;

    document.getElementById('contextActionBar').style.display = inCityArea && !inCombat ? 'flex' : 'none';
    document.getElementById('mapName').textContent = mapData[currentZoneIndex].rarity;
    
    updateHUD();
}

function updateHUD() {
    try {
        const tHp = getMaxHp(); const tMp = getMaxMp(); const tAtk = getAtk(); const tDef = getDef(); const tMag = getMag();
        
        const hpPercent = Math.max(0, (player.hp / tHp) * 100);
        document.getElementById('playerHpBar').style.width = `${hpPercent}%`;
        document.getElementById('playerHpBar').style.backgroundColor = getHpColor(hpPercent);
        document.getElementById('playerHpText').textContent = `${player.hp} / ${tHp}`;

        const mpPercent = Math.max(0, (player.mp / tMp) * 100);
        document.getElementById('playerMpBar').style.width = `${mpPercent}%`;
        document.getElementById('playerMpText').textContent = `${player.mp} / ${tMp}`;

        document.getElementById('playerClassName').textContent = player.playerClass || "Héroe";
        document.getElementById('playerLevel').textContent = `(Lv. ${player.level})`;

        let statsEl = document.getElementById('menuStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <b>Ataque Fís:</b> ${tAtk} <span class="stat-bonus">${player.weapon && player.weapon.atk > 0 ? '(+'+player.weapon.atk+')' : ''}</span><br>
                <b>Poder Mág:</b> ${tMag} <span class="stat-magic">${player.weapon && player.weapon.mag > 0 ? '(+'+player.weapon.mag+')' : ''}</span><br>
                <b>Defensa:</b> ${tDef} <span class="stat-bonus">${player.armor && player.armor.def > 0 ? '(+'+player.armor.def+')' : ''}</span><br>
                <b>XP:</b> ⭐${player.xp}/${player.level * 15} | <b>Oro:</b> <img src="img/items/coin.png" class="icon"> ${player.gold}
            `;
        }

        let eqEl = document.getElementById('menuEquipment');
        if (eqEl) {
            eqEl.innerHTML = `
                <img src="img/weapons/${player.weapon ? player.weapon.icon : 'sword.png'}" class="icon"> <b>Arma:</b> <span class="${player.weapon ? player.weapon.colorClass : ''}">${player.weapon ? player.weapon.name : 'Ninguna'}</span><br>
                <img src="img/weapons/${player.armor ? player.armor.icon : 'armor.png'}" class="icon"> <b>Armadura:</b> <span class="${player.armor ? player.armor.colorClass : ''}">${player.armor ? player.armor.name : 'Ninguna'}</span>
            `;
        }
    } catch (e) {}
}

/* =========================================
   INVENTARIO, TIENDA Y NPC
   ========================================= */
const npcsData = [
    { name: 'Alcalde Rufus', img: 'img/npcs/alcalde.png', dialogues: ['¡Héroe! La ciudad está en peligro.'] },
    { name: 'Herrero Balder', img: 'img/npcs/herrero.png', dialogues: ['Necesito materiales de los monstruos.'] },
    { name: 'Sabia Elara', img: 'img/npcs/sabia.png', dialogues: ['Siento una perturbación en el maná.'] },
    { name: 'Guardia Thorne', img: 'img/npcs/guardia.png', dialogues: ['Mis rodillas no son lo que eran...'] }
];

function openNPCModal() {
    if (quest) { playSFX(sfx.error); return; }
    playSFX(sfx.ui_click);
    
    const cd = mapData[currentZoneIndex]; 
    const pool = cd.newEnemies; 
    const rEnemy = pool[Math.floor(Math.random() * pool.length)];
    pendingQuest = { type: 'kill_enemy', target: rEnemy.name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: 20 * (currentZoneIndex + 1), text: `Derrota 3 ${rEnemy.name}s` };

    const npc = npcsData[Math.floor(Math.random() * npcsData.length)];
    
    document.getElementById('npcIcon').innerHTML = `<img src="${npc.img}" style="width: 128px; height: 128px; image-rendering: pixelated; border-radius: 8px; border: 2px solid var(--accent); background: #0b1220;">`;
    document.getElementById('npcName').textContent = npc.name;
    document.getElementById('npcDialog').textContent = `"${npc.dialogues[0]}"`;
    document.getElementById('npcQuestDetail').innerHTML = `<b>Objetivo:</b> ${pendingQuest.text}<br><b>Recompensa:</b> ${pendingQuest.rewardAmount} Oro`;
    
    document.getElementById('npcModal').style.display = 'flex';
}

function closeNPCModal() { playSFX(sfx.ui_click); pendingQuest = null; document.getElementById('npcModal').style.display = 'none'; }
function acceptNPCQuest() { quest = pendingQuest; pendingQuest = null; playSFX(sfx.quest_accept); updateHUD(); saveGame(); document.getElementById('npcModal').style.display = 'none'; }

function openInventory() {
    playSFX(sfx.ui_click);
    let htmlEq = '';
    if (player.weapon) {
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.weapon.icon}" class="icon"> <span class="${player.weapon.colorClass}">${player.weapon.name}</span></div><button onclick="unequipItem('weapon')" class="btn-danger">Quitar</button></div>`;
    } else { htmlEq += `<p style="font-size:12px; color:#aaa;">Arma: Nada</p>`; }
    
    if (player.armor) {
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.armor.icon}" class="icon"> <span class="${player.armor.colorClass}">${player.armor.name}</span></div><button onclick="unequipItem('armor')" class="btn-danger">Quitar</button></div>`;
    } else { htmlEq += `<p style="font-size:12px; color:#aaa;">Armadura: Nada</p>`; }
    document.getElementById('invEquipped').innerHTML = htmlEq;

    let htmlBag = '<h4 style="color:#fff; margin:0 0 5px 0;">Armas</h4>';
    player.inventory.weapons.forEach((w, idx) => {
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span></div><button onclick="equipFromInv('weapon', ${idx})" style="background:var(--accent); color:#000;">Usar</button></div>`;
    });
    
    htmlBag += '<h4 style="color:#fff; margin:15px 0 5px 0;">Armaduras</h4>';
    player.inventory.armors.forEach((a, idx) => {
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span></div><button onclick="equipFromInv('armor', ${idx})" style="background:var(--accent); color:#000;">Usar</button></div>`;
    });
    
    document.getElementById('invBag').innerHTML = htmlBag; 
    document.getElementById('invModal').style.display = 'flex';
}

function closeInventory() { playSFX(sfx.ui_click); document.getElementById('invModal').style.display = 'none'; }

function unequipItem(type) {
    playSFX(sfx.equip);
    if (type === 'weapon' && player.weapon) { player.inventory.weapons.push(player.weapon); player.weapon = null; } 
    else if (type === 'armor' && player.armor) { player.inventory.armors.push(player.armor); player.armor = null; player.hp = Math.min(getMaxHp(), player.hp); player.mp = Math.min(getMaxMp(), player.mp); }
    updateHUD(); openInventory(); saveGame();
}

function equipFromInv(type, idx) {
    playSFX(sfx.equip);
    if (type === 'weapon') {
        const item = player.inventory.weapons.splice(idx, 1)[0];
        if(player.weapon) { player.inventory.weapons.push(player.weapon); }
        player.weapon = item;
    } else {
        const item = player.inventory.armors.splice(idx, 1)[0];
        if(player.armor) { player.inventory.armors.push(player.armor); }
        player.armor = item; player.hp = Math.min(getMaxHp(), player.hp + (item.hpBonus || 0));
    }
    updateHUD(); openInventory(); saveGame();
}

function openShop() {
    playSFX(sfx.shop_open); 
    const cd = mapData[currentZoneIndex];
    
    let htmlBuy = `<div class="shop-item"><span><img src="img/items/potion.png" class="icon"> Poción</span><button onclick="buyPotion()">20 💰</button></div>`;
    htmlBuy += `<div class="shop-item"><span><img src="img/items/mana_potion.png" class="icon"> Maná</span><button onclick="buyManaPotion()">25 💰</button></div>`;
    cd.shop.weapons.forEach(w => htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${w.name}</span></div><button onclick="buyWeapon('${w.name}', ${w.atk}, ${w.mag}, ${w.price}, '${cd.colorClass}', '${w.icon}')">${w.price} 💰</button></div>`);
    cd.shop.armors.forEach(a => htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${a.name}</span></div><button onclick="buyArmor('${a.name}', ${a.def}, ${a.hpBonus}, ${a.mpBonus}, ${a.price}, '${cd.colorClass}', '${a.icon}')">${a.price} 💰</button></div>`);
    document.getElementById('shopContentBuy').innerHTML = htmlBuy; 
    
    renderSellTab(); switchShopTab('buy'); 
    document.getElementById('shopModal').style.display = 'flex';
}

function renderSellTab() {
    let htmlSell = '<h4 style="color:#fff; margin:0 0 5px 0;">Tus Armas</h4>';
    player.inventory.weapons.forEach((w, idx) => htmlSell += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span></div><button class="btn-success" onclick="sellWeapon(${idx}, ${Math.floor(w.price/2)})">+${Math.floor(w.price/2)} 💰</button></div>`);
    htmlSell += '<h4 style="color:#fff; margin:10px 0 5px 0;">Tus Armaduras</h4>';
    player.inventory.armors.forEach((a, idx) => htmlSell += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span></div><button class="btn-success" onclick="sellArmor(${idx}, ${Math.floor(a.price/2)})">+${Math.floor(a.price/2)} 💰</button></div>`);
    document.getElementById('shopContentSell').innerHTML = htmlSell;
}

function switchShopTab(tab) {
    playSFX(sfx.ui_click);
    if(tab === 'buy') {
        document.getElementById('tabBuy').classList.add('active-tab'); document.getElementById('tabSell').classList.remove('active-tab');
        document.getElementById('shopContentBuy').style.display = 'block'; document.getElementById('shopContentSell').style.display = 'none';
    } else {
        document.getElementById('tabSell').classList.add('active-tab'); document.getElementById('tabBuy').classList.remove('active-tab');
        document.getElementById('shopContentSell').style.display = 'block'; document.getElementById('shopContentBuy').style.display = 'none';
    }
}
function closeShop() { playSFX(sfx.shop_close); document.getElementById('shopModal').style.display = 'none'; }
function sellWeapon(idx, price) { playSFX(sfx.sell_item); player.inventory.weapons.splice(idx, 1); player.gold += price; updateHUD(); renderSellTab(); saveGame(); }
function sellArmor(idx, price) { playSFX(sfx.sell_item); player.inventory.armors.splice(idx, 1); player.gold += price; updateHUD(); renderSellTab(); saveGame(); }
function buyPotion() { if (player.gold >= 20) { player.gold -= 20; player.potions++; playSFX(sfx.buy_item); updateHUD(); saveGame(); } else alert("Sin oro."); }
function buyManaPotion() { if (player.gold >= 25) { player.gold -= 25; player.manaPotions++; playSFX(sfx.buy_item); updateHUD(); saveGame(); } else alert("Sin oro."); }
function buyWeapon(name, atk, mag, price, colorClass, icon) { if (player.gold >= price) { player.gold -= price; player.inventory.weapons.push({ name, atk, mag, price, colorClass, icon }); playSFX(sfx.buy_item); setTimeout(() => playSFX(sfx.equip), 300); updateHUD(); renderSellTab(); saveGame(); } else alert("Sin oro."); }
function buyArmor(name, def, hpBonus, mpBonus, price, colorClass, icon) { if (player.gold >= price) { player.gold -= price; player.inventory.armors.push({ name, def, hpBonus, mpBonus, price, colorClass, icon }); playSFX(sfx.buy_item); setTimeout(() => playSFX(sfx.equip), 300); updateHUD(); renderSellTab(); saveGame(); } else alert("Sin oro."); }
function usePotion() { const max = getMaxHp(); if (player.potions > 0 && player.hp < max) { player.hp = Math.min(max, player.hp + 25); player.potions--; playSFX(sfx.use_potion); updateHUD(); saveGame(); } }
function useManaPotion() { const max = getMaxMp(); if (player.manaPotions > 0 && player.mp < max) { player.mp = Math.min(max, player.mp + 20); player.manaPotions--; playSFX(sfx.use_potion); updateHUD(); saveGame(); } }


/* =========================================
   COMBATE Y MOVIMIENTO
   ========================================= */
function move(dx, dy) {
    if (isMenuOpen || inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex') return;
    let nx = player.x + dx, ny = player.y + dy; let tile = worldMap[ny * MAP_W + nx]; 
    if (!tile || tile.type === 'water' || tile.type === 'wall') return;
    if (tile.type === 'gate' && !flags['boss' + tile.gateIndex]) { playSFX(sfx.error); return; }
    playSFX(sfx.step); lastPlayerPos = { x: player.x, y: player.y }; player.x = nx; player.y = ny;
    updateFOV(); render();
    if (tile.enemy) startCombat(tile);
}

function startCombat(tile) {
    inCombat = true; currentEnemyTile = tile; let enemy = tile.enemy;
    enemy.mag = enemy.mag || 0; enemy.maxHp = enemy.maxHp || enemy.hp;
    if (enemy.isBoss) { playSFX(sfx.boss_spawn); playBGM('boss'); } else { playSFX(sfx.enemy_spawn); }
    
    document.getElementById('contextActionBar').style.display = 'none';
    document.getElementById('combatModal').style.display = 'flex';
    document.getElementById('modalName').textContent = enemy.isBoss ? `JEFE: ${enemy.name}` : enemy.name;
    document.getElementById('modalImg').src = enemy.img;
    document.getElementById('combatPlayerName').textContent = player.playerClass || "Héroe";
    document.getElementById('modalLog').innerHTML = `<div>¡Un <b>${enemy.name}</b> salvaje aparece!</div>`;
    updateCombatUI();
}

function updateCombatUI() {
    if (!currentEnemyTile || !currentEnemyTile.enemy) return; let enemy = currentEnemyTile.enemy;
    document.getElementById('enemyHpBar').style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
    document.getElementById('enemyHpText').textContent = `${enemy.hp} / ${enemy.maxHp}`;
    document.getElementById('enemyAtk').textContent = enemy.atk; document.getElementById('enemyDef').textContent = `${enemy.def} | Mag: ${enemy.mag || 0}`;
    const tHp = getMaxHp(); document.getElementById('combatPlayerHpBar').style.width = `${Math.max(0, (player.hp / tHp) * 100)}%`; document.getElementById('combatPlayerHpText').textContent = `${player.hp} / ${tHp}`;
    const tMp = getMaxMp(); document.getElementById('combatPlayerMpBar').style.width = `${Math.max(0, (player.mp / tMp) * 100)}%`; document.getElementById('combatPlayerMpText').textContent = `${player.mp} / ${tMp}`;
}

function animateImg(id, anim) { 
    const el = document.getElementById(id); 
    if(el) { el.classList.remove(anim); void el.offsetWidth; el.classList.add(anim); }
}

function doAttack() {
    let enemy = currentEnemyTile.enemy; const pDmg = Math.max(1, getAtk() - enemy.def); enemy.hp -= pDmg;
    playSFX(sfx.attack); animateImg('modalImg', 'anim-damage'); 
    updateCombatUI();
    if (enemy.hp <= 0) { setTimeout(() => { resolveVictory(); }, 500); } else { setTimeout(() => processEnemyTurn(enemy), 600); }
}

function castSpell(spellName) {
    let enemy = currentEnemyTile.enemy; const pMag = getMag();
    if (spellName === 'fuego') {
        if (player.mp < 12) { playSFX(sfx.error); return; } player.mp -= 12;
        enemy.hp -= Math.max(1, Math.floor(pMag * 1.8) - Math.floor(enemy.def / 2));
        playSFX(sfx.attack); animateImg('modalImg', 'anim-damage');
        updateCombatUI(); updateHUD();
        if (enemy.hp <= 0) setTimeout(resolveVictory, 500); else setTimeout(() => processEnemyTurn(enemy), 600);
    } else if (spellName === 'curar') {
        if (player.mp < 15) { playSFX(sfx.error); return; } player.mp -= 15;
        player.hp = Math.min(getMaxHp(), player.hp + Math.floor(pMag * 2.5));
        playSFX(sfx.use_potion); animateImg('combatPlayerImg', 'anim-heal');
        updateCombatUI(); updateHUD(); setTimeout(() => processEnemyTurn(enemy), 600);
    }
}

function processEnemyTurn(enemy) {
    let eDmg = Math.max(Math.max(1, Math.floor(enemy.atk * 0.15)), enemy.atk - getDef());
    player.hp -= eDmg;
    if (eDmg > 0) { playSFX(sfx.hurt); animateImg('combatPlayerImg', 'anim-damage'); }
    updateCombatUI(); updateHUD();
    if (player.hp <= 0) { alert("¡Has caído en batalla!"); localStorage.removeItem(SAVE_KEY); location.reload(); }
}

function resolveVictory() {
    let enemy = currentEnemyTile.enemy;
    if (enemy.isBoss) { playSFX(sfx.boss_die); flags['boss' + enemy.zone] = true; } else { playSFX(sfx.enemy_die); }
    player.gold += enemy.gold; player.xp += enemy.xp;
    
    if (Math.random() < (enemy.isBoss ? 1.0 : 0.25)) {
        const pool = Math.random() < 0.5 ? mapData[enemy.zone].shop.weapons : mapData[enemy.zone].shop.armors;
        const item = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
        playSFX(sfx.quest_complete); 
        if (item.atk !== undefined) player.inventory.weapons.push(item); else player.inventory.armors.push(item);
    }
    
    if (quest && ((quest.type==='kill_enemy' && enemy.name===quest.target && !enemy.isBoss) || (quest.type==='kill_boss' && enemy.name===quest.target))) {
        quest.progress++; if(quest.progress >= quest.goal) { playSFX(sfx.quest_complete); player.gold += quest.rewardAmount; quest = null; }
    }
    
    checkLevelUp(); currentEnemyTile.enemy = null; 
    inCombat = false; document.getElementById('combatModal').style.display = 'none'; 
    if (wasInCity) playBGM('city'); else playBGM('field');
    render(); saveGame();
}

function doFlee() { playSFX(sfx.ui_click); player.x = lastPlayerPos.x; player.y = lastPlayerPos.y; inCombat = false; document.getElementById('combatModal').style.display = 'none'; render(); }

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') { toggleMainMenu(); return; }
    if (k === 'w' || k === 'arrowup') move(0, -1);
    if (k === 's' || k === 'arrowdown') move(0, 1);
    if (k === 'a' || k === 'arrowleft') move(-1, 0);
    if (k === 'd' || k === 'arrowright') move(1, 0);
});

window.addEventListener('resize', () => { if(!inCombat) render(); });

initGame();


