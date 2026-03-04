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
let isMenuOpen = false; 

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
        document.documentElement.requestFullscreen().catch(err => {});
    } else { document.exitFullscreen(); }
}

function toggleMainMenu() {
    if (inCombat || document.getElementById('classModal').style.display === 'flex') return;
    
    isMenuOpen = !isMenuOpen;
    playSFX(sfx.ui_click);
    
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'none';
    document.getElementById('npcModal').style.display = 'none';

    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
}


/* =========================================
   SISTEMA DE NPCs Y LORE
   ========================================= */
const npcsData = [
    { name: 'Alcalde Rufus', img: 'img/npcs/alcalde.png', dialogues: ['¡Por favor, héroe! Nuestra ciudad está en peligro.', 'Los caminos ya no son seguros. ¿Nos ayudarás?', 'Te pagaré con fondos de la ciudad si nos proteges.'] },
    { name: 'Herrero Balder', img: 'img/npcs/herrero.png', dialogues: ['Necesito materiales, pero esos bichos molestan a los mineros.', 'Si despejas la zona, mis martillos volverán a sonar.', 'Las armas no se forjan solas. ¡Ayúdame a limpiar el mapa!'] },
    { name: 'Sabia Elara', img: 'img/npcs/sabia.png', dialogues: ['Siento una perturbación en el flujo del maná... Ve a investigar.', 'Los astros me dijeron que vendrías. Un mal acecha ahí fuera.', 'Toma esta tarea. Es tu destino, lo quieras o no.'] },
    { name: 'Guardia Thorne', img: 'img/npcs/guardia.png', dialogues: ['Ojalá pudiera ir yo, pero me lastimé la rodilla con una flecha.', '¡Mantén los ojos abiertos! Hay bestias muy feas cruzando el bosque.', 'Mi lanza está oxidada, será mejor que tú hagas el trabajo sucio.'] }
];

let pendingQuest = null;

function openNPCModal() {
    if (quest) {
        playSFX(sfx.error); logMsg("El NPC dice: '¡Termina la misión que te dimos primero!'"); return;
    }
    
    playSFX(sfx.ui_click);
    const types = ['kill_enemy', 'kill_boss', 'collect_gold'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const cd = mapData[currentZoneIndex]; 
    const pool = cd.newEnemies; 
    
    if (type === 'kill_enemy') {
        const rEnemy = pool[Math.floor(Math.random() * pool.length)];
        pendingQuest = { type: 'kill_enemy', target: rEnemy.name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: 20 * (currentZoneIndex + 1), text: `Derrota 3 ${rEnemy.name}s` };
    } else if (type === 'kill_boss') {
        pendingQuest = { type: 'kill_boss', target: cd.boss.name, goal: 1, progress: 0, rewardType: 'potion', rewardAmount: 1, text: `Derrota al ${cd.boss.name}` };
    } else {
        const gTarget = 30 * (currentZoneIndex + 1);
        pendingQuest = { type: 'collect_gold', goal: gTarget, progress: 0, rewardType: 'xp', rewardAmount: 15 * (currentZoneIndex + 1), text: `Consigue ${gTarget} de oro` };
    }

    const npc = npcsData[Math.floor(Math.random() * npcsData.length)];
    const dialog = npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)];
    
    document.getElementById('npcIcon').innerHTML = `<img src="${npc.img}">`;
    document.getElementById('npcName').textContent = npc.name;
    document.getElementById('npcDialog').textContent = `"${dialog}"`;
    
    let rewardText = pendingQuest.rewardAmount + " " + (pendingQuest.rewardType === 'gold' ? 'Oro' : pendingQuest.rewardType === 'xp' ? 'XP' : 'Poción');
    document.getElementById('npcQuestDetail').innerHTML = `<b>Objetivo:</b> ${pendingQuest.text}<br><b>Recompensa:</b> ${rewardText}`;
    
    document.getElementById('npcModal').style.display = 'flex';
}

function closeNPCModal() { playSFX(sfx.ui_click); pendingQuest = null; document.getElementById('npcModal').style.display = 'none'; }
function acceptNPCQuest() { quest = pendingQuest; pendingQuest = null; playSFX(sfx.quest_accept); logMsg("¡Misión aceptada!"); updateHUD(); saveGame(); document.getElementById('npcModal').style.display = 'none'; }


/* =========================================
   SISTEMA BASE DEL JUEGO Y BALANCE
   ========================================= */
const SAVE_KEY = 'miniRPG_WorldSave';

const mapData = [
    { rarity: 'Común', css: 'rarity-comun', colorClass: 'color-comun', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, shop: { weapons: [{ name: 'Daga de Hierro', atk: 3, mag: 0, price: 30, icon: 'sword.png' }, { name: 'Varita de Hueso', atk: 0, mag: 4, price: 40, icon: 'staff.png' }], armors: [{ name: 'Chaleco de cuero', def: 2, hpBonus: 15, mpBonus: 0, price: 40, icon: 'armor.png' }, { name: 'Túnica de aprendiz', def: 1, hpBonus: 0, mpBonus: 20, price: 40, icon: 'robe.png' }] } },
    { rarity: 'Poco Común', css: 'rarity-pococomun', colorClass: 'color-pococomun', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, shop: { weapons: [{ name: 'Espada corta', atk: 6, mag: 0, price: 80, icon: 'sword.png' }, { name: 'Cetro de cristal', atk: 0, mag: 7, price: 100, icon: 'staff.png' }], armors: [{ name: 'Cota verde', def: 4, hpBonus: 30, mpBonus: 0, price: 120, icon: 'armor.png' }, { name: 'Manto místico', def: 2, hpBonus: 10, mpBonus: 40, price: 120, icon: 'robe.png' }] } },
    { rarity: 'Raro', css: 'rarity-raro', colorClass: 'color-raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 40, atk: 18, def: 3, mag: 0, gold: 12, xp: 14, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 150, atk: 25, def: 6, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, shop: { weapons: [{ name: 'Espada larga', atk: 12, mag: 0, price: 250, icon: 'sword.png' }, { name: 'Bastón lunar', atk: 0, mag: 12, price: 300, icon: 'staff.png' }], armors: [{ name: 'Armadura de acero', def: 8, hpBonus: 60, mpBonus: 0, price: 400, icon: 'armor.png' }, { name: 'Túnica estelar', def: 4, hpBonus: 15, mpBonus: 80, price: 400, icon: 'robe.png' }] } },
    { rarity: 'Épico', css: 'rarity-epico', colorClass: 'color-epico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 65, atk: 25, def: 6, mag: 10, gold: 25, xp: 28, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 250, atk: 35, def: 10, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, shop: { weapons: [{ name: 'Mandoble oscuro', atk: 20, mag: 0, price: 700, icon: 'sword.png' }, { name: 'Bastón del vacío', atk: 0, mag: 22, price: 800, icon: 'staff.png' }], armors: [{ name: 'Coraza oscura', def: 15, hpBonus: 120, mpBonus: 0, price: 1200, icon: 'armor.png' }, { name: 'Túnica espectral', def: 7, hpBonus: 30, mpBonus: 150, price: 1200, icon: 'robe.png' }] } },
    { rarity: 'Legendario', css: 'rarity-legendario', colorClass: 'color-legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio Infernal', hp: 100, atk: 35, def: 8, mag: 20, gold: 50, xp: 60, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 450, atk: 50, def: 15, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, shop: { weapons: [{ name: 'Hacha del Caos', atk: 35, mag: 0, price: 2000, icon: 'sword.png' }, { name: 'Cetro solar', atk: 0, mag: 38, price: 2500, icon: 'staff.png' }], armors: [{ name: 'Coraza del caos', def: 25, hpBonus: 250, mpBonus: 0, price: 3500, icon: 'armor.png' }, { name: 'Manto infernal', def: 12, hpBonus: 50, mpBonus: 300, price: 3500, icon: 'robe.png' }] } },
    { rarity: 'Mítico', css: 'rarity-mitico', colorClass: 'color-mitico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 180, atk: 50, def: 12, mag: 30, gold: 100, xp: 120, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 800, atk: 70, def: 25, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, shop: { weapons: [{ name: 'Lanza divina', atk: 60, mag: 0, price: 6000, icon: 'sword.png' }, { name: 'Báculo del tiempo', atk: 0, mag: 65, price: 8000, icon: 'staff.png' }], armors: [{ name: 'Coraza divina', def: 40, hpBonus: 500, mpBonus: 0, price: 12000, icon: 'armor.png' }, { name: 'Túnica astral', def: 20, hpBonus: 100, mpBonus: 600, price: 12000, icon: 'robe.png' }] } }
];

const MAP_W = 100; 
const MAP_H = 100;

let worldMap = []; 
let flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };
let currentZoneIndex = 0; 

let player = { 
    x: 16, y: 25,
    hp: 0, mp: 0, ep: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, energyPotions: 1, level: 1,
    baseMaxHp: 0, baseMaxMp: 0, baseMaxEp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '',
    inventory: { weapons: [], armors: [] }
};

let quest = null; let inCombat = false; let currentEnemyTile = null; let lastPlayerPos = { x: 16, y: 25 };

function getMaxHp() { return player.baseMaxHp + (player.armor ? player.armor.hpBonus : 0); }
function getMaxMp() { return player.baseMaxMp + (player.armor ? player.armor.mpBonus : 0); }
function getMaxEp() { return player.baseMaxEp; }
function getAtk() { return player.baseAtk + (player.weapon ? player.weapon.atk : 0); }
function getDef() { return player.baseDef + (player.armor ? player.armor.def : 0); }
function getMag() { return player.baseMag + (player.weapon ? player.weapon.mag : 0); }
function getHpColor(percent) { if(percent > 50) return '#4caf50'; if(percent > 20) return '#ffeb3b'; return '#f44336'; }

function logMsg(t) { 
    const logs = [document.getElementById('log'), document.getElementById('menuLog')];
    logs.forEach(log => {
        if(log) {
            const d = document.createElement('div'); 
            d.innerHTML = `> ${t}`; 
            log.prepend(d); 
        }
    });
}

function logCombat(t) {
    const log = document.getElementById('modalLog');
    if(log) {
        const d = document.createElement('div');
        d.innerHTML = t;
        log.prepend(d);
    }
}

function saveGame() {
    try {
        const saveData = { playerData: player, flagsData: flags, questData: quest, mapDataState: worldMap };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        logMsg("💾 Partida guardada con éxito.");
    } catch (e) { console.warn("No se pudo guardar."); }
}

function loadGameBtn() {
    playSFX(sfx.ui_click);
    try {
        const savedString = localStorage.getItem(SAVE_KEY);
        if (savedString) {
            const saveData = JSON.parse(savedString);
            player = saveData.playerData; flags = saveData.flagsData; quest = saveData.questData; worldMap = saveData.mapDataState;
            
            if(!player.inventory) player.inventory = { weapons: [], armors: [] };
            if(!player.playerClass) player.playerClass = "Héroe";
            
            // Fix backwards compatibility
            if(player.ep === undefined) player.ep = player.baseMaxEp || 50;
            if(player.energyPotions === undefined) player.energyPotions = 0;

            document.getElementById('classModal').style.display = 'none';
            
            updateFOV(); render(); logMsg("📂 Partida cargada."); return true;
        } 
    } catch (e) { logMsg("⚠️ Error al cargar."); }
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
    try { if (localStorage.getItem(SAVE_KEY)) { hasLoaded = loadGameBtn(); if(hasLoaded) logMsg("Bienvenido de nuevo, " + player.playerClass + "."); } } catch(e) {}
    if (!hasLoaded) { document.getElementById('classModal').style.display = 'flex'; }
}

function selectClass(className) {
    playSFX(sfx.ui_click);
    player.playerClass = className;
    player.potions = 3; player.manaPotions = 1; player.energyPotions = 1; 

    if (className === 'Guerrero') {
        player.baseMaxHp = 60; player.hp = 60;
        player.baseMaxMp = 10; player.mp = 10;
        player.baseMaxEp = 50; player.ep = 50;
        player.baseAtk = 5; player.baseDef = 4; player.baseMag = 1;
        player.weapon = { name: 'Espada Rota', atk: 2, mag: 0, price: 10, colorClass: 'color-comun', icon: 'sword.png' };
    } else if (className === 'Mago') {
        player.baseMaxHp = 30; player.hp = 30;
        player.baseMaxMp = 60; player.mp = 60;
        player.baseMaxEp = 40; player.ep = 40;
        player.baseAtk = 2; player.baseDef = 1; player.baseMag = 5;
        player.manaPotions = 3; 
        player.weapon = { name: 'Varita Astillada', atk: 0, mag: 3, price: 10, colorClass: 'color-comun', icon: 'staff.png' };
    } else if (className === 'Arquero') {
        player.baseMaxHp = 45; player.hp = 45;
        player.baseMaxMp = 20; player.mp = 20;
        player.baseMaxEp = 80; player.ep = 80;
        player.baseAtk = 4; player.baseDef = 2; player.baseMag = 2;
        player.weapon = { name: 'Arco Corto', atk: 3, mag: 1, price: 10, colorClass: 'color-comun', icon: 'sword.png' }; 
    }
    
    document.getElementById('classModal').style.display = 'none';
    logMsg(`¡Has elegido el camino del ${className}! Buena suerte.`);
    playBGM('field');
    generateWorld(); 
}

function checkLevelUp() {
    const xpNeeded = player.level * 15;
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded; player.level++; 
        
        if (player.playerClass === 'Guerrero') {
            player.baseMaxHp += 8; player.baseMaxMp += 2; player.baseAtk += 2; player.baseDef += 1; player.baseMag += 0;
            player.hp = Math.min(getMaxHp(), player.hp + 8);
            player.mp = Math.min(getMaxMp(), player.mp + 2);
        } else if (player.playerClass === 'Mago') {
            player.baseMaxHp += 4; player.baseMaxMp += 8; player.baseAtk += 0; player.baseDef += 0; player.baseMag += 2;
            player.hp = Math.min(getMaxHp(), player.hp + 4);
            player.mp = Math.min(getMaxMp(), player.mp + 8);
        } else if (player.playerClass === 'Arquero') {
            player.baseMaxHp += 6; player.baseMaxMp += 3; player.baseAtk += 2; player.baseDef += 1; player.baseMag += 1;
            player.hp = Math.min(getMaxHp(), player.hp + 6);
            player.mp = Math.min(getMaxMp(), player.mp + 3);
        }
        
        player.baseMaxEp += 5;
        player.ep = Math.min(getMaxEp(), player.ep + 5);
        
        playSFX(sfx.level_up);
        logMsg(`¡NIVEL ${player.level}! Stats mejoradas.`);
        saveGame();
    }
}

function drawPathWorld(startX, startY, endX, endY) {
    let x = startX, y = startY;
    while(x !== endX || y !== endY) {
        let t = worldMap[y * MAP_W + x];
        if(t && t.type === 'grass') t.type = 'path';
        if(Math.random() < 0.5) { if(x < endX) x++; else if(x > endX) x--; else if(y < endY) y++; else if(y > endY) y--; } 
        else { if(y < endY) y++; else if(y > endY) y--; else if(x < endX) x++; else if(x > endX) x--; }
    }
}

function getZoneIndex(x, y) {
    if (y < 50) {
        if (x < 33) return 0;
        if (x < 66) return 1;
        return 2;
    } else {
        if (x > 65) return 3;
        if (x > 32) return 4;
        return 5;
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
    for(let z=0; z<=5; z++) {
        for(let i=0; i<=z; i++) enemiesPools[z].push(...mapData[i].newEnemies);
    }

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

function centerCamera() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    const tileSize = 514; 
    const targetX = (player.x * tileSize) + (512 / 2) + 6 - (mapEl.clientWidth / 2);
    const targetY = (player.y * tileSize) + (512 / 2) + 6 - (mapEl.clientHeight / 2);
    mapEl.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
}

function render() {
    const m = document.getElementById('map'); 
    m.style.gridTemplateColumns = `repeat(${MAP_W}, 512px)`;
    m.style.gridAutoRows = `512px`;
    m.innerHTML = ''; 
    
    let inCityArea = false;
    currentZoneIndex = getZoneIndex(player.x, player.y);
    
    const vRadiusX = 4;
    const vRadiusY = 3;

    for(let y = Math.max(0, player.y - vRadiusY); y <= Math.min(MAP_H - 1, player.y + vRadiusY); y++) {
        for(let x = Math.max(0, player.x - vRadiusX); x <= Math.min(MAP_W - 1, player.x + vRadiusX); x++) {
            let t = worldMap[y * MAP_W + x];
            if(!t) continue;

            const d = document.createElement('div'); 
            d.style.gridColumn = x + 1;
            d.style.gridRow = y + 1;

            if (!t.discovered) { d.className = 'tile fog'; } 
            else {
                d.className = 'tile ' + t.type;
                if (t.isBossTile) d.classList.add(mapData[t.zone].css);
                
                if (t.type === 'gate' && flags['boss' + t.gateIndex]) {
                    d.className = 'tile path';
                }

                if (player.x === t.x && player.y === t.y) { 
                    d.innerHTML = `<img src="img/player/heroe.png">`; 
                    if (t.isCity) inCityArea = true; 
                } 
                else if (t.enemy) { d.innerHTML = `<img src="${t.enemy.img}">`; }
            }
            m.appendChild(d);
        }
    }
    
    setTimeout(centerCamera, 10);

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
        const tHp = getMaxHp(); const tMp = getMaxMp(); const tEp = getMaxEp();
        const tAtk = getAtk(); const tDef = getDef(); const tMag = getMag();
        
        const hpPercent = Math.max(0, (player.hp / tHp) * 100);
        document.getElementById('playerHpBar').style.width = `${hpPercent}%`;
        document.getElementById('playerHpBar').style.backgroundColor = getHpColor(hpPercent);
        document.getElementById('playerHpText').textContent = `${player.hp} / ${tHp}`;

        const mpPercent = Math.max(0, (player.mp / tMp) * 100);
        document.getElementById('playerMpBar').style.width = `${mpPercent}%`;
        document.getElementById('playerMpText').textContent = `${player.mp} / ${tMp}`;

        const epPercent = Math.max(0, (player.ep / tEp) * 100);
        document.getElementById('playerEpBar').style.width = `${epPercent}%`;
        document.getElementById('playerEpText').textContent = `${player.ep} / ${tEp}`;

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

        let questEl = document.getElementById('quest');
        if (questEl) {
            if (quest) {
                questEl.innerHTML = `<b>Obj:</b> ${quest.text}<br><b>Prog:</b> [${quest.progress}/${quest.goal}]<br><b>Rec:</b> ${quest.rewardAmount} ${quest.rewardType === 'gold' ? 'Oro' : quest.rewardType === 'xp' ? 'XP' : 'Poción'}`;
            } else {
                questEl.innerHTML = "No tienes tareas activas.";
            }
        }
    } catch (e) {}
}

/* =========================================
   SISTEMA DE INVENTARIO MEJORADO
   ========================================= */
function openInventory() {
    playSFX(sfx.ui_click);
    
    // RENDERIZAR EQUIPADO
    let htmlEq = '';
    if (player.weapon) {
        let statText = player.weapon.atk > 0 ? `ATK +${player.weapon.atk}` : `MAG +${player.weapon.mag}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.weapon.icon}" class="icon"> <span class="${player.weapon.colorClass}">${player.weapon.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('weapon')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa;">Arma: Nada equipado</p>`;
    }
    
    if (player.armor) {
        let statText = player.armor.mpBonus > 0 ? `DEF +${player.armor.def} | MANÁ +${player.armor.mpBonus}` : `DEF +${player.armor.def} | VIDA +${player.armor.hpBonus}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.armor.icon}" class="icon"> <span class="${player.armor.colorClass}">${player.armor.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('armor')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; margin-top:15px;">Armadura: Nada equipado</p>`;
    }
    document.getElementById('invEquipped').innerHTML = htmlEq;

    // RENDERIZAR MOCHILA
    let htmlBag = '<h4 style="color:#fff; margin:0 0 5px 0; font-size:13px;">Armas</h4>';
    if(player.inventory.weapons.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa;">No tienes armas.</p>';
    player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('weapon', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    htmlBag += '<h4 style="color:#fff; margin:15px 0 5px 0; font-size:13px;">Armaduras</h4>';
    if(player.inventory.armors.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa;">No tienes armaduras.</p>';
    player.inventory.armors.forEach((a, idx) => {
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('armor', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    document.getElementById('invBag').innerHTML = htmlBag; 
    document.getElementById('invModal').style.display = 'flex';
}

function closeInventory() { playSFX(sfx.ui_click); document.getElementById('invModal').style.display = 'none'; }

function unequipItem(type) {
    playSFX(sfx.equip);
    if (type === 'weapon' && player.weapon) {
        player.inventory.weapons.push(player.weapon);
        player.weapon = null;
        logMsg("Desequipaste tu arma.");
    } else if (type === 'armor' && player.armor) {
        player.inventory.armors.push(player.armor);
        player.armor = null;
        player.hp = Math.min(getMaxHp(), player.hp);
        player.mp = Math.min(getMaxMp(), player.mp);
        logMsg("Desequipaste tu armadura.");
    }
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
        player.armor = item; 
        player.hp = Math.min(getMaxHp(), player.hp + (item.hpBonus || 0));
    }
    updateHUD(); openInventory(); saveGame();
}

/* =========================================
   SISTEMA DE TIENDA Y ECONOMÍA (COMPRA/VENTA)
   ========================================= */
function openShop() {
    playSFX(sfx.shop_open); 
    const cd = mapData[currentZoneIndex];
    document.getElementById('shopTier').textContent = `(${cd.rarity})`; document.getElementById('shopTier').className = cd.colorClass;
    
    // Generar pestaña de Compra
    let htmlBuy = `
        <div class="shop-item"><span><img src="img/items/potion.png" class="icon"> Poción (+25 HP)</span><button onclick="buyPotion()">20 <img src="img/items/coin.png" class="icon"></button></div>
        <div class="shop-item"><span><img src="img/items/mana_potion.png" class="icon"> Maná (+20 MP)</span><button onclick="buyManaPotion()">25 <img src="img/items/coin.png" class="icon"></button></div>
        <div class="shop-item"><span><img src="img/items/potion.png" class="icon" style="filter: hue-rotate(280deg);"> Energía (+30 EP)</span><button onclick="buyEnergyPotion()">15 <img src="img/items/coin.png" class="icon"></button></div>
    `;
    cd.shop.weapons.forEach(w => { 
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="buyWeapon('${w.name}', ${w.atk}, ${w.mag}, ${w.price}, '${cd.colorClass}', '${w.icon}')">${w.price} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    cd.shop.armors.forEach(a => { 
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${a.name}</span><br><small>${statText}</small></div><button onclick="buyArmor('${a.name}', ${a.def}, ${a.hpBonus}, ${a.mpBonus}, ${a.price}, '${cd.colorClass}', '${a.icon}')">${a.price} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    document.getElementById('shopContentBuy').innerHTML = htmlBuy; 
    
    renderSellTab(); // Preparar pestaña de Venta
    switchShopTab('buy'); // Por defecto abre en Comprar
    
    document.getElementById('shopModal').style.display = 'flex';
}

function renderSellTab() {
    let htmlSell = '<h4 style="color:#fff; margin:0 0 5px 0; font-size:13px;">Tus Armas</h4>';
    if(player.inventory.weapons.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa;">Mochila vacía.</p>';
    player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        let sellPrice = Math.floor((w.price || 15) / 2); // Se vende a mitad de precio
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button class="btn-success" onclick="sellWeapon(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    
    htmlSell += '<h4 style="color:#fff; margin:10px 0 5px 0; font-size:13px;">Tus Armaduras</h4>';
    if(player.inventory.armors.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa;">Mochila vacía.</p>';
    player.inventory.armors.forEach((a, idx) => {
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        let sellPrice = Math.floor((a.price || 20) / 2);
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${statText}</small></div><button class="btn-success" onclick="sellArmor(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    document.getElementById('shopContentSell').innerHTML = htmlSell;
}

function switchShopTab(tab) {
    playSFX(sfx.ui_click);
    if(tab === 'buy') {
        document.getElementById('tabBuy').classList.add('active-tab');
        document.getElementById('tabSell').classList.remove('active-tab');
        document.getElementById('shopContentBuy').style.display = 'block';
        document.getElementById('shopContentSell').style.display = 'none';
    } else {
        document.getElementById('tabSell').classList.add('active-tab');
        document.getElementById('tabBuy').classList.remove('active-tab');
        document.getElementById('shopContentSell').style.display = 'block';
        document.getElementById('shopContentBuy').style.display = 'none';
    }
}

function closeShop() { playSFX(sfx.shop_close); document.getElementById('shopModal').style.display = 'none'; }

function sellWeapon(idx, price) {
    playSFX(sfx.sell_item);
    player.inventory.weapons.splice(idx, 1);
    player.gold += price;
    logMsg(`Vendiste un arma por ${price} oro.`);
    updateHUD(); renderSellTab(); saveGame();
}

function sellArmor(idx, price) {
    playSFX(sfx.sell_item);
    player.inventory.armors.splice(idx, 1);
    player.gold += price;
    logMsg(`Vendiste una armadura por ${price} oro.`);
    updateHUD(); renderSellTab(); saveGame();
}

function buyPotion() { if (player.gold >= 20) { player.gold -= 20; player.potions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Vida."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
function buyManaPotion() { if (player.gold >= 25) { player.gold -= 25; player.manaPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Maná."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
function buyEnergyPotion() { if (player.gold >= 15) { player.gold -= 15; player.energyPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Energía."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
function buyWeapon(name, atk, mag, price, colorClass, icon) { 
    if (player.gold >= price) { 
        player.gold -= price; 
        player.inventory.weapons.push({ name, atk, mag, price, colorClass, icon }); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}
function buyArmor(name, def, hpBonus, mpBonus, price, colorClass, icon) { 
    if (player.gold >= price) { 
        player.gold -= price; 
        player.inventory.armors.push({ name, def, hpBonus, mpBonus, price, colorClass, icon }); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

/* =========================================
   CONTROLES Y MOVIMIENTO
   ========================================= */
function move(dx, dy) {
    if (isMenuOpen || inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex') return;
    
    // VERIFICAR ENERGÍA
    if (player.ep <= 0) {
        playSFX(sfx.error);
        logMsg("¡Estás exhausto! Toma una Poción de Energía (EP) o descansa.");
        return;
    }

    let nx = player.x + dx, ny = player.y + dy;
    let tile = worldMap[ny * MAP_W + nx]; 
    
    if (!tile || tile.type === 'water' || tile.type === 'wall') return;

    if (tile.type === 'gate' && !flags['boss' + tile.gateIndex]) {
        playSFX(sfx.error);
        logMsg("🚫 Una energía oscura te impide el paso. Derrota al Jefe.");
        return; 
    }

    playSFX(sfx.step); 
    lastPlayerPos = { x: player.x, y: player.y }; 
    player.x = nx; player.y = ny;
    
    // Restar energía por moverse
    player.ep -= 1;
    
    updateFOV(); centerCamera();
    
    if (tile.enemy) startCombat(tile); else render();
}

function lockCombatButtons(lock) {
    document.getElementById('btnAttack').disabled = lock;
    document.getElementById('btnMagic1').disabled = lock;
    document.getElementById('btnMagic2').disabled = lock;
    document.getElementById('btnFlee').disabled = lock;
}

function animateDamage(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) {
        imgElement.classList.remove('anim-damage'); 
        void imgElement.offsetWidth; 
        imgElement.classList.add('anim-damage'); 
    }
}

function animateHeal(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) {
        imgElement.classList.remove('anim-heal'); 
        void imgElement.offsetWidth; 
        imgElement.classList.add('anim-heal'); 
    }
}

function startCombat(tile) {
    lockCombatButtons(false); 
    inCombat = true; currentEnemyTile = tile; let enemy = tile.enemy;
    enemy.mag = enemy.mag || 0; enemy.maxHp = enemy.maxHp || enemy.hp;
    
    if (enemy.isBoss) { playSFX(sfx.boss_spawn); playBGM('boss'); } 
    else { playSFX(sfx.enemy_spawn); }
    
    document.getElementById('contextActionBar').style.display = 'none'; // Oculta barra ciudad al pelear
    document.getElementById('combatModal').style.display = 'flex';
    document.getElementById('modalLog').innerHTML = ''; // Limpiar log anterior
    
    document.getElementById('modalName').textContent = enemy.isBoss ? `JEFE: ${enemy.name}` : enemy.name;
    document.getElementById('modalImg').src = enemy.img;
    let traitText = "";
    if (enemy.isBoss && enemy.trait) {
        if(enemy.trait === 'regen') traitText = "✨ Regeneración (Cura HP/turno)";
        if(enemy.trait === 'crit') traitText = "⚡ Crítico (Prob 1.5x Daño)";
        if(enemy.trait === 'vampire') traitText = "🦇 Vampirismo (Roba vida)";
    }
    document.getElementById('enemyTraitDisplay').textContent = traitText;

    document.getElementById('combatPlayerName').textContent = player.playerClass || "Héroe";
    document.getElementById('combatPlayerImg').src = 'img/player/heroe.png';
    logCombat(`<div>¡Un <b>${enemy.name}</b> salvaje aparece!</div>`);
    
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

    const tHp = getMaxHp(); const tMp = getMaxMp(); const tEp = getMaxEp();
    const pOp = Math.max(0, (player.hp / tHp) * 100);
    document.getElementById('combatPlayerHpBar').style.width = `${pOp}%`;
    document.getElementById('combatPlayerHpBar').style.backgroundColor = getHpColor(pOp);
    document.getElementById('combatPlayerHpText').textContent = `${player.hp} / ${tHp}`;

    const pMp = Math.max(0, (player.mp / tMp) * 100);
    document.getElementById('combatPlayerMpBar').style.width = `${pMp}%`;
    document.getElementById('combatPlayerMpText').textContent = `${player.mp} / ${tMp}`;
    
    const pEp = Math.max(0, (player.ep / tEp) * 100);
    document.getElementById('combatPlayerEpBar').style.width = `${pEp}%`;
    document.getElementById('combatPlayerEpText').textContent = `${player.ep} / ${tEp}`;
}

function doAttack() {
    lockCombatButtons(true);
    let enemy = currentEnemyTile.enemy;
    const pDmg = Math.max(1, getAtk() - enemy.def);
    enemy.hp -= pDmg;
    
    playSFX(sfx.attack); animateDamage('modalImg'); 
    logCombat(`🗡️ Atacas y haces <b style="color:#ffeb3b">${pDmg}</b> de daño.`);
    
    updateCombatUI();

    if (enemy.hp <= 0) {
        setTimeout(() => { logCombat(`🏆 ¡Enemigo derrotado!`); setTimeout(resolveVictory, 500); }, 200);
    } else { setTimeout(() => processEnemyTurn(enemy), 600); }
}

function castSpell(spellName) {
    try {
        let enemy = currentEnemyTile.enemy; const pMag = getMag();
        if (spellName === 'fuego') {
            if (player.mp < 12) { playSFX(sfx.error); logMsg("¡Faltan 12 MP para Fuego!"); lockCombatButtons(false); return; } 
            lockCombatButtons(true); player.mp -= 12;
            
            const mDmg = Math.max(1, Math.floor(pMag * 1.8) - Math.floor(enemy.def / 2));
            enemy.hp -= mDmg;
            
            playSFX(sfx.attack); animateDamage('modalImg');
            logCombat(`🔥 Lanzaste Fuego: <b style="color:#ff9800">${mDmg}</b> daño mágico.`);
            
            updateCombatUI(); updateHUD();
            if (enemy.hp <= 0) { setTimeout(() => { logCombat(`🏆 ¡Enemigo derrotado!`); setTimeout(resolveVictory, 500); }, 200); } 
            else { setTimeout(() => processEnemyTurn(enemy), 600); }
            
        } else if (spellName === 'curar') {
            if (player.mp < 15) { playSFX(sfx.error); logMsg("¡Faltan 15 MP para Curar!"); lockCombatButtons(false); return; } 
            lockCombatButtons(true); player.mp -= 15;
            
            const heal = Math.floor(pMag * 2.5); player.hp = Math.min(getMaxHp(), player.hp + heal);
            
            playSFX(sfx.use_potion); animateHeal('combatPlayerImg'); 
            logCombat(`💚 Te curaste <b style="color:#4caf50">${heal}</b> de Vida.`);
            
            updateCombatUI(); updateHUD(); 
            setTimeout(() => processEnemyTurn(enemy), 600);
        }
    } catch (e) { console.error("Error al lanzar hechizo:", e); lockCombatButtons(false); }
}

function processEnemyTurn(enemy) {
    try {
        if (!inCombat || !currentEnemyTile) return; 

        let eDmg = 0; let enemyMag = enemy.mag || 0; let isMagic = (enemyMag > 0 && Math.random() < 0.4); 
        if (enemy.isBoss) playSFX(sfx.boss_attack);

        let minDmg = Math.max(1, Math.floor(enemy.atk * 0.15));

        if (isMagic) {
            eDmg = Math.max(minDmg, Math.floor(Math.max(1, (enemyMag * 1.5) - Math.floor(getDef() / 2))));
            logCombat(`🔮 ¡Magia oscura! Recibes <b style="color:#f44336">${eDmg}</b> de daño.`);
        } else {
            eDmg = Math.max(minDmg, enemy.atk - getDef());
            if (enemy.isBoss && enemy.trait === 'crit' && Math.random() < 0.3) { 
                eDmg = Math.floor(eDmg * 1.5); 
                logCombat(`⚡ <b style="color:#ffeb3b">¡GOLPE CRÍTICO!</b>`); 
            }
            logCombat(`💥 Recibes <b style="color:#f44336">${eDmg}</b> de daño.`);
        }

        player.hp -= eDmg;
        if (eDmg > 0) {
            playSFX(sfx.hurt);
            animateDamage('combatPlayerImg'); 
        }

        if (enemy.isBoss && enemy.trait === 'vampire' && eDmg > 0) {
            let heal = Math.floor(eDmg * 0.5); enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg');
            logCombat(`🦇 El jefe se cura <b style="color:#4caf50">${heal}</b> HP.`);
        }
        if (enemy.isBoss && enemy.trait === 'regen') {
            let heal = Math.max(1, Math.floor((enemy.maxHp || enemy.hp) * 0.05));
            enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg');
            logCombat(`✨ Regenera <b style="color:#4caf50">${heal}</b> HP.`);
        }

        updateCombatUI(); updateHUD();
    } catch (e) { 
        console.error("Error turno enemigo:", e); 
        logCombat("<b style='color:red'>⚠️ Error de sistema. Turno saltado.</b>");
    } 
    finally { 
        setTimeout(() => { 
            lockCombatButtons(false); 
            if (player.hp <= 0) { 
                alert("¡Has caído en batalla!"); 
                try { localStorage.removeItem(SAVE_KEY); } catch(ex){} 
                location.reload(); 
            } 
        }, 350); 
    }
}

function resolveVictory() {
    try {
        let enemy = currentEnemyTile.enemy;
        if (enemy.isBoss) {
            playSFX(sfx.boss_die);
            flags['boss' + enemy.zone] = true; 
            logMsg(`🔓 ¡Un poder oscuro se disipa! El camino a la siguiente zona está abierto.`);
        } else {
            playSFX(sfx.enemy_die);
            logMsg(`¡${enemy.name} cayó! +${enemy.gold} Oro, +${enemy.xp} XP`);
        }

        player.gold += enemy.gold; player.xp += enemy.xp;
        
        let dropChance = enemy.isBoss ? 1.0 : 0.25; 
        if (Math.random() < dropChance) {
            const currentShop = mapData[currentEnemyTile.zone].shop; 
            const isWeapon = Math.random() < 0.5;
            const pool = isWeapon ? currentShop.weapons : currentShop.armors;
            const droppedItem = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
            
            logMsg(`🎁 ¡Encontraste: ${droppedItem.name}! Se ha guardado en tu Mochila.`);
            playSFX(sfx.quest_complete); 
            if (isWeapon) player.inventory.weapons.push(droppedItem); else player.inventory.armors.push(droppedItem);
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

        if (enemy.isBoss && enemy.zone === 5) { 
            alert("¡HAS DERROTADO AL DRAGÓN DORADO Y SALVADO EL MUNDO! JUEGO COMPLETADO."); 
            try { localStorage.removeItem(SAVE_KEY); } catch(e){} location.reload(); 
        } 
        
        currentEnemyTile.enemy = null; 
        endCombat(); saveGame();
        
    } catch (error) { console.error("Falló la victoria.", error); endCombat(); }
}

function doFlee() { playSFX(sfx.ui_click); logMsg("¡Huiste!"); player.x = lastPlayerPos.x; player.y = lastPlayerPos.y; endCombat(); }

function usePotion() { const max = getMaxHp(); if (player.potions > 0 && player.hp < max) { player.hp = Math.min(max, player.hp + 25); player.potions--; playSFX(sfx.use_potion); logMsg("Usaste Poción Vida (+25 HP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
function useManaPotion() { const max = getMaxMp(); if (player.manaPotions > 0 && player.mp < max) { player.mp = Math.min(max, player.mp + 20); player.manaPotions--; playSFX(sfx.use_potion); logMsg("Usaste Poción Maná (+20 MP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
function useEnergyPotion() { const max = getMaxEp(); if (player.energyPotions > 0 && player.ep < max) { player.ep = Math.min(max, player.ep + 30); player.energyPotions--; playSFX(sfx.use_potion); logMsg("Usaste Poción Energía (+30 EP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }

window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    
    if (e.key === 'Escape') { toggleMainMenu(); return; }
    
    if (k === 'w' || k === 'arrowup') move(0, -1);
    if (k === 's' || k === 'arrowdown') move(0, 1);
    if (k === 'a' || k === 'arrowleft') move(-1, 0);
    if (k === 'd' || k === 'arrowright') move(1, 0);
});

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

initGame();

/* =========================================
   SOPORTE DE CONTROLES TÁCTILES (MÓVIL)
   ========================================= */
function setupTouchControls() {
    const bindTouch = (id, dx, dy) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        
        btn.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault(); 
            move(dx, dy);
        }, { passive: false });
        
        btn.addEventListener('mousedown', (e) => {
            if (e.cancelable) e.preventDefault();
            move(dx, dy);
        });
    };

    bindTouch('btnUp', 0, -1);
    bindTouch('btnDown', 0, 1);
    bindTouch('btnLeft', -1, 0);
    bindTouch('btnRight', 1, 0);
}

setupTouchControls();