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
    enemy_common: new Audio('sounds/enemies/enemy_common.wav'),
    enemy_rare: new Audio('sounds/enemies/enemy_rare.wav'),
    boss_spawn: new Audio('sounds/boss/boss_spawn.wav'),
    boss_attack: new Audio('sounds/boss/boss_attack.wav'),
    boss_die: new Audio('sounds/boss/boss_die.wav'),
    buy_item: new Audio('sounds/items/buy_item.wav'),
    sell_item: new Audio('sounds/items/sell_item.wav'),
    use_potion: new Audio('sounds/items/use_potion.wav'),
    equip: new Audio('sounds/items/equip.wav'),
    inventory: new Audio('sounds/items/inventory.wav')
};

const bgm = {
    city: new Audio('sounds/ambient/amb_city.mp3'),
    field: new Audio('sounds/ambient/amb_field.mp3'),
    boss: new Audio('sounds/ambient/amb_boss.mp3')
};

Object.values(bgm).forEach(track => { track.loop = true; track.volume = 0.3; });
Object.values(sfx).forEach(track => { track.volume = 0.7; });
let currentBGM = null;
let wasInCity = false; 

function playSFX(audioObj) {
    if (!soundEnabled || !audioObj) return;
    try { audioObj.currentTime = 0; let p = audioObj.play(); if (p !== undefined) p.catch(e => {}); } catch(e) {}
}

function playBGM(type) {
    if (!soundEnabled) { Object.values(bgm).forEach(t => t.pause()); return; }
    let target = bgm[type];
    if (currentBGM === target && !target.paused) return; 
    Object.values(bgm).forEach(t => t.pause()); 
    if (target) { let p = target.play(); if (p !== undefined) p.catch(e => {}); currentBGM = target; }
}

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
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`No se pudo poner en pantalla completa.`);
        });
    } else { document.exitFullscreen(); }
}


/* =========================================
   SISTEMA DE NPCs Y LORE
   ========================================= */
const npcsData = [
    { name: 'Alcalde Rufus', icon: '👴', dialogues: ['¡Por favor, héroe! Nuestra ciudad está en peligro.', 'Los caminos ya no son seguros. ¿Nos ayudarás?', 'Te pagaré con fondos de la ciudad si nos proteges.'] },
    { name: 'Herrero Balder', icon: '🔨', dialogues: ['Necesito materiales, pero esos bichos molestan a los mineros.', 'Si despejas la zona, mis martillos volverán a sonar.', 'Las armas no se forjan solas. ¡Ayúdame a limpiar el mapa!'] },
    { name: 'Sabia Elara', icon: '📖', dialogues: ['Siento una perturbación en el flujo del maná... Ve a investigar.', 'Los astros me dijeron que vendrías. Un mal acecha ahí fuera.', 'Toma esta tarea. Es tu destino, lo quieras o no.'] },
    { name: 'Guardia Thorne', icon: '🛡️', dialogues: ['Ojalá pudiera ir yo, pero me lastimé la rodilla con una flecha.', '¡Mantén los ojos abiertos! Hay bestias muy feas cruzando el bosque.', 'Mi lanza está oxidada, será mejor que tú hagas el trabajo sucio.'] }
];

let pendingQuest = null;

function openNPCModal() {
    if (quest) {
        playSFX(sfx.error); logMsg("El NPC dice: '¡Termina la misión que te dimos primero!'"); return;
    }
    
    playSFX(sfx.ui_click);
    const types = ['kill_enemy', 'kill_boss', 'collect_gold'];
    const type = types[Math.floor(Math.random() * types.length)];
    const cd = mapData[currentMapIndex];
    
    if (type === 'kill_enemy') {
        const rEnemy = enemiesPool[Math.floor(Math.random() * enemiesPool.length)];
        pendingQuest = { type: 'kill_enemy', target: rEnemy.name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: 20 * (currentMapIndex + 1), text: `Derrota 3 ${rEnemy.name}s` };
    } else if (type === 'kill_boss') {
        pendingQuest = { type: 'kill_boss', target: cd.boss.name, goal: 1, progress: 0, rewardType: 'potion', rewardAmount: 1, text: `Derrota al ${cd.boss.name}` };
    } else {
        const gTarget = 30 * (currentMapIndex + 1);
        pendingQuest = { type: 'collect_gold', goal: gTarget, progress: 0, rewardType: 'xp', rewardAmount: 15 * (currentMapIndex + 1), text: `Consigue ${gTarget} de oro` };
    }

    const npc = npcsData[Math.floor(Math.random() * npcsData.length)];
    const dialog = npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)];
    
    document.getElementById('npcIcon').textContent = npc.icon;
    document.getElementById('npcName').textContent = npc.name;
    document.getElementById('npcDialog').textContent = `"${dialog}"`;
    
    let rewardText = pendingQuest.rewardAmount + " " + (pendingQuest.rewardType === 'gold' ? 'Oro' : pendingQuest.rewardType === 'xp' ? 'XP' : 'Poción');
    document.getElementById('npcQuestDetail').innerHTML = `<b>Objetivo:</b> ${pendingQuest.text}<br><b>Recompensa:</b> ${rewardText}`;
    
    document.getElementById('npcModal').style.display = 'flex';
}

function closeNPCModal() { playSFX(sfx.ui_click); pendingQuest = null; document.getElementById('npcModal').style.display = 'none'; }
function acceptNPCQuest() { quest = pendingQuest; pendingQuest = null; playSFX(sfx.quest_accept); logMsg("¡Misión aceptada!"); updateHUD(); saveGame(); document.getElementById('npcModal').style.display = 'none'; }


/* =========================================
   SISTEMA BASE DEL JUEGO Y MAPA
   ========================================= */
const SAVE_KEY = 'miniRPG_SaveData';

const mapData = [
    { rarity: 'Común', css: 'rarity-comun', colorClass: 'color-comun', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 10, atk: 2, def: 0, mag: 2, gold: 3, xp: 3, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 8, atk: 3, def: 0, mag: 0, gold: 2, xp: 3, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 40, atk: 6, def: 1, mag: 4, trait: 'regen', gold: 30, xp: 20, img: 'img/bosses/giant_slime.png' }, shop: { weapons: [{ name: 'Daga oxidada', atk: 2, mag: 0, price: 20, icon: 'sword.png' }, { name: 'Varita de madera', atk: 0, mag: 2, price: 30, icon: 'staff.png' }], armors: [{ name: 'Chaleco de cuero', def: 2, hpBonus: 10, mpBonus: 0, price: 40, icon: 'armor.png' }, { name: 'Túnica de aprendiz', def: 0, hpBonus: 0, mpBonus: 15, price: 40, icon: 'robe.png' }] } },
    { rarity: 'Poco Común', css: 'rarity-pococomun', colorClass: 'color-pococomun', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 18, atk: 5, def: 1, mag: 0, gold: 6, xp: 6, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 70, atk: 10, def: 3, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, shop: { weapons: [{ name: 'Espada corta', atk: 5, mag: 0, price: 80, icon: 'sword.png' }, { name: 'Cetro de cristal', atk: 0, mag: 5, price: 100, icon: 'staff.png' }], armors: [{ name: 'Cota verde', def: 5, hpBonus: 25, mpBonus: 0, price: 120, icon: 'armor.png' }, { name: 'Manto místico', def: 1, hpBonus: 5, mpBonus: 30, price: 120, icon: 'robe.png' }] } },
    { rarity: 'Raro', css: 'rarity-raro', colorClass: 'color-raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 30, atk: 8, def: 2, mag: 0, gold: 12, xp: 12, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 120, atk: 15, def: 5, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, shop: { weapons: [{ name: 'Espada larga', atk: 10, mag: 0, price: 250, icon: 'sword.png' }, { name: 'Bastón lunar', atk: 0, mag: 10, price: 300, icon: 'staff.png' }], armors: [{ name: 'Armadura de acero', def: 10, hpBonus: 50, mpBonus: 0, price: 400, icon: 'armor.png' }, { name: 'Túnica estelar', def: 3, hpBonus: 10, mpBonus: 60, price: 400, icon: 'robe.png' }] } },
    { rarity: 'Épico', css: 'rarity-epico', colorClass: 'color-epico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 50, atk: 12, def: 4, mag: 10, gold: 25, xp: 25, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 200, atk: 22, def: 8, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, shop: { weapons: [{ name: 'Mandoble oscuro', atk: 18, mag: 0, price: 700, icon: 'sword.png' }, { name: 'Bastón del vacío', atk: 0, mag: 18, price: 800, icon: 'staff.png' }], armors: [{ name: 'Coraza oscura', def: 18, hpBonus: 100, mpBonus: 0, price: 1200, icon: 'armor.png' }, { name: 'Túnica espectral', def: 6, hpBonus: 20, mpBonus: 120, price: 1200, icon: 'robe.png' }] } },
    { rarity: 'Legendario', css: 'rarity-legendario', colorClass: 'color-legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio Infernal', hp: 80, atk: 18, def: 6, mag: 20, gold: 50, xp: 50, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 350, atk: 30, def: 12, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, shop: { weapons: [{ name: 'Hacha del Caos', atk: 30, mag: 0, price: 2000, icon: 'sword.png' }, { name: 'Cetro solar', atk: 0, mag: 30, price: 2500, icon: 'staff.png' }], armors: [{ name: 'Coraza del caos', def: 30, hpBonus: 200, mpBonus: 0, price: 3500, icon: 'armor.png' }, { name: 'Manto infernal', def: 10, hpBonus: 40, mpBonus: 250, price: 3500, icon: 'robe.png' }] } },
    { rarity: 'Mítico', css: 'rarity-mitico', colorClass: 'color-mitico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 150, atk: 25, def: 10, mag: 30, gold: 100, xp: 100, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 600, atk: 40, def: 20, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, shop: { weapons: [{ name: 'Lanza divina', atk: 50, mag: 0, price: 6000, icon: 'sword.png' }, { name: 'Báculo del tiempo', atk: 0, mag: 50, price: 8000, icon: 'staff.png' }], armors: [{ name: 'Coraza divina', def: 50, hpBonus: 400, mpBonus: 0, price: 12000, icon: 'armor.png' }, { name: 'Túnica astral', def: 20, hpBonus: 80, mpBonus: 500, price: 12000, icon: 'robe.png' }] } }
];

let currentMapIndex = 0;
let MAP_W = 32; let MAP_H = 20;

let player = { 
    x: 2, y: 3, hp: 0, mp: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, level: 1,
    baseMaxHp: 0, baseMaxMp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '',
    inventory: { weapons: [], armors: [] }
};

let map = []; let enemiesPool = []; let quest = null;
let inCombat = false; let currentEnemyTile = null; let lastPlayerPos = { x: 2, y: 3 };

function getMaxHp() { return player.baseMaxHp + (player.armor ? player.armor.hpBonus : 0); }
function getMaxMp() { return player.baseMaxMp + (player.armor ? player.armor.mpBonus : 0); }
function getAtk() { return player.baseAtk + (player.weapon ? player.weapon.atk : 0); }
function getDef() { return player.baseDef + (player.armor ? player.armor.def : 0); }
function getMag() { return player.baseMag + (player.weapon ? player.weapon.mag : 0); }
function getHpColor(percent) { if(percent > 50) return '#4caf50'; if(percent > 20) return '#ffeb3b'; return '#f44336'; }
function logMsg(t) { const log = document.getElementById('log'); const d = document.createElement('div'); d.textContent = `> ${t}`; log.prepend(d); }

function saveGame() {
    try {
        const saveData = { playerData: player, mapIndexData: currentMapIndex, questData: quest, mapDataState: map, mapWData: MAP_W, mapHData: MAP_H };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        logMsg("💾 Partida guardada con éxito.");
    } catch (e) {}
}

function loadGameBtn() {
    playSFX(sfx.ui_click);
    try {
        const savedString = localStorage.getItem(SAVE_KEY);
        if (savedString) {
            const saveData = JSON.parse(savedString);
            player = saveData.playerData; currentMapIndex = saveData.mapIndexData; quest = saveData.questData; map = saveData.mapDataState;
            MAP_W = saveData.mapWData || 32; MAP_H = saveData.mapHData || 20;
            
            if(!player.inventory) player.inventory = { weapons: [], armors: [] };
            if(!player.playerClass) player.playerClass = "Héroe";

            enemiesPool = [];
            for (let i = 0; i <= currentMapIndex; i++) enemiesPool.push(...mapData[i].newEnemies);

            document.getElementById('mapName').textContent = `Mapa ${currentMapIndex + 1} - ${mapData[currentMapIndex].rarity}`;
            document.getElementById('mapName').style.color = mapData[currentMapIndex].colorHex;
            document.getElementById('mapLevel').textContent = `Rec: ${mapData[currentMapIndex].recLevel}`;
            document.getElementById('classModal').style.display = 'none';
            
            updateFOV(); render(); logMsg("📂 Partida cargada."); return true;
        } 
    } catch (e) {}
    return false;
}

function resetGame() {
    playSFX(sfx.ui_click);
    if (confirm("¿Estás seguro de que quieres borrar tu partida?")) {
        try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
        location.reload(); 
    }
}

function initGame() {
    let hasLoaded = false;
    try {
        if (localStorage.getItem(SAVE_KEY)) { 
            hasLoaded = loadGameBtn(); 
            if(hasLoaded) logMsg("Bienvenido de nuevo, " + player.playerClass + "."); 
        }
    } catch(e) {}
    if (!hasLoaded) document.getElementById('classModal').style.display = 'flex';
}

function selectClass(className) {
    playSFX(sfx.ui_click);
    player.playerClass = className;
    if (className === 'Guerrero') {
        player.baseMaxHp = 50; player.hp = 50; player.baseMaxMp = 10; player.mp = 10;
        player.baseAtk = 6; player.baseDef = 3; player.baseMag = 2;
        player.weapon = { name: 'Espada de Madera', atk: 3, mag: 0, colorClass: 'color-comun', icon: 'sword.png' };
    } else {
        player.baseMaxHp = 30; player.hp = 30; player.baseMaxMp = 30; player.mp = 30;
        player.baseAtk = 2; player.baseDef = 1; player.baseMag = 6;
        player.weapon = { name: 'Varita de Novato', atk: 0, mag: 4, colorClass: 'color-comun', icon: 'staff.png' };
    }
    document.getElementById('classModal').style.display = 'none';
    logMsg(`¡Has elegido el camino del ${className}! Buena suerte.`);
    playBGM('field');
    generateMap(); 
}

function checkLevelUp() {
    const xpNeeded = player.level * 15;
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded; player.level++; 
        if (player.playerClass === 'Guerrero') {
            player.baseMaxHp += 12; player.baseMaxMp += 2; player.baseAtk += 3; player.baseDef += 2; player.baseMag += 1;
        } else if (player.playerClass === 'Mago') {
            player.baseMaxHp += 6; player.baseMaxMp += 8; player.baseAtk += 1; player.baseDef += 1; player.baseMag += 3;
        } else {
            player.baseMaxHp += 10; player.baseMaxMp += 5; player.baseAtk += 2; player.baseDef += 1; player.baseMag += 2;
        }
        player.hp = getMaxHp(); player.mp = getMaxMp();
        playSFX(sfx.level_up);
        logMsg(`¡NIVEL ${player.level}! Stats mejoradas.`);
        document.getElementById('playerLevel').textContent = `(Lv. ${player.level})`;
        saveGame();
    }
}

function drawPath(startX, startY, endX, endY) {
    let x = startX, y = startY;
    while(x !== endX || y !== endY) {
        let t = map.find(t => t.x === x && t.y === y);
        if(t && t.type === 'grass') t.type = 'path';
        if(Math.random() < 0.5) { if(x < endX) x++; else if(x > endX) x--; else if(y < endY) y++; else if(y > endY) y--; } 
        else { if(y < endY) y++; else if(y > endY) y--; else if(x < endX) x++; else if(x > endX) x--; }
    }
}

function scaleEnemy(template, isBoss) {
    let e = JSON.parse(JSON.stringify(template));
    let baseMulti = 1.3; 
    let mapScale = 1 + (currentMapIndex * 0.4); 
    let lvlScale = 1 + ((player.level - 1) * 0.15); 
    let finalMulti = baseMulti * mapScale * lvlScale;
    if(isBoss) finalMulti *= 1.3; 

    e.hp = Math.floor(e.hp * finalMulti); e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * finalMulti); e.def = Math.floor(e.def * finalMulti); e.mag = Math.floor(e.mag * finalMulti);
    e.gold = Math.floor(e.gold * (mapScale * lvlScale)); e.xp = Math.floor(e.xp * (mapScale * lvlScale));
    e.isBoss = isBoss;
    return e;
}

function generateMap() {
    map = []; const currentData = mapData[currentMapIndex]; enemiesPool = [];
    MAP_W = 32 + (currentMapIndex * 4); MAP_H = 20 + (currentMapIndex * 2);

    for (let i = 0; i <= currentMapIndex; i++) enemiesPool.push(...mapData[i].newEnemies);
    
    for (let y = 0; y < MAP_H; y++) { for (let x = 0; x < MAP_W; x++) { let type = 'grass'; if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) type = 'water'; map.push({ x, y, type, enemy: null, isCity: false, isBossTile: false, discovered: false }); } }
    
    player.x = 2; player.y = 3; 
    let cityX = Math.floor(Math.random() * (MAP_W - 10)) + 5; let cityY = Math.floor(Math.random() * (MAP_H - 10)) + 5;
    let bossX = MAP_W - 3; let bossY = MAP_H - 3;
    drawPath(player.x, player.y, cityX, cityY); drawPath(cityX, cityY, bossX, bossY);
    
    map.forEach(t => {
        if ((t.x === cityX || t.x === cityX + 1) && (t.y === cityY || t.y === cityY + 1)) { t.type = 'city'; t.isCity = true; }
        if (t.x === bossX && t.y === bossY) { t.enemy = scaleEnemy(currentData.boss, true); t.isBossTile = true; }
    });

    let zones = [];
    enemiesPool.forEach(enemyTemplate => {
        let numClusters = Math.floor(Math.random() * 2) + 2; 
        for(let i=0; i<numClusters; i++){ zones.push({ x: Math.floor(Math.random() * (MAP_W - 4)) + 2, y: Math.floor(Math.random() * (MAP_H - 4)) + 2, template: enemyTemplate }); }
    });

    map.forEach(t => {
        if (t.type === 'grass' || t.type === 'path') {
            if (!t.isCity && !t.isBossTile && !(t.x === player.x && t.y === player.y)) {
                let closestZone = null; let minDist = 999;
                zones.forEach(z => { let d = Math.hypot(t.x - z.x, t.y - z.y); if(d < minDist) { minDist = d; closestZone = z; } });
                let spawnChance = 0;
                if (minDist <= 2) spawnChance = 0.35; else if (minDist <= 4) spawnChance = 0.15; else if (minDist <= 6) spawnChance = 0.05; 
                if (Math.random() < spawnChance && closestZone) { t.enemy = scaleEnemy(closestZone.template, false); 
                } else if (Math.random() < 0.12 && t.type === 'grass') { t.type = 'wall'; }
            }
        }
    });

    document.getElementById('mapName').textContent = `Mapa ${currentMapIndex + 1} - ${currentData.rarity}`;
    document.getElementById('mapName').style.color = currentData.colorHex;
    document.getElementById('mapLevel').textContent = `Rec: ${currentData.recLevel}`;
    
    playSFX(sfx.map_change);
    updateFOV(); render(); saveGame();
}

function updateFOV() {
    map.forEach(t => { if (Math.hypot(t.x - player.x, t.y - player.y) <= 2.5) t.discovered = true; });
}

function centerCamera() {
    const mapEl = document.getElementById('map');
    if(!mapEl) return;
    
    const tileSize = 130; 
    const targetX = (player.x * tileSize) + (128 / 2) - (mapEl.clientWidth / 2);
    const targetY = (player.y * tileSize) + (128 / 2) - (mapEl.clientHeight / 2);
    
    mapEl.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
}

function render() {
    const m = document.getElementById('map'); 
    m.style.gridTemplateColumns = `repeat(${MAP_W}, 128px)`;
    m.style.gridAutoRows = `128px`;
    m.innerHTML = ''; 
    
    let inCityArea = false;
    map.forEach(t => {
        const d = document.createElement('div'); 
        if (!t.discovered) { d.className = 'tile fog'; } 
        else {
            d.className = 'tile ' + t.type;
            if (t.isBossTile) d.className += ' ' + mapData[currentMapIndex].css;
            if (player.x === t.x && player.y === t.y) { d.innerHTML = `<img src="img/player/heroe.png">`; if (t.isCity) inCityArea = true; } 
            else if (t.enemy) { d.innerHTML = `<img src="${t.enemy.img}">`; }
        }
        m.appendChild(d);
    });
    
    setTimeout(centerCamera, 10);

    if (!inCombat) {
        if (inCityArea && !wasInCity) { playSFX(sfx.city_enter); playBGM('city'); } 
        else if (!inCityArea && wasInCity) { playBGM('field'); }
    }
    wasInCity = inCityArea;

    document.getElementById('btnShop').disabled = !inCityArea;
    document.getElementById('btnQuest').disabled = !inCityArea;
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

        let nameEl = document.getElementById('playerClassName');
        if (nameEl) nameEl.textContent = player.playerClass || "Personaje";
        
        let statsEl = document.getElementById('stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <b>Ataque Fís:</b> ${tAtk} <span class="stat-bonus">${player.weapon && player.weapon.atk > 0 ? '(+'+player.weapon.atk+')' : ''}</span><br>
                <b>Poder Mág:</b> ${tMag} <span class="stat-magic">${player.weapon && player.weapon.mag > 0 ? '(+'+player.weapon.mag+')' : ''}</span><br>
                <b>Defensa:</b> ${tDef} <span class="stat-bonus">${player.armor && player.armor.def > 0 ? '(+'+player.armor.def+')' : ''}</span><br>
                <b>XP:</b> ⭐${player.xp}/${player.level * 15} | <b>Oro:</b> <img src="img/items/coin.png" class="icon"> ${player.gold}
            `;
        }

        let eqEl = document.getElementById('equipment');
        if (eqEl) {
            eqEl.innerHTML = `
                <img src="img/weapons/${player.weapon ? player.weapon.icon : 'sword.png'}" class="icon"> <b>Arma:</b> <span class="${player.weapon ? player.weapon.colorClass : ''}">${player.weapon ? player.weapon.name : 'Ninguna'}</span><br>
                <img src="img/weapons/${player.armor ? player.armor.icon : 'armor.png'}" class="icon"> <b>Armadura:</b> <span class="${player.armor ? player.armor.colorClass : ''}">${player.armor ? player.armor.name : 'Ninguna'}</span>
            `;
        }

        let questEl = document.getElementById('quest');
        if (questEl) {
            if (quest) {
                questEl.innerHTML = `<b>Obj:</b> ${quest.text}<br><b>Prog:</b> [${quest.progress}/${quest.goal}]<br><b>Rec:</b> ${quest.rewardAmount} ${quest.rewardType === 'gold' ? 'Oro' : quest.rewardType === 'xp' ? 'XP' : 'Poción'}`;
            } else {
                questEl.innerHTML = "Ve a la Ciudad 🏰 para pedir una misión.";
            }
        }
    } catch (e) {}
}

function openInventory() {
    playSFX(sfx.ui_click);
    let html = '<h3 style="color:var(--accent); margin-top:0;">Armas</h3>';
    if(player.inventory.weapons.length === 0) html += '<p style="font-size:12px; color:#aaa;">No tienes armas guardadas.</p>';
    
    player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        html += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('weapon', ${idx})">Equipar</button></div>`;
    });
    
    html += '<h3 style="color:var(--accent);">Armaduras</h3>';
    if(player.inventory.armors.length === 0) html += '<p style="font-size:12px; color:#aaa;">No tienes armaduras guardadas.</p>';
    
    player.inventory.armors.forEach((a, idx) => {
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        html += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('armor', ${idx})">Equipar</button></div>`;
    });
    
    document.getElementById('invContent').innerHTML = html;
    document.getElementById('invModal').style.display = 'flex';
}

function closeInventory() { 
    playSFX(sfx.ui_click); 
    document.getElementById('invModal').style.display = 'none'; 
}

function equipFromInv(type, idx) {
    playSFX(sfx.equip);
    if (type === 'weapon') {
        const item = player.inventory.weapons.splice(idx, 1)[0];
        if(player.weapon && player.weapon.name !== 'Espada de Madera' && player.weapon.name !== 'Varita de Novato') {
            player.inventory.weapons.push(player.weapon); 
        }
        player.weapon = item;
    } else {
        const item = player.inventory.armors.splice(idx, 1)[0];
        if(player.armor) {
            player.inventory.armors.push(player.armor);
        }
        player.armor = item;
        player.hp = Math.min(getMaxHp(), player.hp + item.hpBonus);
    }
    updateHUD(); openInventory(); saveGame();
}

function openShop() {
    playSFX(sfx.shop_open);
    const cd = mapData[currentMapIndex];
    document.getElementById('shopTier').textContent = `(${cd.rarity})`; document.getElementById('shopTier').className = cd.colorClass;
    
    let html = `
        <div class="shop-item"><span><img src="img/items/potion.png" class="icon"> Poción (+20 HP)</span><button onclick="buyPotion()">10 <img src="img/items/coin.png" class="icon"></button></div>
        <div class="shop-item"><span><img src="img/items/mana_potion.png" class="icon"> Maná (+15 MP)</span><button onclick="buyManaPotion()">12 <img src="img/items/coin.png" class="icon"></button></div>
    `;
    
    cd.shop.weapons.forEach(w => { 
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        html += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="buyWeapon('${w.name}', ${w.atk}, ${w.mag}, ${w.price}, '${cd.colorClass}', '${w.icon}')">${w.price} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    cd.shop.armors.forEach(a => { 
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        html += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${a.name}</span><br><small>${statText}</small></div><button onclick="buyArmor('${a.name}', ${a.def}, ${a.hpBonus}, ${a.mpBonus}, ${a.price}, '${cd.colorClass}', '${a.icon}')">${a.price} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });

    document.getElementById('shopContent').innerHTML = html; document.getElementById('shopModal').style.display = 'flex';
}

function closeShop() { playSFX(sfx.shop_close); document.getElementById('shopModal').style.display = 'none'; }

function buyPotion() { 
    if (player.gold >= 10) { player.gold -= 10; player.potions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Vida."); updateHUD(); saveGame(); } 
    else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}
function buyManaPotion() { 
    if (player.gold >= 12) { player.gold -= 12; player.manaPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Maná."); updateHUD(); saveGame(); } 
    else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}
function buyWeapon(name, atk, mag, price, colorClass, icon) { 
    if (player.gold >= price) { 
        player.gold -= price; 
        if(player.weapon && player.weapon.name !== 'Espada de Madera' && player.weapon.name !== 'Varita de Novato') {
            player.inventory.weapons.push(player.weapon); 
        }
        player.weapon = { name, atk, mag, colorClass, icon }; 
        playSFX(sfx.buy_item); setTimeout(() => playSFX(sfx.equip), 300); logMsg(`Equipaste: ${name}`); updateHUD(); closeShop(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}
function buyArmor(name, def, hpBonus, mpBonus, price, colorClass, icon) { 
    if (player.gold >= price) { 
        player.gold -= price; 
        if(player.armor) player.inventory.armors.push(player.armor);
        player.armor = { name, def, hpBonus, mpBonus, colorClass, icon }; 
        player.hp = Math.min(getMaxHp(), player.hp + hpBonus); player.mp = Math.min(getMaxMp(), player.mp + mpBonus); 
        playSFX(sfx.buy_item); setTimeout(() => playSFX(sfx.equip), 300); logMsg(`Equipaste: ${name}`); updateHUD(); closeShop(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

function move(dx, dy) {
    if (inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex') return;
    
    let nx = player.x + dx, ny = player.y + dy;
    let tile = map.find(t => t.x === nx && t.y === ny);
    if (!tile || tile.type === 'water' || tile.type === 'wall') return;

    playSFX(sfx.step); 
    lastPlayerPos = { x: player.x, y: player.y };
    player.x = nx; player.y = ny;
    updateFOV(); 
    
    centerCamera();
    
    if (tile.enemy) startCombat(tile); else render();
}

function lockCombatButtons(lock) {
    document.getElementById('btnAttack').disabled = lock;
    document.getElementById('btnMagic1').disabled = lock;
    document.getElementById('btnMagic2').disabled = lock;
    document.getElementById('btnFlee').disabled = lock;
}

function startCombat(tile) {
    lockCombatButtons(false); 
    inCombat = true; currentEnemyTile = tile; let enemy = tile.enemy;
    enemy.mag = enemy.mag || 0; enemy.maxHp = enemy.maxHp || enemy.hp;
    
    if (enemy.isBoss) { playSFX(sfx.boss_spawn); playBGM('boss'); } 
    else { playSFX(sfx.enemy_spawn); }
    
    document.getElementById('combatModal').style.display = 'flex';
    document.getElementById('modalName').textContent = enemy.isBoss ? `JEFE: ${enemy.name}` : enemy.name;
    document.getElementById('modalImg').src = enemy.img;
    
    let traitText = "";
    if (enemy.isBoss && enemy.trait) {
        if(enemy.trait === 'regen') traitText = "✨ Regeneración (Cura HP/turno)";
        if(enemy.trait === 'crit') traitText = "⚡ Crítico (Prob 1.5x Daño)";
        if(enemy.trait === 'vampire') traitText = "🦇 Vampirismo (Roba vida)";
    }
    document.getElementById('enemyTraitDisplay').textContent = traitText;
    document.getElementById('modalLog').textContent = `¡Un ${enemy.name} salvaje aparece!`;
    updateCombatUI(); render();
}

function endCombat() { 
    inCombat = false; currentEnemyTile = null; 
    document.getElementById('combatModal').style.display = 'none'; lockCombatButtons(false);
    if (wasInCity) playBGM('city'); else playBGM('field');
    render(); 
}

function updateCombatUI() {
    if (!currentEnemyTile || !currentEnemyTile.enemy) return;
    let enemy = currentEnemyTile.enemy;
    let safeMaxHp = enemy.maxHp || 1;
    const hpPercent = Math.max(0, (enemy.hp / safeMaxHp) * 100);
    
    document.getElementById('enemyHpBar').style.width = `${hpPercent}%`;
    document.getElementById('enemyHpBar').style.backgroundColor = getHpColor(hpPercent);
    document.getElementById('enemyHpText').textContent = `${enemy.hp} / ${safeMaxHp}`;
    document.getElementById('enemyAtk').textContent = enemy.atk;
    document.getElementById('enemyDef').textContent = `${enemy.def} | Mag: ${enemy.mag || 0}`;
}

function doAttack() {
    lockCombatButtons(true);
    let enemy = currentEnemyTile.enemy;
    const pDmg = Math.max(1, getAtk() - enemy.def);
    enemy.hp -= pDmg;
    
    playSFX(sfx.attack); animateEnemyDamage();
    document.getElementById('modalLog').textContent = `Atacas y haces ${pDmg} de daño.`;
    updateCombatUI();

    if (enemy.hp <= 0) {
        setTimeout(() => { document.getElementById('modalLog').textContent += ` ¡Enemigo derrotado!`; setTimeout(resolveVictory, 500); }, 200);
    } else { setTimeout(() => processEnemyTurn(enemy), 500); }
}

function castSpell(spellName) {
    try {
        let enemy = currentEnemyTile.enemy; const pMag = getMag();
        if (spellName === 'fuego') {
            if (player.mp < 5) { playSFX(sfx.error); logMsg("¡No tienes Maná!"); return; } 
            lockCombatButtons(true); player.mp -= 5;
            
            const mDmg = Math.max(1, (pMag * 2) - Math.floor(enemy.def / 2));
            enemy.hp -= mDmg;
            playSFX(sfx.attack); animateEnemyDamage();
            document.getElementById('modalLog').textContent = `🔥 Lanzaste Fuego: ${mDmg} de daño mágico.`;
            
            updateCombatUI(); updateHUD();
            if (enemy.hp <= 0) { setTimeout(() => { document.getElementById('modalLog').textContent += ` ¡Enemigo derrotado!`; setTimeout(resolveVictory, 500); }, 200); } 
            else { setTimeout(() => processEnemyTurn(enemy), 500); }
        } else if (spellName === 'curar') {
            if (player.mp < 8) { playSFX(sfx.error); logMsg("¡No tienes Maná!"); return; } 
            lockCombatButtons(true); player.mp -= 8;
            
            const heal = pMag * 3; player.hp = Math.min(getMaxHp(), player.hp + heal);
            playSFX(sfx.use_potion); 
            document.getElementById('modalLog').textContent = `💚 Te curaste ${heal} de Vida.`;
            updateHUD(); setTimeout(() => processEnemyTurn(enemy), 500);
        }
    } catch (e) { console.error("Error al lanzar hechizo:", e); lockCombatButtons(false); }
}

function animateEnemyDamage() { 
    const imgElement = document.getElementById('modalImg'); 
    imgElement.classList.remove('anim-damage'); void imgElement.offsetWidth; 
    imgElement.classList.add('anim-damage'); 
}

function processEnemyTurn(enemy) {
    try {
        let eDmg = 0; let enemyMag = enemy.mag || 0; let isMagic = (enemyMag > 0 && Math.random() < 0.4); 
        if (enemy.isBoss) playSFX(sfx.boss_attack);

        if (isMagic) {
            eDmg = Math.floor(Math.max(1, (enemyMag * 1.5) - Math.floor(getDef() / 2)));
            document.getElementById('modalLog').textContent += ` ¡Usa magia oscura y recibes ${eDmg} daño!`;
        } else {
            eDmg = Math.max(0, enemy.atk - getDef());
            if (enemy.isBoss && enemy.trait === 'crit' && Math.random() < 0.3) { eDmg = Math.floor(eDmg * 1.5); document.getElementById('modalLog').textContent += ` ⚡ ¡GOLPE CRÍTICO!`; }
            document.getElementById('modalLog').textContent += ` Recibes ${eDmg} daño.`;
        }

        player.hp -= eDmg;
        if (eDmg > 0) playSFX(sfx.hurt);

        if (enemy.isBoss && enemy.trait === 'vampire' && eDmg > 0) {
            let heal = Math.floor(eDmg * 0.5); enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            document.getElementById('modalLog').textContent += ` 🦇 Se cura ${heal} HP.`;
        }
        if (enemy.isBoss && enemy.trait === 'regen') {
            let heal = Math.max(1, Math.floor((enemy.maxHp || enemy.hp) * 0.05));
            enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            document.getElementById('modalLog').textContent += ` ✨ Regenera ${heal} HP.`;
        }

        if (eDmg > 0) { 
            const cardElement = document.getElementById('combatCard'); 
            cardElement.classList.remove('anim-shake'); void cardElement.offsetWidth; cardElement.classList.add('anim-shake'); 
        }
        updateCombatUI(); updateHUD();
    } catch (e) { console.error("Error turno enemigo", e); } 
    finally { setTimeout(() => { lockCombatButtons(false); if (player.hp <= 0) { alert("¡Has caído en batalla!"); try { localStorage.removeItem(SAVE_KEY); } catch(e){} location.reload(); } }, 300); }
}

function resolveVictory() {
    try {
        let enemy = currentEnemyTile.enemy;
        if (enemy.isBoss) playSFX(sfx.boss_die); else playSFX(sfx.enemy_die);

        logMsg(`¡${enemy.name} cayó! +${enemy.gold} Oro, +${enemy.xp} XP`);
        player.gold += enemy.gold; player.xp += enemy.xp;
        
        let dropChance = enemy.isBoss ? 1.0 : 0.25; 
        if (Math.random() < dropChance) {
            const currentShop = mapData[currentMapIndex].shop;
            const isWeapon = Math.random() < 0.5;
            const pool = isWeapon ? currentShop.weapons : currentShop.armors;
            const droppedItem = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
            
            logMsg(`🎁 ¡Encontraste: ${droppedItem.name}!`);
            playSFX(sfx.quest_complete); 
            
            if (isWeapon) player.inventory.weapons.push(droppedItem);
            else player.inventory.armors.push(droppedItem);
        }

        if (quest) {
            if (quest.type === 'kill_enemy' && enemy.name === quest.target && !enemy.isBoss) quest.progress++;
            if (quest.type === 'kill_boss' && enemy.name === quest.target) quest.progress++;
            if (quest.type === 'collect_gold') quest.progress += enemy.gold;
            if (quest.progress >= quest.goal) { 
                playSFX(sfx.quest_complete); logMsg(`¡Misión completada! Vuelve a la Ciudad.`); 
                if (quest.rewardType === 'gold') player.gold += quest.rewardAmount; 
                if (quest.rewardType === 'xp') player.xp += quest.rewardAmount; 
                if (quest.rewardType === 'potion') player.potions += quest.rewardAmount; 
                quest = null; 
            }
        }
        checkLevelUp();

        if (enemy.isBoss) { 
            currentMapIndex++; 
            if (currentMapIndex < mapData.length) { alert("¡Área despejada! Avanzando..."); endCombat(); generateMap(); } 
            else { alert("¡HAS DERROTADO AL DRAGÓN DORADO! JUEGO COMPLETADO."); try { localStorage.removeItem(SAVE_KEY); } catch(e){} location.reload(); }
        } else { currentEnemyTile.enemy = null; endCombat(); saveGame(); }
    } catch (error) { console.error("Falló la victoria.", error); endCombat(); }
}

function doFlee() { playSFX(sfx.ui_click); logMsg("¡Huiste!"); player.x = lastPlayerPos.x; player.y = lastPlayerPos.y; endCombat(); }

function usePotion() { const max = getMaxHp(); if (player.potions > 0 && player.hp < max) { player.hp = Math.min(max, player.hp + 20); player.potions--; playSFX(sfx.use_potion); logMsg("Usaste Poción Vida (+20 HP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
function useManaPotion() { const max = getMaxMp(); if (player.manaPotions > 0 && player.mp < max) { player.mp = Math.min(max, player.mp + 15); player.manaPotions--; playSFX(sfx.use_potion); logMsg("Usaste Poción Maná (+15 MP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') move(0, -1);
    if (k === 's' || k === 'arrowdown') move(0, 1);
    if (k === 'a' || k === 'arrowleft') move(-1, 0);
    if (k === 'd' || k === 'arrowright') move(1, 0);
});

// Evento CRÍTICO para móviles: Recalcula la cámara si el celular rota
window.addEventListener('resize', () => {
    if(!inCombat) centerCamera();
});

initGame();