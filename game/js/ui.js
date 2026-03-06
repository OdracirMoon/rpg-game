// =========================================
// INTERFAZ DE USUARIO (HUD, Menús, Tienda, Inventario)
// =========================================
import { gameState } from './state.js';
import { mapData, skillsData } from './data.js';
import { sfx, playSFX } from './audio.js';
import { saveGame } from './main.js';
import { openLevelUpModal } from './combat.js';

export let isMenuOpen = false;
export let pendingQuest = null;

// =========================================
// UTILIDADES Y CÁLCULOS BASE
// =========================================
// Adaptamos los cálculos a tus nuevas estadísticas MOBA. 
// (Por ahora leen el atk, def y mag viejos de los ítems para no romper la tienda de la Fase 1)
export function getMapScale() { return 1 + ((gameState.mapLevel - 1) * 0.5); }
export function getMaxHp() { return gameState.player.baseMaxHp + (gameState.player.armor ? gameState.player.armor.hpBonus : 0); }
export function getMaxMp() { return gameState.player.baseMaxMp + (gameState.player.armor ? gameState.player.armor.mpBonus : 0); }
export function getMaxEp() { return gameState.player.baseMaxEp; }
export function getAtk() { return gameState.player.baseAd + (gameState.player.weapon ? gameState.player.weapon.atk : 0); }
export function getDef() { return gameState.player.baseArmor + (gameState.player.armor ? gameState.player.armor.def : 0); }
export function getMag() { return gameState.player.baseAp + (gameState.player.weapon ? gameState.player.weapon.mag : 0); }
export function getHpColor(percent) { if(percent > 50) return '#4caf50'; if(percent > 20) return '#ffeb3b'; return '#f44336'; }

// =========================================
// MENSAJES Y TEXTOS
// =========================================
export function logMsg(t) { 
    const logs = [document.getElementById('log'), document.getElementById('menuLog')];
    logs.forEach(log => {
        if(log) {
            const d = document.createElement('div'); 
            d.innerHTML = `> ${t}`; 
            log.prepend(d); 
        }
    });
}

export function logCombat(t) {
    const log = document.getElementById('modalLog');
    if(log) {
        const d = document.createElement('div');
        d.innerHTML = t;
        log.prepend(d);
    }
}

export function spawnFloatingText(text, color, target) {
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

// =========================================
// HUD Y PANTALLA PRINCIPAL
// =========================================
export function checkLowHp() {
    const overlay = document.getElementById('damageOverlay');
    if (!overlay) return;
    
    const maxHp = getMaxHp();
    if (gameState.player.hp > 0 && gameState.player.hp < maxHp * 0.2) {
        overlay.classList.add('low-hp-alert');
    } else {
        overlay.classList.remove('low-hp-alert');
    }
}

export function updateHUD() {
    try {
        const tHp = getMaxHp(); const tMp = getMaxMp(); const tEp = getMaxEp();
        const tAd = getAtk(); const tDef = getDef(); const tAp = getMag();
        
        const hpPercent = Math.max(0, (gameState.player.hp / tHp) * 100);
        document.getElementById('playerHpBar').style.width = `${hpPercent}%`;
        document.getElementById('playerHpBar').style.backgroundColor = getHpColor(hpPercent);
        document.getElementById('playerHpText').textContent = `${gameState.player.hp} / ${tHp}`;

        const mpPercent = Math.max(0, (gameState.player.mp / tMp) * 100);
        document.getElementById('playerMpBar').style.width = `${mpPercent}%`;
        document.getElementById('playerMpText').textContent = `${gameState.player.mp} / ${tMp}`;

        const epPercent = Math.max(0, (gameState.player.ep / tEp) * 100);
        document.getElementById('playerEpBar').style.width = `${epPercent}%`;
        document.getElementById('playerEpText').textContent = `${gameState.player.ep} / ${tEp}`;

        // Mostrar nombre del personaje en lugar de la clase genérica
        let pName = gameState.player.characterName || gameState.player.playerClass || "Héroe";
        document.getElementById('playerClassName').textContent = pName;
        document.getElementById('playerLevel').textContent = `(Lv. ${gameState.player.level})`;

        // Resumen de estadísticas en el menú principal
        let statsEl = document.getElementById('menuStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <b>🗡️ AD (Físico):</b> ${tAd} <span class="stat-bonus">${gameState.player.weapon && gameState.player.weapon.atk > 0 ? '(+'+gameState.player.weapon.atk+')' : ''}</span><br>
                <b>🔮 AP (Mágico):</b> ${tAp} <span class="stat-magic">${gameState.player.weapon && gameState.player.weapon.mag > 0 ? '(+'+gameState.player.weapon.mag+')' : ''}</span><br>
                <b>🛡️ Armadura:</b> ${tDef} <span class="stat-bonus">${gameState.player.armor && gameState.player.armor.def > 0 ? '(+'+gameState.player.armor.def+')' : ''}</span><br>
                <b>⭐ XP:</b> ${gameState.player.xp}/${gameState.player.level * 15} | <b>💰 Oro:</b> ${gameState.player.gold}
            `;
            
            if (gameState.player.statPoints > 0) {
                statsEl.innerHTML += `
                    <button class="btn-success" onclick="openLevelUpModal()" style="width: 100%; margin-top: 12px; padding: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 0 10px #ffeb3b;">
                        ⭐ ¡Tienes ${gameState.player.statPoints} Puntos de Atributo! ⭐
                    </button>
                `;
            }
            if (gameState.player.skillPoints > 0) {
                statsEl.innerHTML += `
                    <button onclick="openSkillTree()" style="width: 100%; margin-top: 5px; padding: 10px; font-weight: bold; font-size: 14px; background: #00bcd4; color: white; border: 1px solid #009688; box-shadow: 0 0 10px #00bcd4;">
                        🌳 ¡Tienes ${gameState.player.skillPoints} Puntos de Habilidad!
                    </button>
                `;
            }
        }

        let eqEl = document.getElementById('menuEquipment');
        if (eqEl) {
            eqEl.innerHTML = `
                <img src="img/weapons/${gameState.player.weapon ? gameState.player.weapon.icon : 'iron_dagger.png'}" class="icon"> <b>Arma:</b> <span class="${gameState.player.weapon ? gameState.player.weapon.colorClass : ''}">${gameState.player.weapon ? gameState.player.weapon.name : 'Ninguna'}</span><br>
                <img src="img/weapons/${gameState.player.armor ? gameState.player.armor.icon : 'leather_vest.png'}" class="icon"> <b>Armadura:</b> <span class="${gameState.player.armor ? gameState.player.armor.colorClass : ''}">${gameState.player.armor ? gameState.player.armor.name : 'Ninguna'}</span>
            `;
        }

        let questEl = document.getElementById('quest');
        if (questEl) {
            if (gameState.quest) {
                questEl.innerHTML = `<b>Obj:</b> ${gameState.quest.text}<br><b>Prog:</b> [${gameState.quest.progress}/${gameState.quest.goal}]<br><b>Rec:</b> ${gameState.quest.rewardAmount} ${gameState.quest.rewardType === 'gold' ? 'Oro' : gameState.quest.rewardType === 'xp' ? 'XP' : 'Poción'}`;
            } else {
                questEl.innerHTML = "No tienes tareas activas. Explora el mapa para encontrar NPCs.";
            }
        }
        
        checkLowHp(); 
    } catch (e) {}
}

// =========================================
// SISTEMA DE ESTADÍSTICAS AVANZADAS (NUEVO)
// =========================================
export function openStatsModal() {
    playSFX(sfx.ui_click);
    document.getElementById('mainMenuModal').style.display = 'none';
    
    const p = gameState.player;
    
    // Obtenemos los valores finales sumando equipo
    const finalHp = getMaxHp();
    const finalMp = getMaxMp();
    const finalEp = getMaxEp();
    const finalAd = getAtk();
    const finalAp = getMag();
    const finalArmor = getDef();
    
    let html = `
        <div style="background: #1a0f14; padding: 12px; border-radius: 8px; border: 1px solid #f44336; box-shadow: inset 0 0 10px rgba(244,67,54,0.1);">
            <h3 style="color:#f44336; margin-top:0; font-size: 16px; border-bottom: 1px dashed #f44336; padding-bottom: 5px;">❤️ Supervivencia</h3>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Vida Máxima:</span> <b style="color:#fff;">${finalHp}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. Vida:</span> <b style="color:#4caf50;">+${p.baseHpRegen || 0}/5s</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🛡️ Armadura:</span> <b style="color:#fff;">${finalArmor}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>✨ Resist. Mágica:</span> <b style="color:#fff;">${p.baseMagicResist || 0}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Tenacidad:</span> <b style="color:#fff;">${p.baseTenacity || 0}%</b></p>
        </div>

        <div style="background: #1a180f; padding: 12px; border-radius: 8px; border: 1px solid #ffeb3b; box-shadow: inset 0 0 10px rgba(255,235,59,0.1);">
            <h3 style="color:#ffeb3b; margin-top:0; font-size: 16px; border-bottom: 1px dashed #ffeb3b; padding-bottom: 5px;">⚔️ Daño</h3>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🗡️ Daño Físico (AD):</span> <b style="color:#fff;">${finalAd}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🔮 Poder Mágico (AP):</span> <b style="color:#2196f3;">${finalAp}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>💥 Prob. Crítico:</span> <b style="color:#ff9800;">${Math.floor((p.baseCritChance || 0) * 100)}%</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Daño Crítico:</span> <b style="color:#ff9800;">${Math.floor((p.baseCritDamage || 1.75) * 100)}%</b></p>
        </div>

        <div style="background: #0f1a1a; padding: 12px; border-radius: 8px; border: 1px solid #00bcd4; box-shadow: inset 0 0 10px rgba(0,188,212,0.1);">
            <h3 style="color:#00bcd4; margin-top:0; font-size: 16px; border-bottom: 1px dashed #00bcd4; padding-bottom: 5px;">⚡ Velocidad</h3>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Vel. de Ataque:</span> <b style="color:#fff;">${(p.baseAttackSpeed || 1).toFixed(2)}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Ability Haste:</span> <b style="color:#fff;">${p.baseAbilityHaste || 0}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>👟 Vel. Movimiento:</span> <b style="color:#fff;">${p.baseMoveSpeed || 300}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🎯 Rango:</span> <b style="color:#fff;">${p.baseRange || 1}</b></p>
        </div>

        <div style="background: #0f1a12; padding: 12px; border-radius: 8px; border: 1px solid #4caf50; box-shadow: inset 0 0 10px rgba(76,175,80,0.1);">
            <h3 style="color:#4caf50; margin-top:0; font-size: 16px; border-bottom: 1px dashed #4caf50; padding-bottom: 5px;">🩸 Sustento</h3>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Robo de Vida:</span> <b style="color:#fff;">${Math.floor((p.baseLifeSteal || 0) * 100)}%</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Omnivamp:</span> <b style="color:#fff;">${Math.floor((p.baseOmnivamp || 0) * 100)}%</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>💧 Maná Máx:</span> <b style="color:#2196f3;">${finalMp}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. Maná:</span> <b style="color:#2196f3;">+${p.baseMpRegen || 0}/5s</b></p>
        </div>

        <div style="background: #160f1a; padding: 12px; border-radius: 8px; border: 1px solid #9c27b0; box-shadow: inset 0 0 10px rgba(156,39,176,0.1);">
            <h3 style="color:#9c27b0; margin-top:0; font-size: 16px; border-bottom: 1px dashed #9c27b0; padding-bottom: 5px;">🧨 Penetración</h3>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Letalidad:</span> <b style="color:#fff;">${p.baseLethality || 0}</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Pen. Armadura:</span> <b style="color:#fff;">${Math.floor((p.baseArmorPen || 0) * 100)}%</b></p>
            <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Pen. Mágica:</span> <b style="color:#fff;">${p.baseMagicPen || 0}</b></p>
        </div>
    `;

    document.getElementById('fullStatsContainer').innerHTML = html;
    document.getElementById('statsModal').style.display = 'flex';
}

export function closeStatsModal() {
    playSFX(sfx.ui_click);
    document.getElementById('statsModal').style.display = 'none';
    document.getElementById('mainMenuModal').style.display = 'flex';
}
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;

// =========================================
// PANELES Y VENTANAS
// =========================================
export function toggleMainMenu() {
    if (gameState.inCombat || document.getElementById('roleModal').style.display === 'flex' || document.getElementById('characterModal').style.display === 'flex') return;
    
    isMenuOpen = !isMenuOpen;
    playSFX(sfx.ui_click);
    
    // Cierra todo lo demás
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'none';
    document.getElementById('npcModal').style.display = 'none';
    document.getElementById('statsModal').style.display = 'none';
    
    const grimoire = document.getElementById('grimoireModal');
    if(grimoire) grimoire.style.display = 'none';
    const tree = document.getElementById('skillTreeModal');
    if(tree) tree.style.display = 'none';

    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
}
window.toggleMainMenu = toggleMainMenu;
window.openLevelUpModal = openLevelUpModal;

// Atajo de teclado 'E' para abrir estadísticas directamente
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') {
        if (gameState.inCombat || document.getElementById('roleModal').style.display === 'flex' || document.getElementById('characterModal').style.display === 'flex') return;
        
        if (document.getElementById('statsModal').style.display === 'flex') {
            closeStatsModal();
            toggleMainMenu(); // Lo cerramos por completo
        } else {
            // Lo abrimos
            isMenuOpen = true;
            document.getElementById('mainMenuModal').style.display = 'none';
            openStatsModal();
        }
    }
});


// =========================================
// SISTEMA DE NPCs
// =========================================
export function openSpecificNPCModal(npcData) {
    if (gameState.quest) {
        playSFX(sfx.error); logMsg(`${npcData.name} te dice: '¡Termina la misión que tienes primero!'`); return;
    }
    
    playSFX(sfx.ui_click);
    
    if (!gameState.player.zoneQuestProgress) gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
    if (!gameState.player.hasKey) gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };

    let step = gameState.player.zoneQuestProgress[gameState.currentZoneIndex];
    
    if (step >= 3) {
        playSFX(sfx.error); logMsg(`${npcData.name} te dice: 'Ya has completado todas mis tareas en esta zona. ¡Cruza la puerta y avanza!'`); return;
    }

    const cd = mapData[gameState.currentZoneIndex]; 
    let qScale = getMapScale(); 
    
    if (step === 0) {
        const rEnemy = cd.newEnemies[0];
        pendingQuest = { type: 'kill_enemy', target: rEnemy.name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: Math.floor(20 * (gameState.currentZoneIndex + 1) * qScale), text: `Derrota 3 ${rEnemy.name}s`, zone: gameState.currentZoneIndex };
    } else if (step === 1) {
        const gTarget = Math.floor(30 * (gameState.currentZoneIndex + 1) * qScale);
        pendingQuest = { type: 'collect_gold', goal: gTarget, progress: 0, rewardType: 'xp', rewardAmount: Math.floor(15 * (gameState.currentZoneIndex + 1) * qScale), text: `Consigue ${gTarget} de oro`, zone: gameState.currentZoneIndex };
    } else if (step === 2) {
        pendingQuest = { type: 'kill_boss', target: cd.boss.name, goal: 1, progress: 0, rewardType: 'potion', rewardAmount: 1, text: `Derrota al Jefe: ${cd.boss.name}`, zone: gameState.currentZoneIndex };
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

export function closeNPCModal() { playSFX(sfx.ui_click); pendingQuest = null; document.getElementById('npcModal').style.display = 'none'; }
export function acceptNPCQuest() { gameState.quest = pendingQuest; pendingQuest = null; playSFX(sfx.quest_accept); logMsg("¡Misión aceptada!"); updateHUD(); saveGame(); document.getElementById('npcModal').style.display = 'none'; }

window.closeNPCModal = closeNPCModal;
window.acceptNPCQuest = acceptNPCQuest;

// =========================================
// INVENTARIO Y EQUIPAMIENTO
// =========================================
export function openInventory() {
    playSFX(sfx.ui_click);
    
    let htmlEq = '';
    if (gameState.player.weapon) {
        let statText = gameState.player.weapon.atk > 0 ? `AD +${gameState.player.weapon.atk}` : `AP +${gameState.player.weapon.mag}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.weapon.icon}" class="icon"> <span class="${gameState.player.weapon.colorClass}">${gameState.player.weapon.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('weapon')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Arma: Nada equipado</p>`;
 
