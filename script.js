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
   SISTEMA DE GAME FEEL 
   ========================================= */
function spawnFloatingText(text, color, target) {
    const container = document.getElementById('floatingTextContainer');
    if (!container) return;
    
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.color = color;
    el.innerHTML = text;

    if (target === 'map') {
        el.style.left = '50%';
        el.style.top = '40%';
        el.style.transform = 'translate(-50%, -50%)';
    } else if (target === 'combat-player') {
        el.style.left = '25%';
        el.style.top = '35%';
    } else if (target === 'combat-enemy') {
        el.style.left = '75%';
        el.style.top = '35%';
    } else {
        el.style.left = '50%';
        el.style.top = '50%';
    }

    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1400); 
}

function checkLowHp() {
    const overlay = document.getElementById('damageOverlay');
    if (!overlay) return;
    
    const maxHp = getMaxHp();
    if (player.hp > 0 && player.hp < maxHp * 0.2) {
        overlay.classList.add('low-hp-alert');
    } else {
        overlay.classList.remove('low-hp-alert');
    }
}

/* =========================================
   SISTEMA DE NPCs Y LORE (MISIONES FIJAS)
   ========================================= */
const npcsData = [
    { name: 'Alcalde Rufus', img: 'img/npcs/alcalde.png', dialogues: ['¡Por favor, héroe! El mundo está en peligro.', 'Los caminos ya no son seguros. ¿Nos ayudarás?'] },
    { name: 'Herrero Balder', img: 'img/npcs/herrero.png', dialogues: ['Necesito materiales, pero esos bichos molestan a los mineros.', 'Las armas no se forjan solas. ¡Ayúdame a limpiar la zona!'] },
    { name: 'Sabia Elara', img: 'img/npcs/sabia.png', dialogues: ['Siento una perturbación en el flujo del maná... Ve a investigar.', 'Toma esta tarea. Es tu destino, lo quieras o no.'] },
    { name: 'Guardia Thorne', img: 'img/npcs/guardia.png', dialogues: ['Ojalá pudiera ir yo, pero me lastimé la rodilla con una flecha.', 'Mi lanza está oxidada, será mejor que tú hagas el trabajo sucio.'] }
];

let pendingQuest = null;

function openSpecificNPCModal(npcData) {
    if (quest) {
        playSFX(sfx.error); logMsg(`${npcData.name} te dice: '¡Termina la misión que tienes primero!'`); return;
    }
    
    playSFX(sfx.ui_click);
    
    if (!player.zoneQuestProgress) player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
    if (!player.hasKey) player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };

    let step = player.zoneQuestProgress[currentZoneIndex];
    
    if (step >= 3) {
        playSFX(sfx.error); logMsg(`${npcData.name} te dice: 'Ya has completado todas mis tareas en esta zona. ¡Cruza la puerta y avanza!'`); return;
    }

    const cd = mapData[currentZoneIndex]; 
    let qScale = getMapScale(); // Escalado de misiones según nivel de mapa
    
    // Sistema Secuencial Fijo
    if (step === 0) {
        const rEnemy = cd.newEnemies[0];
        pendingQuest = { type: 'kill_enemy', target: rEnemy.name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: Math.floor(20 * (currentZoneIndex + 1) * qScale), text: `Derrota 3 ${rEnemy.name}s`, zone: currentZoneIndex };
    } else if (step === 1) {
        const gTarget = Math.floor(30 * (currentZoneIndex + 1) * qScale);
        pendingQuest = { type: 'collect_gold', goal: gTarget, progress: 0, rewardType: 'xp', rewardAmount: Math.floor(15 * (currentZoneIndex + 1) * qScale), text: `Consigue ${gTarget} de oro`, zone: currentZoneIndex };
    } else if (step === 2) {
        pendingQuest = { type: 'kill_boss', target: cd.boss.name, goal: 1, progress: 0, rewardType: 'potion', rewardAmount: 1, text: `Derrota al Jefe: ${cd.boss.name}`, zone: currentZoneIndex };
    }

    const dialog = npcData.dialogues[Math.floor(Math.random() * npcData.dialogues.length)];
    
    document.getElementById('npcIcon').innerHTML = `<img src="${npcData.img}">`;
    document.getElementById('npcName').textContent = npcData.name;
    document.getElementById('npcDialog').textContent = `"${dialog}"`;
    
    let rewardText = pendingQuest.rewardAmount + " " + (pendingQuest.rewardType === 'gold' ? 'Oro' : pendingQuest.rewardType === 'xp' ? 'XP' : 'Poción');
    
    if (step === 2) rewardText += " y la Llave";

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
    { rarity: 'Común', css: 'rarity-comun', colorClass: 'color-comun', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, 
      shop: { 
        weapons: [
            { name: 'Daga de Hierro', atk: 3, mag: 0, price: 30, icon: 'iron_dagger.png' },
            { name: 'Varita Astillada', atk: 0, mag: 4, price: 30, icon: 'wood_staff.png' },
            { name: 'Arco de Madera', atk: 2, mag: 1, price: 30, icon: 'wood_bow.png' }
        ], 
        armors: [
            { name: 'Chaleco de Cuero', def: 2, hpBonus: 15, mpBonus: 0, price: 40, icon: 'leather_vest.png' },
            { name: 'Túnica Rasgada', def: 1, hpBonus: 0, mpBonus: 20, price: 40, icon: 'torn_robe.png' },
            { name: 'Capa de Cazador', def: 1, hpBonus: 10, mpBonus: 5, price: 40, icon: 'hunter_cloak.png' }
        ] 
      } 
    },
    { rarity: 'Poco Común', css: 'rarity-pococomun', colorClass: 'color-pococomun', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, 
      shop: { 
        weapons: [
            { name: 'Espada de Acero', atk: 7, mag: 0, price: 90, icon: 'steel_sword.png' },
            { name: 'Cetro de Cristal', atk: 0, mag: 8, price: 90, icon: 'crystal_scepter.png' },
            { name: 'Arco Compuesto', atk: 5, mag: 2, price: 90, icon: 'composite_bow.png' }
        ], 
        armors: [
            { name: 'Cota de Malla', def: 4, hpBonus: 30, mpBonus: 0, price: 120, icon: 'chainmail.png' },
            { name: 'Manto Místico', def: 2, hpBonus: 10, mpBonus: 40, price: 120, icon: 'mystic_mantle.png' },
            { name: 'Jubón Reforzado', def: 3, hpBonus: 20, mpBonus: 10, price: 120, icon: 'reinforced_tunic.png' }
        ] 
      } 
    },
    { rarity: 'Raro', css: 'rarity-raro', colorClass: 'color-raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 40, atk: 18, def: 3, mag: 0, gold: 12, xp: 14, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 150, atk: 25, def: 6, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, 
      shop: { 
        weapons: [
            { name: 'Espada Larga', atk: 12, mag: 0, price: 250, icon: 'long_sword.png' },
            { name: 'Bastón Lunar', atk: 0, mag: 14, price: 250, icon: 'lunar_staff.png' },
            { name: 'Arco Largo', atk: 10, mag: 3, price: 250, icon: 'long_bow.png' }
        ], 
        armors: [
            { name: 'Armadura de Acero', def: 8, hpBonus: 60, mpBonus: 0, price: 400, icon: 'steel_armor.png' },
            { name: 'Túnica Estelar', def: 4, hpBonus: 15, mpBonus: 80, price: 400, icon: 'stellar_robe.png' },
            { name: 'Armadura Ligera', def: 6, hpBonus: 40, mpBonus: 20, price: 400, icon: 'light_armor.png' }
        ] 
      } 
    },
    { rarity: 'Épico', css: 'rarity-epico', colorClass: 'color-epico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 65, atk: 25, def: 6, mag: 10, gold: 25, xp: 28, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 250, atk: 35, def: 10, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, 
      shop: { 
        weapons: [
            { name: 'Mandoble Oscuro', atk: 20, mag: 0, price: 750, icon: 'dark_greatsword.png' },
            { name: 'Bastón del Vacío', atk: 0, mag: 23, price: 750, icon: 'void_staff.png' },
            { name: 'Arco de Sombras', atk: 16, mag: 6, price: 750, icon: 'shadow_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Oscura', def: 15, hpBonus: 120, mpBonus: 0, price: 1200, icon: 'dark_plate.png' },
            { name: 'Túnica Espectral', def: 7, hpBonus: 30, mpBonus: 150, price: 1200, icon: 'spectral_robe.png' },
            { name: 'Manto de Asesino', def: 11, hpBonus: 80, mpBonus: 40, price: 1200, icon: 'assassin_mantle.png' }
        ] 
      } 
    },
    { rarity: 'Legendario', css: 'rarity-legendario', colorClass: 'color-legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio Infernal', hp: 100, atk: 35, def: 8, mag: 20, gold: 50, xp: 60, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 450, atk: 50, def: 15, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, 
      shop: { 
        weapons: [
            { name: 'Hacha del Caos', atk: 35, mag: 0, price: 2200, icon: 'chaos_axe.png' },
            { name: 'Cetro Solar', atk: 0, mag: 40, price: 2200, icon: 'solar_scepter.png' },
            { name: 'Arco de Fuego', atk: 28, mag: 10, price: 2200, icon: 'fire_bow.png' }
        ], 
        armors: [
            { name: 'Coraza del Caos', def: 25, hpBonus: 250, mpBonus: 0, price: 3500, icon: 'chaos_plate.png' },
            { name: 'Manto Infernal', def: 12, hpBonus: 50, mpBonus: 300, price: 3500, icon: 'infernal_mantle.png' },
            { name: 'Armadura Escamada', def: 18, hpBonus: 150, mpBonus: 80, price: 3500, icon: 'scaled_armor.png' }
        ] 
      } 
    },
    { rarity: 'Mítico', css: 'rarity-mitico', colorClass: 'color-mitico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 180, atk: 50, def: 12, mag: 30, gold: 100, xp: 120, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 800, atk: 70, def: 25, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, 
      shop: { 
        weapons: [
            { name: 'Lanza Divina', atk: 60, mag: 0, price: 6500, icon: 'divine_spear.png' },
            { name: 'Báculo del Tiempo', atk: 0, mag: 68, price: 6500, icon: 'time_staff.png' },
            { name: 'Arco Celestial', atk: 50, mag: 15, price: 6500, icon: 'celestial_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Divina', def: 40, hpBonus: 500, mpBonus: 0, price: 12000, icon: 'divine_plate.png' },
            { name: 'Túnica Astral', def: 20, hpBonus: 100, mpBonus: 600, price: 12000, icon: 'astral_robe.png' },
            { name: 'Manto Etéreo', def: 30, hpBonus: 300, mpBonus: 200, price: 12000, icon: 'ethereal_mantle.png' }
        ] 
      } 
    }
];

const MAP_W = 100; 
const MAP_H = 100;

let worldMap = []; 
let flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };
let currentZoneIndex = 0; 
let mapLevel = 1; // Variable de Endgame

let player = { 
    x: 16, y: 25,
    hp: 0, mp: 0, ep: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, energyPotions: 1, level: 1,
    baseMaxHp: 0, baseMaxMp: 0, baseMaxEp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '',
    mapImg: 'img/player/heroe.png', combatImg: 'img/player/heroe.png',
    inventory: { weapons: [], armors: [] },
    zoneQuestProgress: [0, 0, 0, 0, 0, 0],
    hasKey: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false }
};

let quest = null; 
let inCombat = false; 
let currentEnemyTile = null; 
let lastPlayerPos = { x: 16, y: 25 };

let combatState = {
    defBuffTurns: 0,
    poisonTurns: 0
};

// Utilidad para escalar estadísticas según el nivel del mapa endgame
function getMapScale() {
    return 1 + ((mapLevel - 1) * 0.5);
}

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
        const saveData = { playerData: player, flagsData: flags, questData: quest, mapDataState: worldMap, mapLevelData: mapLevel };
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
            mapLevel = saveData.mapLevelData || 1;
            
            if(!player.inventory) player.inventory = { weapons: [], armors: [] };
            if(!player.playerClass) player.playerClass = "Guerrero";
            
            if(player.ep === undefined) player.ep = player.baseMaxEp || 50;
            if(player.energyPotions === undefined) player.energyPotions = 0;
            if(!player.mapImg) player.mapImg = `img/player/${player.playerClass.toLowerCase()}_mapa.png`;
            if(!player.combatImg) player.combatImg = `img/player/${player.playerClass.toLowerCase()}_combate.png`;

            if(!player.zoneQuestProgress) player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
            if(!player.hasKey) player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };

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
    player.gold = 0; 
    player.weapon = null; 
    player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
    player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
    mapLevel = 1; // Reset endgame lvl
    
    let classNameLower = className.toLowerCase();
    player.mapImg = `img/player/${classNameLower}_mapa.png`;
    player.combatImg = `img/player/${classNameLower}_combate.png`;

    if (className === 'Guerrero') {
        player.baseMaxHp = 60; player.hp = 60;
        player.baseMaxMp = 10; player.mp = 10;
        player.baseMaxEp = 50; player.ep = 50;
        player.baseAtk = 5; player.baseDef = 4; player.baseMag = 1;
        player.weapon = { name: 'Espada Rota', atk: 2, mag: 0, price: 10, colorClass: 'color-comun', icon: 'iron_dagger.png' };
    } else if (className === 'Mago') {
        player.baseMaxHp = 30; player.hp = 30;
        player.baseMaxMp = 60; player.mp = 60;
        player.baseMaxEp = 40; player.ep = 40;
        player.baseAtk = 2; player.baseDef = 1; player.baseMag = 5;
        player.manaPotions = 3; 
        player.weapon = { name: 'Varita Astillada', atk: 0, mag: 3, price: 10, colorClass: 'color-comun', icon: 'wood_staff.png' };
    } else if (className === 'Arquero') {
        player.baseMaxHp = 45; player.hp = 45;
        player.baseMaxMp = 20; player.mp = 20;
        player.baseMaxEp = 80; player.ep = 80;
        player.baseAtk = 4; player.baseDef = 2; player.baseMag = 2;
        player.weapon = { name: 'Arco Corto', atk: 3, mag: 1, price: 10, colorClass: 'color-comun', icon: 'wood_bow.png' }; 
    } else if (className === 'Simple') {
        player.baseMaxHp = 40; player.hp = 40;
        player.baseMaxMp = 10; player.mp = 10;
        player.baseMaxEp = 40; player.ep = 40;
        player.baseAtk = 2; player.baseDef = 1; player.baseMag = 1;
        player.gold = 100; 
    }
    
    document.getElementById('classModal').style.display = 'none';
    logMsg(`¡Has elegido el camino de la clase ${className}! Buena suerte.`);
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
        } else if (player.playerClass === 'Simple') {
            player.baseMaxHp += 5; player.baseMaxMp += 2; player.baseAtk += 1; player.baseDef += 1; player.baseMag += 1;
            player.hp = Math.min(getMaxHp(), player.hp + 5);
            player.mp = Math.min(getMaxMp(), player.mp + 2);
        }
        
        player.baseMaxEp += 5;
        player.ep = Math.min(getMaxEp(), player.ep + 5);
        
        playSFX(sfx.level_up);
        spawnFloatingText('¡NIVEL UP!', '#ffeb3b', inCombat ? 'combat-player' : 'map');
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
    let globalMapLevelScale = getMapScale(); // Escalado Endgame
    
    let finalHpMulti = 1.4 * mapScale * lvlScale * globalMapLevelScale; 
    let finalAtkMulti = 1.3 * mapScale * lvlScale * globalMapLevelScale;
    let finalDefMulti = 1.2 * mapScale * lvlScale * globalMapLevelScale;
    
    if(isBoss) { finalHpMulti *= 1.6; finalAtkMulti *= 1.4; finalDefMulti *= 1.3; } 

    e.hp = Math.floor(e.hp * finalHpMulti); e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * finalAtkMulti); e.def = Math.floor(e.def * finalDefMulti); e.mag = Math.floor(e.mag * finalAtkMulti);
    e.gold = Math.floor(e.gold * (1 + zoneIdx * 0.3) * globalMapLevelScale); 
    e.xp = Math.floor(e.xp * (1 + zoneIdx * 0.4) * globalMapLevelScale);
    e.isBoss = isBoss; e.zone = zoneIdx;
    
    // Distintivo visual en el nombre para niveles altos
    if(mapLevel > 1) e.name += ` (Lv.${mapLevel})`;
    
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
            
            worldMap[y * MAP_W + x] = { x, y, type, enemy: null, npc: null, merchant: false, chest: null, isBossTile: false, discovered: false, zone: getZoneIndex(x,y) };
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
            if(!t.isBossTile && !(t.x === 16 && t.y === 25)) { 
                let rand = Math.random();
                if(rand < 0.06) {
                    let pool = enemiesPools[t.zone];
                    let template = pool[Math.floor(Math.random() * pool.length)];
                    t.enemy = scaleEnemy(template, false, t.zone);
                } else if (rand < 0.12 && t.type === 'grass') {
                    t.type = 'wall';
                } else if (rand < 0.18 && t.type === 'grass') {
                    t.type = 'swamp'; 
                } else if (rand < 0.19 && t.type === 'grass') {
                    t.type = 'fountain'; 
                }

                if (Math.random() < 0.02 && t.type !== 'wall' && t.type !== 'fountain' && !t.enemy) {
                    t.chest = { opened: false };
                }
            }
        }
    }

    for(let z = 0; z <= 5; z++) {
        let zoneTiles = worldMap.filter(t => t.zone === z && t.type === 'path' && !t.isBossTile && !t.enemy && !(t.x === 16 && t.y === 25));
        
        if (zoneTiles.length < 2) {
            let extraTiles = worldMap.filter(t => t.zone === z && (t.type === 'grass' || t.type === 'swamp') && !t.isBossTile && !t.enemy && !(t.x === 16 && t.y === 25));
            zoneTiles = zoneTiles.concat(extraTiles);
        }

        zoneTiles.sort(() => Math.random() - 0.5); 
        
        let randomNPC = npcsData[Math.floor(Math.random() * npcsData.length)];

        if(zoneTiles[0]) { zoneTiles[0].npc = randomNPC; }
        if(zoneTiles[1]) { zoneTiles[1].merchant = true; }
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

// NUEVO: Función para calcular dinámicamente el tamaño de la cuadrícula para garantizar un radio visible
function getTileSize() {
    // Tomamos la dimensión más pequeña de la pantalla y la dividimos entre 3
    // Así garantizamos que siempre veas un cuadro de 3x3 perfecto (el tuyo en el centro) sin importar si giras el móvil o achicas la PC
    return Math.floor(Math.min(window.innerWidth, window.innerHeight) / 3);
}

function centerCamera() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    const TS = getTileSize();
    const stride = TS + 2; // TS + 2px de gap
    
    const targetX = (player.x * stride) + (TS / 2) - (mapEl.clientWidth / 2);
    const targetY = (player.y * stride) + (TS / 2) - (mapEl.clientHeight / 2);
    mapEl.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
}

function render() {
    const TS = getTileSize();
    const stride = TS + 2;
    const m = document.getElementById('map'); 
    
    // Hacemos el grid del mapa totalmente dinámico y responsivo
    m.style.gridTemplateColumns = `repeat(${MAP_W}, ${TS}px)`;
    m.style.gridAutoRows = `${TS}px`;
    
    const existingTiles = m.querySelectorAll('.tile');
    existingTiles.forEach(t => t.remove());
    
    currentZoneIndex = getZoneIndex(player.x, player.y);
    
    // Calculamos cuantos tiles renderizar dependiendo del tamaño real de la pantalla 
    // (para rellenar los huecos laterales sin hacer trabajo inútil)
    const widthTiles = Math.ceil(window.innerWidth / TS);
    const heightTiles = Math.ceil(window.innerHeight / TS);
    const vRadiusX = Math.ceil(widthTiles / 2) + 1;
    const vRadiusY = Math.ceil(heightTiles / 2) + 1;

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
                
                if (t.type === 'gate' && player.hasKey && player.hasKey[t.gateIndex]) {
                    d.className = 'tile path';
                }

                if (t.enemy) { d.innerHTML = `<img src="${t.enemy.img}">`; }
                else if (t.merchant) { d.innerHTML = `<img src="img/npcs/merchant.png" style="filter: drop-shadow(0 0 10px #4caf50);">`; }
                else if (t.npc) { d.innerHTML = `<img src="${t.npc.img}" style="filter: drop-shadow(0 0 10px #ffeb3b);">`; }
                else if (t.chest) {
                    if (!t.chest.opened) {
                        d.innerHTML = `<img src="img/tiles/chest_closed.png" class="chest-img">`;
                    } else {
                        d.innerHTML = `<img src="img/tiles/chest_opened.png" style="opacity: 0.5;">`;
                    }
                }
                else if (t.type === 'fountain') {
                    d.innerHTML = `<img src="img/tiles/fountain_obj.png" class="fountain-img">`;
                }
            }
            m.appendChild(d);
        }
    }
    
    let sprite = document.getElementById('playerSprite');
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.id = 'playerSprite';
        sprite.className = 'player-sprite';
        m.appendChild(sprite);
    }
    sprite.innerHTML = `<img src="${player.mapImg}">`;
    // Ajuste posicional dinámico en lugar del tamaño fijo (512) de antes
    sprite.style.width = `${TS}px`;
    sprite.style.height = `${TS}px`;
    sprite.style.left = (player.x * stride) + 'px';
    sprite.style.top = (player.y * stride) + 'px';
    
    setTimeout(centerCamera, 10);
    
    document.getElementById('mapName').textContent = mapData[currentZoneIndex].rarity + (mapLevel > 1 ? ` (Mapa Lv.${mapLevel})` : '');
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
                <img src="img/weapons/${player.weapon ? player.weapon.icon : 'iron_dagger.png'}" class="icon"> <b>Arma:</b> <span class="${player.weapon ? player.weapon.colorClass : ''}">${player.weapon ? player.weapon.name : 'Ninguna'}</span><br>
                <img src="img/weapons/${player.armor ? player.armor.icon : 'leather_vest.png'}" class="icon"> <b>Armadura:</b> <span class="${player.armor ? player.armor.colorClass : ''}">${player.armor ? player.armor.name : 'Ninguna'}</span>
            `;
        }

        let questEl = document.getElementById('quest');
        if (questEl) {
            if (quest) {
                questEl.innerHTML = `<b>Obj:</b> ${quest.text}<br><b>Prog:</b> [${quest.progress}/${quest.goal}]<br><b>Rec:</b> ${quest.rewardAmount} ${quest.rewardType === 'gold' ? 'Oro' : quest.rewardType === 'xp' ? 'XP' : 'Poción'}`;
            } else {
                questEl.innerHTML = "No tienes tareas activas. Explora el mapa para encontrar NPCs.";
            }
        }
        
        checkLowHp(); 
    } catch (e) {}
}

/* =========================================
   SISTEMA DE INVENTARIO Y EQUIPAMIENTO 
   ========================================= */
function openInventory() {
    playSFX(sfx.ui_click);
    
    let htmlEq = '';
    if (player.weapon) {
        let statText = player.weapon.atk > 0 ? `ATK +${player.weapon.atk}` : `MAG +${player.weapon.mag}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.weapon.icon}" class="icon"> <span class="${player.weapon.colorClass}">${player.weapon.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('weapon')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Arma: Nada equipado</p>`;
    }
    
    if (player.armor) {
        let statText = player.armor.mpBonus > 0 ? `DEF +${player.armor.def} | MANÁ +${player.armor.mpBonus}` : `DEF +${player.armor.def} | VIDA +${player.armor.hpBonus}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${player.armor.icon}" class="icon"> <span class="${player.armor.colorClass}">${player.armor.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('armor')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Armadura: Nada equipado</p>`;
    }
    document.getElementById('invEquipped').innerHTML = htmlEq;

    let htmlBag = '<h4>Armas</h4>';
    if(player.inventory.weapons.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armas en la mochila.</p>';
    player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('weapon', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    htmlBag += '<h4>Armaduras</h4>';
    if(player.inventory.armors.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armaduras en la mochila.</p>';
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
   SISTEMA DE TIENDA (COMPRA/VENTA)
   ========================================= */
function openShop() {
    playSFX(sfx.shop_open); 
    const cd = mapData[currentZoneIndex];
    document.getElementById('shopTier').textContent = `(${cd.rarity})`; document.getElementById('shopTier').className = cd.colorClass;
    
    let scaleFactor = getMapScale();
    let pPrice = Math.floor(20 * scaleFactor);
    let mpPrice = Math.floor(25 * scaleFactor);
    let epPrice = Math.floor(15 * scaleFactor);

    let htmlBuy = `
        <div class="shop-item"><div><img src="img/items/potion.png" class="icon"> <span>Poción (+25 HP)</span></div><button onclick="buyPotion()">${pPrice} <img src="img/items/coin.png" class="icon"></button></div>
        <div class="shop-item"><div><img src="img/items/mana_potion.png" class="icon"> <span>Maná (+20 MP)</span></div><button onclick="buyManaPotion()">${mpPrice} <img src="img/items/coin.png" class="icon"></button></div>
        <div class="shop-item"><div><img src="img/items/energy_potion.png" class="icon" style="filter: hue-rotate(280deg);"> <span>Energía (+30 EP)</span></div><button onclick="buyEnergyPotion()">${epPrice} <img src="img/items/coin.png" class="icon"></button></div>
    `;
    cd.shop.weapons.forEach(w => { 
        let sAtk = Math.floor(w.atk * scaleFactor);
        let sMag = Math.floor(w.mag * scaleFactor);
        let sPrice = Math.floor(w.price * scaleFactor);
        let sName = w.name + (mapLevel > 1 ? ` +${mapLevel - 1}` : '');
        let statText = sAtk > 0 ? `ATK +${sAtk}` : `MAG +${sMag}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${statText}</small></div><button onclick="buyWeapon('${sName}', ${sAtk}, ${sMag}, ${sPrice}, '${cd.colorClass}', '${w.icon}')">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    cd.shop.armors.forEach(a => { 
        let sDef = Math.floor(a.def * scaleFactor);
        let sHpB = Math.floor(a.hpBonus * scaleFactor);
        let sMpB = Math.floor(a.mpBonus * scaleFactor);
        let sPrice = Math.floor(a.price * scaleFactor);
        let sName = a.name + (mapLevel > 1 ? ` +${mapLevel - 1}` : '');
        let statText = sMpB > 0 ? `DEF +${sDef} | MANÁ +${sMpB}` : `DEF +${sDef} | VIDA +${sHpB}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${statText}</small></div><button onclick="buyArmor('${sName}', ${sDef}, ${sHpB}, ${sMpB}, ${sPrice}, '${cd.colorClass}', '${a.icon}')">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    document.getElementById('shopContentBuy').innerHTML = htmlBuy; 
    
    renderSellTab(); 
    switchShopTab('buy'); 
    
    document.getElementById('shopModal').style.display = 'flex';
}

function renderSellTab() {
    let htmlSell = '<h4>Tus Armas</h4>';
    if(player.inventory.weapons.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        let sellPrice = Math.floor((w.price || 15) / 2); 
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button class="btn-success" onclick="sellWeapon(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    
    htmlSell += '<h4>Tus Armaduras</h4>';
    if(player.inventory.armors.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
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
        document.getElementById('shopContentBuy').style.display = 'grid';
        document.getElementById('shopContentSell').style.display = 'none';
    } else {
        document.getElementById('tabSell').classList.add('active-tab');
        document.getElementById('tabBuy').classList.remove('active-tab');
        document.getElementById('shopContentSell').style.display = 'grid';
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

function buyPotion() { let p = Math.floor(20 * getMapScale()); if (player.gold >= p) { player.gold -= p; player.potions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Vida."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
function buyManaPotion() { let p = Math.floor(25 * getMapScale()); if (player.gold >= p) { player.gold -= p; player.manaPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Maná."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
function buyEnergyPotion() { let p = Math.floor(15 * getMapScale()); if (player.gold >= p) { player.gold -= p; player.energyPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Energía."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
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
   SISTEMA DE COFRES
   ========================================= */
function openChest(tile) {
    tile.chest.opened = true;
    playSFX(sfx.quest_complete); 
    let r = Math.random();
    let scaleFactor = getMapScale();
    
    if (r < 0.4) {
        let g = Math.floor(20 * (currentZoneIndex + 1) * (1 + Math.random()) * scaleFactor);
        player.gold += g;
        spawnFloatingText('+' + g + ' Oro', '#ffeb3b', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#ffeb3b">${g} Oro</b>.`);
    } else if (r < 0.65) {
        player.potions++;
        spawnFloatingText('+1 HP Potion', '#f44336', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#f44336">1 Poción de Vida</b>.`);
    } else if (r < 0.85) {
        player.energyPotions++;
        spawnFloatingText('+1 EP Potion', '#9c27b0', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#9c27b0">1 Poción de Energía</b>.`);
    } else {
        const currentShop = mapData[currentZoneIndex].shop;
        const isWeapon = Math.random() < 0.5;
        const pool = isWeapon ? currentShop.weapons : currentShop.armors;
        const droppedItem = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
        
        if (isWeapon) {
            droppedItem.atk = Math.floor(droppedItem.atk * scaleFactor);
            droppedItem.mag = Math.floor(droppedItem.mag * scaleFactor);
            player.inventory.weapons.push(droppedItem);
        } else {
            droppedItem.def = Math.floor(droppedItem.def * scaleFactor);
            droppedItem.hpBonus = Math.floor(droppedItem.hpBonus * scaleFactor);
            droppedItem.mpBonus = Math.floor(droppedItem.mpBonus * scaleFactor);
            player.inventory.armors.push(droppedItem);
        }
        
        droppedItem.price = Math.floor((droppedItem.price || 15) * scaleFactor);
        droppedItem.name = droppedItem.name + (mapLevel > 1 ? ` +${mapLevel - 1}` : '');

        spawnFloatingText('+ ' + droppedItem.name, '#7ad7ff', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste una recompensa rara: <b class="${droppedItem.colorClass}">${droppedItem.name}</b>.`);
    }
    
    updateHUD(); saveGame();
}

/* =========================================
   CONTROLES Y MOVIMIENTO 
   ========================================= */
function move(dx, dy) {
    if (isMenuOpen || inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex' || document.getElementById('shopModal').style.display === 'flex') return;
    
    let nx = player.x + dx, ny = player.y + dy;
    let tile = worldMap[ny * MAP_W + nx]; 
    
    if (!tile || tile.type === 'water' || tile.type === 'wall') return;

    let epCost = (tile.type === 'swamp') ? 2 : 1;

    if (player.ep < epCost) {
        playSFX(sfx.error);
        logMsg(`¡Estás exhausto! Necesitas ${epCost} EP para moverte aquí. Usa una poción o descansa.`);
        return;
    }

    if (tile.type === 'gate' && (!player.hasKey || !player.hasKey[tile.gateIndex])) {
        playSFX(sfx.error); logMsg("🚫 La puerta está cerrada. Necesitas la llave (completa la misión del Jefe)."); return; 
    }

    if (tile.enemy && tile.enemy.isBoss) {
        if (!quest || quest.type !== 'kill_boss' || quest.target !== tile.enemy.name.replace(` (Lv.${mapLevel})`, '')) {
            playSFX(sfx.error);
            logMsg("🚫 Aún no estás listo para este Jefe. Completa las misiones de la zona primero.");
            return;
        }
    }

    if (tile.merchant) {
        openShop();
        return;
    } else if (tile.npc) {
        openSpecificNPCModal(tile.npc);
        return;
    }

    playSFX(sfx.step); 
    lastPlayerPos = { x: player.x, y: player.y }; 
    player.x = nx; player.y = ny;
    player.ep -= epCost;
    spawnFloatingText('-' + epCost + ' EP', '#9c27b0', 'map');
    
    updateFOV(); centerCamera();
    
    if (tile.chest && !tile.chest.opened) {
        openChest(tile);
    }

    if (tile.type === 'fountain') {
        let healAmount = getMaxHp() - player.hp;
        let mpAmount = getMaxMp() - player.mp;
        player.hp = getMaxHp();
        player.mp = getMaxMp();
        playSFX(sfx.use_potion);
        logMsg("✨ Te curas completamente en las aguas mágicas de la fuente.");
        
        spawnFloatingText('+' + healAmount + ' HP', '#4caf50', 'map');
        setTimeout(() => spawnFloatingText('+' + mpAmount + ' MP', '#2196f3', 'map'), 300);
        
        updateHUD();
    }

    if (tile.enemy) {
        startCombat(tile); 
    } else {
        render();
    }
}

/* =========================================
   SISTEMA DE HABILIDADES Y COMBATE
   ========================================= */
function generateCombatButtons() {
    const container = document.getElementById('combatActions');
    container.innerHTML = ''; 

    let html = `<button id="btnAttack" onclick="doAttack()" style="font-size: 16px; padding: 12px;"><img src="img/weapons/iron_dagger.png" class="icon"> Atacar</button>`;

    if (player.playerClass === 'Guerrero') {
        html += `<button id="btnSkill1" class="btn-skill" onclick="useSkill('golpe_brutal')" style="font-size: 16px; padding: 12px;">💥 Golpe Brutal (10 EP)</button>`;
        html += `<button id="btnSkill2" class="btn-skill" onclick="useSkill('grito_guerra')" style="font-size: 16px; padding: 12px;">🛡️ Grito Guerra (15 EP)</button>`;
    } else if (player.playerClass === 'Arquero') {
        html += `<button id="btnSkill1" class="btn-skill" onclick="useSkill('tiro_doble')" style="font-size: 16px; padding: 12px;">🏹 Tiro Doble (12 EP)</button>`;
        html += `<button id="btnSkill2" class="btn-skill" onclick="useSkill('flecha_venenosa')" style="font-size: 16px; padding: 12px;">🐍 Veneno (10 EP)</button>`;
    } else if (player.playerClass === 'Mago') {
        html += `<button id="btnSkill1" class="btn-magic" onclick="useSkill('fuego')" style="font-size: 16px; padding: 12px;">🔥 Fuego (12 MP)</button>`;
        html += `<button id="btnSkill2" class="btn-magic" onclick="useSkill('curar')" style="font-size: 16px; padding: 12px;">💚 Curar (15 MP)</button>`;
    }

    html += `<button id="btnFlee" class="btn-danger" onclick="doFlee()" style="font-size: 16px; padding: 12px;">🏃 Huir</button>`;
    
    container.innerHTML = html;
}

function lockCombatButtons(lock) {
    const btns = ['btnAttack', 'btnSkill1', 'btnSkill2', 'btnFlee'];
    btns.forEach(id => {
        let btn = document.getElementById(id);
        if(btn) btn.disabled = lock;
    });
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
    combatState.defBuffTurns = 0;
    combatState.poisonTurns = 0;
    
    generateCombatButtons(); 
    lockCombatButtons(false); 
    inCombat = true; currentEnemyTile = tile; let enemy = tile.enemy;
    enemy.mag = enemy.mag || 0; enemy.maxHp = enemy.maxHp || enemy.hp;
    
    if (enemy.isBoss) { playSFX(sfx.boss_spawn); playBGM('boss'); } 
    else { playSFX(sfx.enemy_spawn); }
    
    document.getElementById('combatModal').style.display = 'flex';
    document.getElementById('modalLog').innerHTML = ''; 
    
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
    document.getElementById('combatPlayerImg').src = player.combatImg; 
    logCombat(`<div>¡Un <b>${enemy.name}</b> salvaje aparece!</div>`);
    
    updateCombatUI(); render();
}

function endCombat() { 
    inCombat = false; currentEnemyTile = null; 
    document.getElementById('combatModal').style.display = 'none'; lockCombatButtons(false);
    playBGM('field');
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

function checkEnemyDeathAndEndTurn(enemy) {
    updateCombatUI(); updateHUD();
    if (enemy.hp <= 0) {
        setTimeout(() => { logCombat(`🏆 ¡Enemigo derrotado!`); setTimeout(resolveVictory, 500); }, 200);
    } else {
        setTimeout(() => processEnemyTurn(enemy), 600);
    }
}

function doAttack() {
    lockCombatButtons(true);
    let enemy = currentEnemyTile.enemy;
    const pDmg = Math.max(1, getAtk() - enemy.def);
    enemy.hp -= pDmg;
    
    playSFX(sfx.attack); animateDamage('modalImg'); 
    spawnFloatingText('-' + pDmg + ' HP', '#fff', 'combat-enemy');
    logCombat(`🗡️ Atacas y haces <b style="color:#ffeb3b">${pDmg}</b> de daño.`);
    
    checkEnemyDeathAndEndTurn(enemy);
}

function useSkill(skillName) {
    lockCombatButtons(true);
    let enemy = currentEnemyTile.enemy;
    const pMag = getMag();
    const pAtk = getAtk();

    if (skillName === 'golpe_brutal') {
        if (player.ep < 10) { playSFX(sfx.error); logMsg("¡Faltan 10 EP!"); lockCombatButtons(false); return; }
        player.ep -= 10;
        let dmg = Math.max(1, Math.floor(pAtk * 2) - enemy.def); 
        enemy.hp -= dmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + dmg + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`💥 Golpe Brutal: <b style="color:#ffeb3b">${dmg}</b> de daño físico.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillName === 'grito_guerra') {
        if (player.ep < 15) { playSFX(sfx.error); logMsg("¡Faltan 15 EP!"); lockCombatButtons(false); return; }
        player.ep -= 15;
        combatState.defBuffTurns = 3;
        playSFX(sfx.equip); animateHeal('combatPlayerImg');
        logCombat(`🛡️ Grito de Guerra: Tu defensa aumenta considerablemente por 3 turnos.`);
        checkEnemyDeathAndEndTurn(enemy); 
    }
    else if (skillName === 'tiro_doble') {
        if (player.ep < 12) { playSFX(sfx.error); logMsg("¡Faltan 12 EP!"); lockCombatButtons(false); return; }
        player.ep -= 12;
        let dmg1 = Math.max(1, Math.floor(pAtk * 0.8) - Math.floor(enemy.def/2));
        let dmg2 = Math.max(1, Math.floor(pAtk * 0.8) - Math.floor(enemy.def/2));
        enemy.hp -= (dmg1 + dmg2);
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + (dmg1 + dmg2) + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`🏹 Tiro Doble: Impactas dos veces haciendo <b style="color:#ffeb3b">${dmg1}</b> y <b style="color:#ffeb3b">${dmg2}</b> de daño.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillName === 'flecha_venenosa') {
        if (player.ep < 10) { playSFX(sfx.error); logMsg("¡Faltan 10 EP!"); lockCombatButtons(false); return; }
        player.ep -= 10;
        let dmg = Math.max(1, pAtk - enemy.def);
        enemy.hp -= dmg;
        combatState.poisonTurns = 4; 
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + dmg + ' HP', '#4caf50', 'combat-enemy');
        logCombat(`🐍 Flecha Venenosa: Haces <b style="color:#ffeb3b">${dmg}</b> de daño e inyectas un veneno letal.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillName === 'fuego') {
        if (player.mp < 12) { playSFX(sfx.error); logMsg("¡Faltan 12 MP!"); lockCombatButtons(false); return; }
        player.mp -= 12;
        const mDmg = Math.max(1, Math.floor(pMag * 1.8) - Math.floor(enemy.def / 2));
        enemy.hp -= mDmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + mDmg + ' HP', '#ff9800', 'combat-enemy');
        logCombat(`🔥 Fuego: <b style="color:#ff9800">${mDmg}</b> de daño mágico.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillName === 'curar') {
        if (player.mp < 15) { playSFX(sfx.error); logMsg("¡Faltan 15 MP!"); lockCombatButtons(false); return; }
        player.mp -= 15;
        const heal = Math.floor(pMag * 2.5) + 10; 
        player.hp = Math.min(getMaxHp(), player.hp + heal);
        playSFX(sfx.use_potion); animateHeal('combatPlayerImg');
        spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-player');
        logCombat(`💚 Te curaste <b style="color:#4caf50">${heal}</b> de Vida.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
}

function processEnemyTurn(enemy) {
    try {
        if (!inCombat || !currentEnemyTile) return; 

        if (combatState.poisonTurns > 0) {
            let poisonDmg = Math.max(2, Math.floor((enemy.maxHp || enemy.hp) * 0.05));
            enemy.hp -= poisonDmg;
            combatState.poisonTurns--;
            animateDamage('modalImg');
            spawnFloatingText('-' + poisonDmg + ' HP', '#4caf50', 'combat-enemy');
            logCombat(`🤢 El veneno drena <b style="color:#4caf50">${poisonDmg}</b> HP al enemigo. (${combatState.poisonTurns} turnos rest.)`);
            updateCombatUI();

            if (enemy.hp <= 0) {
                setTimeout(() => { logCombat(`🏆 ¡Enemigo sucumbió al veneno!`); setTimeout(resolveVictory, 500); }, 200);
                return; 
            }
        }

        let eDmg = 0; let enemyMag = enemy.mag || 0; let isMagic = (enemyMag > 0 && Math.random() < 0.4); 
        if (enemy.isBoss) playSFX(sfx.boss_attack);

        let minDmg = Math.max(1, Math.floor(enemy.atk * 0.15));
        
        let playerCurrentDef = getDef();
        if (combatState.defBuffTurns > 0) {
            playerCurrentDef = Math.floor(playerCurrentDef * 1.5) + 5; 
            combatState.defBuffTurns--;
            logCombat(`🛡️ Tienes escudo activo. (${combatState.defBuffTurns} turnos rest.)`);
        }

        if (isMagic) {
            eDmg = Math.max(minDmg, Math.floor(Math.max(1, (enemyMag * 1.5) - Math.floor(playerCurrentDef / 2))));
            logCombat(`🔮 ¡Magia oscura! Recibes <b style="color:#f44336">${eDmg}</b> de daño.`);
        } else {
            eDmg = Math.max(minDmg, enemy.atk - playerCurrentDef);
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
            spawnFloatingText('-' + eDmg + ' HP', '#f44336', 'combat-player');
        }

        if (enemy.isBoss && enemy.trait === 'vampire' && eDmg > 0) {
            let heal = Math.floor(eDmg * 0.5); enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg');
            spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-enemy');
            logCombat(`🦇 El jefe se cura <b style="color:#4caf50">${heal}</b> HP.`);
        }
        if (enemy.isBoss && enemy.trait === 'regen') {
            let heal = Math.max(1, Math.floor((enemy.maxHp || enemy.hp) * 0.05));
            enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg');
            spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-enemy');
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
        
        // SISTEMA DE ENDGAME MAPA INFINITO
        if (enemy.isBoss && enemy.zone === 5) { 
            mapLevel++;
            alert(`¡HAS DERROTADO AL DRAGÓN DORADO!\n\nTu poder ha resonado en el mundo. Avanzas al Mapa Nivel ${mapLevel}. Los enemigos y botines serán más poderosos.`);
            
            // Reiniciar estado para el nuevo mapa nivel
            quest = null;
            player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
            player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
            player.hp = getMaxHp();
            player.mp = getMaxMp();
            player.ep = getMaxEp();
            
            endCombat();
            generateWorld();
            saveGame();
            return;
        }
        
        if (enemy.isBoss) {
            playSFX(sfx.boss_die);
            flags['boss' + enemy.zone] = true; 
            logMsg(`¡Has derrotado al Jefe!`);
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
            
            let scaleFactor = getMapScale();
            if(isWeapon) {
                droppedItem.atk = Math.floor(droppedItem.atk * scaleFactor);
                droppedItem.mag = Math.floor(droppedItem.mag * scaleFactor);
            } else {
                droppedItem.def = Math.floor(droppedItem.def * scaleFactor);
                droppedItem.hpBonus = Math.floor(droppedItem.hpBonus * scaleFactor);
                droppedItem.mpBonus = Math.floor(droppedItem.mpBonus * scaleFactor);
            }
            droppedItem.price = Math.floor((droppedItem.price || 15) * scaleFactor);
            droppedItem.name = droppedItem.name + (mapLevel > 1 ? ` +${mapLevel - 1}` : '');

            logMsg(`🎁 ¡Encontraste: ${droppedItem.name}! Se ha guardado en tu Mochila.`);
            playSFX(sfx.quest_complete); 
            if (isWeapon) player.inventory.weapons.push(droppedItem); else player.inventory.armors.push(droppedItem);
        }

        if (quest) {
            if (quest.type === 'kill_enemy' && enemy.name === quest.target && !enemy.isBoss) quest.progress++;
            if (quest.type === 'kill_boss' && enemy.name.replace(` (Lv.${mapLevel})`, '') === quest.target) quest.progress++;
            if (quest.type === 'collect_gold') quest.progress += enemy.gold;
            if (quest.progress >= quest.goal) { 
                playSFX(sfx.quest_complete); logMsg(`¡Misión completada!`); 
                if (quest.rewardType === 'gold') player.gold += quest.rewardAmount; 
                if (quest.rewardType === 'xp') player.xp += quest.rewardAmount; 
                if (quest.rewardType === 'potion') player.potions += quest.rewardAmount; 
                
                if (quest.type === 'kill_boss') {
                    if (!player.hasKey) player.hasKey = {};
                    player.hasKey[quest.zone] = true;
                    logMsg(`🔑 ¡Has obtenido la Llave del Jefe! La puerta se ha abierto.`);
                    spawnFloatingText('+ Llave', '#ffeb3b', 'map');
                } else {
                    logMsg(`Vuelve a buscar un NPC para la siguiente tarea.`);
                }
                
                if (!player.zoneQuestProgress) player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
                player.zoneQuestProgress[quest.zone]++;
                quest = null; 
            }
        }
        checkLevelUp();
        
        currentEnemyTile.enemy = null; 
        endCombat(); saveGame();
        
    } catch (error) { console.error("Falló la victoria.", error); endCombat(); }
}

function doFlee() { playSFX(sfx.ui_click); logMsg("¡Huiste!"); player.x = lastPlayerPos.x; player.y = lastPlayerPos.y; endCombat(); }

function usePotion() { const max = getMaxHp(); if (player.potions > 0 && player.hp < max) { player.hp = Math.min(max, player.hp + 25); player.potions--; playSFX(sfx.use_potion); spawnFloatingText('+25 HP', '#4caf50', inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Vida (+25 HP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
function useManaPotion() { const max = getMaxMp(); if (player.manaPotions > 0 && player.mp < max) { player.mp = Math.min(max, player.mp + 20); player.manaPotions--; playSFX(sfx.use_potion); spawnFloatingText('+20 MP', '#2196f3', inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Maná (+20 MP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
function useEnergyPotion() { const max = getMaxEp(); if (player.energyPotions > 0 && player.ep < max) { player.ep = Math.min(max, player.ep + 30); player.energyPotions--; playSFX(sfx.use_potion); spawnFloatingText('+30 EP', '#9c27b0', inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Energía (+30 EP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }

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
  // Re-calcula tamaño y acomoda todo si se cambia de tamaño
  render();
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

/* =========================================
   SISTEMA DE REGENERACIÓN DE ENERGÍA
   ========================================= */
setInterval(() => {
    if (player.ep < getMaxEp() && !inCombat && !isMenuOpen && document.getElementById('classModal').style.display !== 'flex') {
        player.ep += 1;
        spawnFloatingText('+1 EP', '#9c27b0', 'map'); 
        updateHUD();
    }
}, 1500);