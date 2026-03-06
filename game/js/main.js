// =========================================
// ARCHIVO PRINCIPAL (Inicialización y Eventos)
// =========================================
import { gameState } from './state.js';
import { SAVE_KEY, GAME_VERSION, activeSlot, charactersData } from './data.js';
import { sfx, playSFX, playBGM, toggleAudio } from './audio.js';
import { logMsg, updateHUD, spawnFloatingText, isMenuOpen, toggleMainMenu } from './ui.js';
import { generateWorld, updateFOV, render, move } from './map.js';

// =========================================
// SISTEMA DE MIGRACIÓN DE VERSIONES
// =========================================
function migrateSaveData(saveData) {
    let currentSaveVersion = saveData.version || "0.9.0"; 
    if (currentSaveVersion === GAME_VERSION) return saveData;
    
    console.log(`Migrando partida de v${currentSaveVersion} a v${GAME_VERSION}...`);
    if (currentSaveVersion < "1.0.0") {
        if(!saveData.playerData.inventory) saveData.playerData.inventory = { weapons: [], armors: [] };
        if(!saveData.playerData.playerClass) saveData.playerData.playerClass = "Guerrero";
        if(saveData.playerData.ep === undefined) saveData.playerData.ep = saveData.playerData.baseMaxEp || 50;
        if(saveData.playerData.energyPotions === undefined) saveData.playerData.energyPotions = 0;
        if(!saveData.playerData.mapImg) saveData.playerData.mapImg = `img/player/${saveData.playerData.playerClass.toLowerCase()}_mapa.png`;
        if(!saveData.playerData.combatImg) saveData.playerData.combatImg = `img/player/${saveData.playerData.playerClass.toLowerCase()}_combate.png`;
        if(!saveData.playerData.zoneQuestProgress) saveData.playerData.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
        if(!saveData.playerData.hasKey) saveData.playerData.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
        if(!saveData.playerData.knownSkills) saveData.playerData.knownSkills = [];
        if(!saveData.playerData.equippedSkills) saveData.playerData.equippedSkills = { special: null, defensive: null };
        if(saveData.playerData.statPoints === undefined) saveData.playerData.statPoints = 0;
        if(saveData.playerData.skillPoints === undefined) saveData.playerData.skillPoints = 0;
        if(!saveData.checkpoints) saveData.checkpoints = { lastLevelUp: null, lastBoss: null };
        currentSaveVersion = "1.0.0";
    }
    saveData.version = GAME_VERSION; 
    return saveData;
}

// =========================================
// SISTEMA DE GUARDADO Y CARGA
// =========================================
export function saveGame() {
    try {
        const saveData = { 
            version: GAME_VERSION, playerData: gameState.player, flagsData: gameState.flags, 
            questData: gameState.quest, mapDataState: gameState.worldMap, 
            mapLevelData: gameState.mapLevel, checkpointsData: gameState.checkpoints
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        logMsg(`💾 Partida guardada con éxito (Ranura ${activeSlot}).`);
    } catch (e) { console.warn("No se pudo guardar."); }
}

export function loadGameBtn() {
    playSFX(sfx.ui_click);
    try {
        const savedString = localStorage.getItem(SAVE_KEY);
        if (savedString) {
            let saveData = JSON.parse(savedString);
            saveData = migrateSaveData(saveData);

            gameState.player = saveData.playerData; gameState.flags = saveData.flagsData; 
            gameState.quest = saveData.questData; gameState.worldMap = saveData.mapDataState;
            gameState.mapLevel = saveData.mapLevelData || 1;
            gameState.checkpoints = saveData.checkpointsData || { lastLevelUp: null, lastBoss: null };
            
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

            const roleMod = document.getElementById('roleModal'); if(roleMod) roleMod.style.display = 'none';
            const charMod = document.getElementById('characterModal'); if(charMod) charMod.style.display = 'none';
            
            updateFOV(); render(); 
            return true;
        } 
    } catch (e) { console.error(e); }
    return false;
}

export function resetGame() {
    playSFX(sfx.ui_click);
    if (confirm(`¿Estás seguro de borrar tu partida de la Ranura ${activeSlot}?`)) {
        try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
        window.location.href = '../index.html'; 
    }
}

export function returnToMainMenu() { playSFX(sfx.ui_click); saveGame(); window.location.href = '../index.html'; }

export function exportGame() {
    playSFX(sfx.ui_click);
    try {
        const saveData = { version: GAME_VERSION, playerData: gameState.player, flagsData: gameState.flags, questData: gameState.quest, mapDataState: gameState.worldMap, mapLevelData: gameState.mapLevel, checkpointsData: gameState.checkpoints };
        const jsonString = JSON.stringify(saveData, null, 2); const blob = new Blob([jsonString], { type: "application/json" }); const url = URL.createObjectURL(blob);
        const enlaceDescarga = document.createElement('a'); enlaceDescarga.href = url; enlaceDescarga.download = `savegame_ranura${activeSlot}.json`;
        document.body.appendChild(enlaceDescarga); enlaceDescarga.click(); document.body.removeChild(enlaceDescarga); URL.revokeObjectURL(url);
        logMsg("⬇️ Partida exportada exitosamente.");
    } catch (error) { alert("Hubo un error al exportar la partida."); }
}

export function importGame(evento) {
    const archivo = evento.target.files[0]; if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            let datos = JSON.parse(e.target.result);
            if (datos.playerData && datos.mapDataState) {
                datos = migrateSaveData(datos); localStorage.setItem(SAVE_KEY, JSON.stringify(datos));
                alert(`✅ Partida importada y actualizada con éxito a la Ranura ${activeSlot}.`); window.location.reload(); 
            } else { alert("❌ El archivo no parece ser un guardado válido."); }
        } catch (error) { alert("❌ Error al leer el archivo JSON."); }
    };
    lector.readAsText(archivo); evento.target.value = '';
}
window.saveGame = saveGame; window.loadGameBtn = loadGameBtn; window.resetGame = resetGame;
window.returnToMainMenu = returnToMainMenu; window.exportGame = exportGame; window.importGame = importGame; window.toggleAudio = toggleAudio;

export function toggleFullscreen() { playSFX(sfx.ui_click); if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => {}); } else { document.exitFullscreen(); } }
window.toggleFullscreen = toggleFullscreen;

// =========================================
// INICIALIZACIÓN, ROLES Y PERSONAJES
// =========================================
export function initGame() {
    // Leemos si el menú principal ordenó "new" o "load"
    const action = sessionStorage.getItem('gameAction');
    
    if (action === 'load') {
        let hasLoaded = false;
        try { 
            hasLoaded = loadGameBtn(); 
            if(hasLoaded) {
                let pName = gameState.player.characterName || gameState.player.playerClass || "Héroe";
                logMsg(`Bienvenido de nuevo, ${pName}. Jugando en Ranura ${activeSlot}.`); 
            }
        } catch(e) {
            alert("Error al cargar. Archivo corrupto."); window.location.href = '../index.html'; return;
        }
        
        if (!hasLoaded) { 
            alert("No se encontró partida en esta ranura."); window.location.href = '../index.html'; 
        }
    } else {
        // MODO NUEVA PARTIDA
        const rModal = document.getElementById('roleModal');
        if (rModal) {
            rModal.style.display = 'flex'; 
        } else {
            alert("⚠️ Error: No se detectó la interfaz de Roles. Por favor borra el caché de tu navegador y recarga.");
        }
    }
}

export function selectRole(roleName) {
    playSFX(sfx.ui_click); document.getElementById('roleModal').style.display = 'none'; document.getElementById('charModalTitle').textContent = `Selecciona tu Personaje: ${roleName}`;
    const container = document.getElementById('characterContainer'); container.innerHTML = '';

    Object.values(charactersData).forEach(char => {
        if (char.role === roleName) {
            let html = `
                <div class="shop-item" style="flex: 1; min-width: 250px; flex-direction: column; align-items: center; border-color: var(--accent);">
                    <h3 style="margin-top:0; color:#fff;">${char.name}</h3>
                    <p style="font-size:12px; color:#aaa; text-align:center; margin-bottom:10px;">${char.desc}</p>
                    <div style="font-size:12px; color:#ffeb3b; text-align:left; width: 100%; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px; margin-bottom:10px;">
                        ❤️ HP: ${char.stats.hp} | 💧 MP: ${char.stats.mp} | ⚡ EP: ${char.stats.ep}<br>
                        🗡️ AD: ${char.stats.ad} | 🔮 AP: ${char.stats.ap} | 🛡️ Armor: ${char.stats.armor}
                    </div>
                    <button onclick="selectCharacter('${char.id}')" style="background:var(--accent); color:#000; width:100%;">Elegir a ${char.name}</button>
                </div>
            `;
            container.innerHTML += html;
        }
    });
    document.getElementById('characterModal').style.display = 'flex';
}

export function backToRoles() { playSFX(sfx.ui_click); document.getElementById('characterModal').style.display = 'none'; document.getElementById('roleModal').style.display = 'flex'; }

export function selectCharacter(charId) {
    playSFX(sfx.ui_click); const char = charactersData[charId];
    
    // Limpieza inicial
    gameState.player.potions = 3; gameState.player.manaPotions = 1; gameState.player.energyPotions = 1; 
    gameState.player.gold = 0; gameState.player.weapon = null; gameState.player.armor = null;
    gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0]; gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
    gameState.mapLevel = 1; gameState.player.knownSkills = []; gameState.player.equippedSkills = { special: null, defensive: null };
    gameState.player.statPoints = 0; gameState.player.skillPoints = 0;

    // Asignar Identidad y Stats MOBA
    gameState.player.role = char.role; gameState.player.characterId = char.id; gameState.player.characterName = char.name;
    gameState.player.mapImg = char.imgs.map; gameState.player.combatImg = char.imgs.combat;

    gameState.player.baseMaxHp = char.stats.hp; gameState.player.hp = char.stats.hp; gameState.player.baseHpRegen = char.stats.hpReg;
    gameState.player.baseMaxMp = char.stats.mp; gameState.player.mp = char.stats.mp; gameState.player.baseMpRegen = 1; 
    gameState.player.baseMaxEp = char.stats.ep; gameState.player.ep = char.stats.ep; gameState.player.baseEpRegen = 1;
    gameState.player.baseAd = char.stats.ad; gameState.player.baseAp = char.stats.ap;
    gameState.player.baseArmor = char.stats.armor; gameState.player.baseMagicResist = char.stats.mr;
    gameState.player.baseCritChance = char.stats.crit || 0; gameState.player.baseCritDamage = 1.75;
    gameState.player.baseAttackSpeed = 1.0; gameState.player.baseAbilityHaste = 0; gameState.player.baseMoveSpeed = char.stats.ms;
    gameState.player.baseLifeSteal = char.stats.lifesteal || 0; gameState.player.baseOmnivamp = 0;
    gameState.player.baseArmorPen = 0; gameState.player.baseLethality = 0; gameState.player.baseMagicPen = 0;
    gameState.player.baseTenacity = 0; gameState.player.baseRange = 1;

    if (char.role === 'Guerrero') {
        gameState.player.weapon = { name: 'Espada de Hierro', ad: 5, ap: 0, price: 10, colorClass: 'color-comun', icon: 'iron_dagger.png' };
        gameState.player.knownSkills = ['golpe_brutal', 'grito_guerra']; gameState.player.equippedSkills = { special: 'golpe_brutal', defensive: 'grito_guerra' };
    } else if (char.role === 'Mago') {
        gameState.player.manaPotions = 3; gameState.player.weapon = { name: 'Libro de Aprendiz', ad: 0, ap: 10, price: 10, colorClass: 'color-comun', icon: 'wood_staff.png' };
        gameState.player.knownSkills = ['fuego', 'curar']; gameState.player.equippedSkills = { special: 'fuego', defensive: 'curar' };
    } else if (char.role === 'Arquero') {
        gameState.player.weapon = { name: 'Arco de Caza', ad: 8, ap: 0, price: 10, colorClass: 'color-comun', icon: 'wood_bow.png' }; 
        gameState.player.knownSkills = ['tiro_doble', 'flecha_venenosa']; gameState.player.equippedSkills = { special: 'tiro_doble', defensive: 'flecha_venenosa' };
        gameState.player.baseRange = 3;
    } else if (char.role === 'Simple') { gameState.player.gold = 200; }

    document.getElementById('characterModal').style.display = 'none'; logMsg(`¡Has iniciado aventura como ${char.name}!`);
    playBGM('field'); generateWorld(); 
}

window.selectRole = selectRole; window.backToRoles = backToRoles; window.selectCharacter = selectCharacter;

// =========================================
// CONTROLES Y BUCLE
// =========================================
window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') { toggleMainMenu(); return; }
    if (k === 'w' || k === 'arrowup') move(0, -1);
    if (k === 's' || k === 'arrowdown') move(0, 1);
    if (k === 'a' || k === 'arrowleft') move(-1, 0);
    if (k === 'd' || k === 'arrowright') move(1, 0);
});

let vh = window.innerHeight * 0.01; document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => { let vh = window.innerHeight * 0.01; document.documentElement.style.setProperty('--vh', `${vh}px`); if(gameState.worldMap && gameState.worldMap.length > 0) render(); });

function setupTouchControls() {
    const bindTouch = (id, dx, dy) => {
        const btn = document.getElementById(id); 
        if(!btn) return;
        
        // El evento táctil más moderno y confiable para móviles
        btn.onpointerdown = (e) => { 
            e.preventDefault(); // Evita que la pantalla haga zoom o scroll
            move(dx, dy); 
        };
        
        // Respaldo de seguridad por si falla el toque
        btn.onclick = (e) => { 
            e.preventDefault();
            move(dx, dy); 
        };
    };
    
    bindTouch('btnUp', 0, -1); 
    bindTouch('btnDown', 0, 1); 
    bindTouch('btnLeft', -1, 0); 
    bindTouch('btnRight', 1, 0);
}


setInterval(() => {
    let maxEp = gameState.player.baseMaxEp || 0;
    let isRoleModalOpen = document.getElementById('roleModal') && document.getElementById('roleModal').style.display === 'flex';
    let isCharModalOpen = document.getElementById('characterModal') && document.getElementById('characterModal').style.display === 'flex';

    if (gameState.player.ep < maxEp && !gameState.inCombat && !isMenuOpen && !isRoleModalOpen && !isCharModalOpen) {
        gameState.player.ep += 1; spawnFloatingText('+1 EP', '#9c27b0', 'map'); updateHUD();
    }
}, 1500);

setupTouchControls();
initGame();
