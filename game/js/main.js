// =========================================
// ARCHIVO PRINCIPAL (Inicialización y Eventos)
// =========================================
import { gameState } from './state.js';
import { SAVE_KEY, GAME_VERSION, activeSlot } from './data.js';
import { sfx, playSFX, playBGM, toggleAudio } from './audio.js';
import { logMsg, updateHUD, spawnFloatingText, isMenuOpen, toggleMainMenu } from './ui.js';
import { generateWorld, updateFOV, render, move } from './map.js';

// =========================================
// SISTEMA DE MIGRACIÓN DE VERSIONES
// =========================================
function migrateSaveData(saveData) {
    let currentSaveVersion = saveData.version || "0.9.0"; // Si no tiene versión, asumimos que es vieja

    // Si la versión del archivo es igual a la del juego, no hacemos nada
    if (currentSaveVersion === GAME_VERSION) {
        return saveData;
    }

    console.log(`Migrando partida de v${currentSaveVersion} a v${GAME_VERSION}...`);

    // 🔄 MIGRACIÓN PREVIA a 1.0.0 (Parches de seguridad base)
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

    // 🔄 AQUÍ PONDRÁS LA MIGRACIÓN 1.1.0 EN EL FUTURO
    // if (currentSaveVersion === "1.0.0" && GAME_VERSION === "1.1.0") {
    //     // agregar nuevas variables aquí...
    //     currentSaveVersion = "1.1.0";
    // }

    saveData.version = GAME_VERSION; 
    return saveData;
}

// =========================================
// SISTEMA DE GUARDADO Y CARGA
// =========================================
export function saveGame() {
    try {
        const saveData = { 
            version: GAME_VERSION, 
            playerData: gameState.player, 
            flagsData: gameState.flags, 
            questData: gameState.quest, 
            mapDataState: gameState.worldMap, 
            mapLevelData: gameState.mapLevel,
            checkpointsData: gameState.checkpoints
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
            
            // 1. PASAMOS LOS DATOS POR EL TÚNEL DE MIGRACIÓN
            saveData = migrateSaveData(saveData);

            // 2. ASIGNAMOS LOS DATOS ACTUALIZADOS AL JUEGO
            gameState.player = saveData.playerData; 
            gameState.flags = saveData.flagsData; 
            gameState.quest = saveData.questData; 
            gameState.worldMap = saveData.mapDataState;
            gameState.mapLevel = saveData.mapLevelData || 1;
            gameState.checkpoints = saveData.checkpointsData || { lastLevelUp: null, lastBoss: null };
            
            // 3. GUARDAMOS AUTOMÁTICAMENTE EL ARCHIVO YA MIGRADO PARA LA PRÓXIMA VEZ
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

            document.getElementById('classModal').style.display = 'none';
            
            updateFOV(); render(); logMsg(`📂 Partida cargada desde la Ranura ${activeSlot}. (v${GAME_VERSION})`); return true;
        } 
    } catch (e) { logMsg("⚠️ Error al cargar."); console.error(e); }
    return false;
}

export function resetGame() {
    playSFX(sfx.ui_click);
    if (confirm(`¿Estás seguro de borrar tu partida de la Ranura ${activeSlot}?`)) {
        try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
        location.reload(); 
    }
}

export function returnToMainMenu() {
    playSFX(sfx.ui_click);
    saveGame(); 
    window.location.href = '../index.html'; 
}

export function exportGame() {
    playSFX(sfx.ui_click);
    try {
        const saveData = { 
            version: GAME_VERSION,
            playerData: gameState.player, 
            flagsData: gameState.flags, 
            questData: gameState.quest, 
            mapDataState: gameState.worldMap, 
            mapLevelData: gameState.mapLevel,
            checkpointsData: gameState.checkpoints
        };
        
        const jsonString = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const enlaceDescarga = document.createElement('a');
        enlaceDescarga.href = url;
        enlaceDescarga.download = `savegame_ranura${activeSlot}.json`;
        
        document.body.appendChild(enlaceDescarga);
        enlaceDescarga.click();
        
        document.body.removeChild(enlaceDescarga);
        URL.revokeObjectURL(url);
        logMsg("⬇️ Partida exportada exitosamente.");
    } catch (error) {
        console.error("Error al exportar:", error);
        alert("Hubo un error al exportar la partida.");
    }
}

export function importGame(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            let datos = JSON.parse(e.target.result);
            if (datos.playerData && datos.mapDataState) {
                // Pasamos la partida importada por el túnel de migración
                datos = migrateSaveData(datos);
                
                localStorage.setItem(SAVE_KEY, JSON.stringify(datos));
                alert(`✅ Partida importada y actualizada con éxito a la Ranura ${activeSlot}. El juego se recargará para aplicar los cambios.`);
                window.location.reload(); 
            } else {
                alert("❌ El archivo no parece ser un guardado válido de este juego.");
            }
        } catch (error) {
            alert("❌ Error al leer el archivo JSON. Puede estar corrupto o tener un formato incorrecto.");
        }
    };
    lector.readAsText(archivo);
    evento.target.value = '';
}

window.saveGame = saveGame;
window.loadGameBtn = loadGameBtn;
window.resetGame = resetGame;
window.returnToMainMenu = returnToMainMenu;
window.exportGame = exportGame;
window.importGame = importGame;
window.toggleAudio = toggleAudio;

export function toggleFullscreen() {
    playSFX(sfx.ui_click);
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else { document.exitFullscreen(); }
}
window.toggleFullscreen = toggleFullscreen;

// =========================================
// INICIALIZACIÓN Y CLASES
// =========================================
export function initGame() {
    let hasLoaded = false;
    try { 
        if (localStorage.getItem(SAVE_KEY)) { 
            hasLoaded = loadGameBtn(); 
            if(hasLoaded) logMsg(`Bienvenido de nuevo, ${gameState.player.playerClass}. Jugando en Ranura ${activeSlot}.`); 
        } 
    } catch(e) {}
    
    if (!hasLoaded) { 
        document.getElementById('classModal').style.display = 'flex'; 
    }
}

export function selectClass(className) {
    playSFX(sfx.ui_click);
    gameState.player.playerClass = className;
    gameState.player.potions = 3; gameState.player.manaPotions = 1; gameState.player.energyPotions = 1; 
    gameState.player.gold = 0; 
    gameState.player.weapon = null; 
    gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
    gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
    gameState.mapLevel = 1; 
    
    gameState.player.knownSkills = [];
    gameState.player.equippedSkills = { special: null, defensive: null };
    gameState.player.statPoints = 0;
    gameState.player.skillPoints = 0;
    
    let classNameLower = className.toLowerCase();
    gameState.player.mapImg = `img/player/${classNameLower}_mapa.png`;
    gameState.player.combatImg = `img/player/${classNameLower}_combate.png`;

    if (className === 'Guerrero') {
        gameState.player.baseMaxHp = 60; gameState.player.hp = 60;
        gameState.player.baseMaxMp = 10; gameState.player.mp = 10;
        gameState.player.baseMaxEp = 50; gameState.player.ep = 50;
        gameState.player.baseAtk = 5; gameState.player.baseDef = 4; gameState.player.baseMag = 1;
        gameState.player.weapon = { name: 'Espada Rota', atk: 2, mag: 0, price: 10, colorClass: 'color-comun', icon: 'iron_dagger.png' };
        
        gameState.player.knownSkills = ['golpe_brutal', 'grito_guerra'];
        gameState.player.equippedSkills = { special: 'golpe_brutal', defensive: 'grito_guerra' };
        
    } else if (className === 'Mago') {
        gameState.player.baseMaxHp = 30; gameState.player.hp = 30;
        gameState.player.baseMaxMp = 60; gameState.player.mp = 60;
        gameState.player.baseMaxEp = 40; gameState.player.ep = 40;
        gameState.player.baseAtk = 2; gameState.player.baseDef = 1; gameState.player.baseMag = 5;
        gameState.player.manaPotions = 3; 
        gameState.player.weapon = { name: 'Varita Astillada', atk: 0, mag: 3, price: 10, colorClass: 'color-comun', icon: 'wood_staff.png' };
        
        gameState.player.knownSkills = ['fuego', 'curar'];
        gameState.player.equippedSkills = { special: 'fuego', defensive: 'curar' };
        
    } else if (className === 'Arquero') {
        gameState.player.baseMaxHp = 45; gameState.player.hp = 45;
        gameState.player.baseMaxMp = 20; gameState.player.mp = 20;
        gameState.player.baseMaxEp = 80; gameState.player.ep = 80;
        gameState.player.baseAtk = 4; gameState.player.baseDef = 2; gameState.player.baseMag = 2;
        gameState.player.weapon = { name: 'Arco Corto', atk: 3, mag: 1, price: 10, colorClass: 'color-comun', icon: 'wood_bow.png' }; 
        
        gameState.player.knownSkills = ['tiro_doble', 'flecha_venenosa'];
        gameState.player.equippedSkills = { special: 'tiro_doble', defensive: 'flecha_venenosa' };
        
    } else if (className === 'Simple') {
        gameState.player.baseMaxHp = 40; gameState.player.hp = 40;
        gameState.player.baseMaxMp = 10; gameState.player.mp = 10;
        gameState.player.baseMaxEp = 40; gameState.player.ep = 40;
        gameState.player.baseAtk = 2; gameState.player.baseDef = 1; gameState.player.baseMag = 1;
        gameState.player.gold = 100; 
    }
    
    document.getElementById('classModal').style.display = 'none';
    logMsg(`¡Has elegido el camino de la clase ${className}! Buena suerte.`);
    playBGM('field');
    generateWorld(); 
}
window.selectClass = selectClass;

// =========================================
// EVENTOS DE TECLADO Y PANTALLA
// =========================================
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
  if(gameState.worldMap && gameState.worldMap.length > 0) render();
});

// =========================================
// CONTROLES TÁCTILES (MÓVIL)
// =========================================
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

// =========================================
// BUCLE DE REGENERACIÓN
// =========================================
setInterval(() => {
    let maxEp = gameState.player.baseMaxEp || 0;
    if (gameState.player.ep < maxEp && !gameState.inCombat && !isMenuOpen && document.getElementById('classModal').style.display !== 'flex') {
        gameState.player.ep += 1;
        spawnFloatingText('+1 EP', '#9c27b0', 'map'); 
        updateHUD();
    }
}, 1500);

setupTouchControls();
initGame();