// =========================================
// SISTEMA DE AUDIO INTEGRAL
// =========================================
import { gameState } from './state.js';

export let soundEnabled = true;
export let currentBGM = null;

export const sfx = {
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

export const bgm = {
    city: new Audio('sounds/ambient/amb_city.mp3'),
    field: new Audio('sounds/ambient/amb_field.mp3'),
    boss: new Audio('sounds/ambient/amb_boss.mp3')
};

// Configuramos volúmenes y repeticiones iniciales
Object.values(bgm).forEach(track => { track.loop = true; track.volume = 0.3; });
Object.values(sfx).forEach(track => { track.volume = 0.7; });

export function playSFX(audioObj) {
    if (!soundEnabled || !audioObj) return;
    try { 
        audioObj.currentTime = 0; 
        let p = audioObj.play(); 
        if (p !== undefined) p.catch(e => {}); 
    } catch(e) {}
}

export function playBGM(type) {
    if (!soundEnabled) { 
        Object.values(bgm).forEach(t => t.pause()); 
        return; 
    }
    let target = bgm[type];
    if (currentBGM === target && !target.paused) return; 
    Object.values(bgm).forEach(t => t.pause()); 
    if (target) { 
        let p = target.play(); 
        if (p !== undefined) p.catch(e => {}); 
        currentBGM = target; 
    }
}

export function toggleAudio() {
    soundEnabled = !soundEnabled;
    const btnAudio = document.getElementById('btnAudio');
    if (btnAudio) {
        btnAudio.textContent = soundEnabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
    }
    
    if (soundEnabled) {
        playSFX(sfx.ui_click);
        // Usamos gameState para saber qué música poner al reactivar el sonido
        if (gameState.inCombat && gameState.currentEnemyTile && gameState.currentEnemyTile.enemy.isBoss) {
            playBGM('boss');
        } else { 
            playBGM('field');
        }
    } else { 
        Object.values(bgm).forEach(t => t.pause()); 
    }
}