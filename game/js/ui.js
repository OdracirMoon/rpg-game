// =========================================
// INTERFAZ DE USUARIO Y TIENDA MOBA
// =========================================
import { gameState } from './state.js';
import { mapData, skillsData } from './data.js';
import { sfx, playSFX } from './audio.js';
import { saveGame } from './main.js';
import { openLevelUpModal } from './combat.js';

export let isMenuOpen = false;
export let pendingQuest = null;

// =========================================
// UTILIDADES Y CÁLCULOS BASE (Protegidos)
// =========================================
export function getMapScale() { return 1 + (((gameState.mapLevel || 1) - 1) * 0.5); }
export function getMaxHp() { return (gameState.player.baseMaxHp || 0) + (gameState.player.armor && gameState.player.armor.hpBonus ? gameState.player.armor.hpBonus : 0); }
export function getMaxMp() { return (gameState.player.baseMaxMp || 0) + (gameState.player.armor && gameState.player.armor.mpBonus ? gameState.player.armor.mpBonus : 0); }
export function getMaxEp() { return (gameState.player.baseMaxEp || 0); }

// Mapeos de retrocompatibilidad para el combate viejo
export function getAtk() { return (gameState.player.baseAd || 0) + (gameState.player.weapon && gameState.player.weapon.ad ? gameState.player.weapon.ad : 0); }
export function getDef() { return (gameState.player.baseArmor || 0) + (gameState.player.armor && gameState.player.armor.armor ? gameState.player.armor.armor : 0); }
export function getMag() { return (gameState.player.baseAp || 0) + (gameState.player.weapon && gameState.player.weapon.ap ? gameState.player.weapon.ap : 0); }
export function getHpColor(percent) { if(percent > 50) return '#4caf50'; if(percent > 20) return '#ffeb3b'; return '#f44336'; }

// Nuevos cálculos MOBA
export function getCrit() { return (gameState.player.baseCritChance || 0) + (gameState.player.weapon && gameState.player.weapon.crit ? gameState.player.weapon.crit : 0); }
export function getLifesteal() { return (gameState.player.baseLifeSteal || 0) + (gameState.player.weapon && gameState.player.weapon.lifesteal ? gameState.player.weapon.lifesteal : 0); }
export function getLethality() { return (gameState.player.baseLethality || 0) + (gameState.player.weapon && gameState.player.weapon.lethality ? gameState.player.weapon.lethality : 0); }
export function getMagicPen() { return (gameState.player.baseMagicPen || 0) + (gameState.player.weapon && gameState.player.weapon.magicPen ? gameState.player.weapon.magicPen : 0); }
export function getMr() { return (gameState.player.baseMagicResist || 0) + (gameState.player.armor && gameState.player.armor.mr ? gameState.player.armor.mr : 0); }


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
        el.style.left = '50%'; el.style.top = '40%'; el.style.transform = 'translate(-50%, -50%)';
    } else if (target === 'combat-player') {
        el.style.left = '25%'; el.style.top = '35%';
    } else if (target === 'combat-enemy') {
        el.style.left = '75%'; el.style.top = '35%';
    } else {
        el.style.left = '50%'; el.style.top = '50%';
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
        const tHp = getMaxHp() || 1; 
        const tMp = getMaxMp() || 1; 
        const tEp = getMaxEp() || 1;
        
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

        let pName = gameState.player.characterName || gameState.player.playerClass || "Héroe";
        document.getElementById('playerClassName').textContent = pName;
        document.getElementById('playerLevel').textContent = `(Lv. ${gameState.player.level || 1})`;

        let statsEl = document.getElementById('menuStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <b>🗡️ AD:</b> ${getAtk()} <span class="stat-bonus">${gameState.player.weapon && gameState.player.weapon.ad ? '(+'+gameState.player.weapon.ad+')' : ''}</span> |
                <b>🔮 AP:</b> ${getMag()} <span class="stat-magic">${gameState.player.weapon && gameState.player.weapon.ap ? '(+'+gameState.player.weapon.ap+')' : ''}</span><br>
                <b>🛡️ Armor:</b> ${getDef()} <span class="stat-bonus">${gameState.player.armor && gameState.player.armor.armor ? '(+'+gameState.player.armor.armor+')' : ''}</span> |
                <b>✨ MR:</b> ${getMr()} <span class="stat-magic">${gameState.player.armor && gameState.player.armor.mr ? '(+'+gameState.player.armor.mr+')' : ''}</span><br>
                <b>⭐ XP:</b> ${gameState.player.xp || 0}/${(gameState.player.level || 1) * 15} | <b>💰 Oro:</b> ${gameState.player.gold || 0}
            `;
            if (gameState.player.statPoints > 0) {
                statsEl.innerHTML += `<button class="btn-success" onclick="openLevelUpModal()" style="width: 100%; margin-top: 10px; padding: 10px;">⭐ ¡${gameState.player.statPoints} Puntos de Atributo! ⭐</button>`;
            }
            if (gameState.player.skillPoints > 0) {
                statsEl.innerHTML += `<button onclick="openSkillTree()" style="width: 100%; margin-top: 5px; padding: 10px; background: #00bcd4; color: white; border: 1px solid #009688;">🌳 ¡${gameState.player.skillPoints} Puntos de Habilidad!</button>`;
            }
        }

        let eqEl = document.getElementById('menuEquipment');
        if (eqEl) {
            eqEl.innerHTML = `
                <img src="img/weapons/${gameState.player.weapon ? gameState.player.weapon.icon : 'iron_dagger.png'}" class="icon"> <b>Arma:</b> <span class="${gameState.player.weapon ? gameState.player.weapon.colorClass : ''}">${gameState.player.weapon ? gameState.player.weapon.name : 'Ninguna'}</span><br>
                <img src="img/weapons/${gameState.player.armor ? gameState.player.armor.icon : 'leather_vest.png'}" class="icon"> <b>Armadura:</b> <span class="${gameState.player.armor ? gameState.player.armor.colorClass : ''}">${gameState.player.armor ? gameState.player.armor.name : 'Ninguna'}</span>
            `;
        }
        checkLowHp(); 
    } catch (e) { console.error("Error HUD:", e); }
}

// =========================================
// SISTEMA DE ESTADÍSTICAS AVANZADAS
// =========================================
export function openStatsModal() {
    try {
        playSFX(sfx.ui_click);
        document.getElementById('mainMenuModal').style.display = 'none';
        const p = gameState.player;
        
        let atkSpeed = Number(p.baseAttackSpeed); if (isNaN(atkSpeed)) atkSpeed = 1.0;
        
        let html = `
            <div style="background: #1a0f14; padding: 12px; border-radius: 8px; border: 1px solid #f44336; box-shadow: inset 0 0 10px rgba(244,67,54,0.1);">
                <h3 style="color:#f44336; margin-top:0; font-size: 16px; border-bottom: 1px dashed #f44336; padding-bottom: 5px;">❤️ Supervivencia</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Vida Máxima:</span> <b style="color:#fff;">${getMaxHp() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. Vida:</span> <b style="color:#4caf50;">+${p.baseHpRegen || 0}/5s</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🛡️ Armadura:</span> <b style="color:#fff;">${getDef() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>✨ Resist. Mágica:</span> <b style="color:#fff;">${getMr() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Tenacidad:</span> <b style="color:#fff;">${p.baseTenacity || 0}%</b></p>
            </div>

            <div style="background: #1a180f; padding: 12px; border-radius: 8px; border: 1px solid #ffeb3b; box-shadow: inset 0 0 10px rgba(255,235,59,0.1);">
                <h3 style="color:#ffeb3b; margin-top:0; font-size: 16px; border-bottom: 1px dashed #ffeb3b; padding-bottom: 5px;">⚔️ Daño</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🗡️ Daño Físico (AD):</span> <b style="color:#fff;">${getAtk() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🔮 Poder Mágico (AP):</span> <b style="color:#2196f3;">${getMag() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>💥 Prob. Crítico:</span> <b style="color:#ff9800;">${Math.floor(getCrit() * 100)}%</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Daño Crítico:</span> <b style="color:#ff9800;">${Math.floor((p.baseCritDamage || 1.75) * 100)}%</b></p>
            </div>

            <div style="background: #0f1a1a; padding: 12px; border-radius: 8px; border: 1px solid #00bcd4; box-shadow: inset 0 0 10px rgba(0,188,212,0.1);">
                <h3 style="color:#00bcd4; margin-top:0; font-size: 16px; border-bottom: 1px dashed #00bcd4; padding-bottom: 5px;">⚡ Velocidad</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Vel. de Ataque:</span> <b style="color:#fff;">${atkSpeed.toFixed(2)}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Ability Haste:</span> <b style="color:#fff;">${p.baseAbilityHaste || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>👟 Vel. Movimiento:</span> <b style="color:#fff;">${p.baseMoveSpeed || 300}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>🎯 Rango:</span> <b style="color:#fff;">${p.baseRange || 1}</b></p>
            </div>

            <div style="background: #0f1a12; padding: 12px; border-radius: 8px; border: 1px solid #4caf50; box-shadow: inset 0 0 10px rgba(76,175,80,0.1);">
                <h3 style="color:#4caf50; margin-top:0; font-size: 16px; border-bottom: 1px dashed #4caf50; padding-bottom: 5px;">🩸 Sustento</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Robo de Vida:</span> <b style="color:#fff;">${Math.floor(getLifesteal() * 100)}%</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Omnivamp:</span> <b style="color:#fff;">${Math.floor((p.baseOmnivamp || 0) * 100)}%</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>💧 Maná Máx:</span> <b style="color:#2196f3;">${getMaxMp() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. Maná:</span> <b style="color:#2196f3;">+${p.baseMpRegen || 0}/5s</b></p>
            </div>

            <div style="background: #160f1a; padding: 12px; border-radius: 8px; border: 1px solid #9c27b0; box-shadow: inset 0 0 10px rgba(156,39,176,0.1);">
                <h3 style="color:#9c27b0; margin-top:0; font-size: 16px; border-bottom: 1px dashed #9c27b0; padding-bottom: 5px;">🧨 Penetración</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Letalidad:</span> <b style="color:#fff;">${getLethality()}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Pen. Armadura:</span> <b style="color:#fff;">${Math.floor((p.baseArmorPen || 0) * 100)}%</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Pen. Mágica:</span> <b style="color:#fff;">${getMagicPen()}</b></p>
            </div>
        `;
        document.getElementById('fullStatsContainer').innerHTML = html;
        document.getElementById('statsModal').style.display = 'flex';
    } catch (e) { document.getElementById('statsModal').style.display = 'none'; document.getElementById('mainMenuModal').style.display = 'flex'; }
}
export function closeStatsModal() { playSFX(sfx.ui_click); document.getElementById('statsModal').style.display = 'none'; document.getElementById('mainMenuModal').style.display = 'flex'; }
window.openStatsModal = openStatsModal; window.closeStatsModal = closeStatsModal;

// =========================================
// PANELES Y VENTANAS
// =========================================
export function toggleMainMenu() {
    if (gameState.inCombat || document.getElementById('roleModal').style.display === 'flex' || document.getElementById('characterModal').style.display === 'flex') return;
    isMenuOpen = !isMenuOpen; playSFX(sfx.ui_click);
    if (isMenuOpen) { updateHUD(); }
    document.getElementById('invModal').style.display = 'none'; document.getElementById('shopModal').style.display = 'none'; document.getElementById('npcModal').style.display = 'none'; document.getElementById('statsModal').style.display = 'none';
    const grimoire = document.getElementById('grimoireModal'); if(grimoire) grimoire.style.display = 'none';
    const tree = document.getElementById('skillTreeModal'); if(tree) tree.style.display = 'none';
    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
}
window.toggleMainMenu = toggleMainMenu;
window.openLevelUpModal = openLevelUpModal;

window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') {
        if (gameState.inCombat || document.getElementById('roleModal').style.display === 'flex' || document.getElementById('characterModal').style.display === 'flex') return;
        if (document.getElementById('statsModal').style.display === 'flex') { closeStatsModal(); toggleMainMenu(); } else { isMenuOpen = true; document.getElementById('mainMenuModal').style.display = 'none'; openStatsModal(); }
    }
});


// =========================================
// GENERACIÓN DINÁMICA DE TEXTO DE ITEMS
// =========================================
// Función auxiliar para crear el texto de estadísticas de un arma
function buildWeaponStatsText(w) {
    let stats = [];
    if(w.ad > 0) stats.push(`AD +${w.ad}`);
    if(w.ap > 0) stats.push(`AP +${w.ap}`);
    if(w.crit > 0) stats.push(`Crit +${Math.floor(w.crit*100)}%`);
    if(w.lifesteal > 0) stats.push(`RoboVida +${Math.floor(w.lifesteal*100)}%`);
    if(w.lethality > 0) stats.push(`Letalidad +${w.lethality}`);
    if(w.magicPen > 0) stats.push(`Pen.Mágica +${w.magicPen}`);
    return stats.join(' | ') || 'Sin atributos';
}

function buildArmorStatsText(a) {
    let stats = [];
    if(a.armor > 0) stats.push(`Armor +${a.armor}`);
    if(a.mr > 0) stats.push(`MR +${a.mr}`);
    if(a.hpBonus > 0) stats.push(`HP +${a.hpBonus}`);
    if(a.mpBonus > 0) stats.push(`MP +${a.mpBonus}`);
    if(a.moveSpeed > 0) stats.push(`Velocidad +${a.moveSpeed}`);
    return stats.join(' | ') || 'Sin atributos';
}


// =========================================
// INVENTARIO Y EQUIPAMIENTO
// =========================================
export function openInventory() {
    playSFX(sfx.ui_click);
    
    let htmlEq = '';
    if (gameState.player.weapon) {
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.weapon.icon}" class="icon"> <span class="${gameState.player.weapon.colorClass}">${gameState.player.weapon.name}</span><br><small>${buildWeaponStatsText(gameState.player.weapon)}</small></div><button onclick="unequipItem('weapon')" class="btn-danger">Quitar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Arma: Nada equipado</p>`;
    }
    
    if (gameState.player.armor) {
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.armor.icon}" class="icon"> <span class="${gameState.player.armor.colorClass}">${gameState.player.armor.name}</span><br><small>${buildArmorStatsText(gameState.player.armor)}</small></div><button onclick="unequipItem('armor')" class="btn-danger">Quitar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Armadura: Nada equipado</p>`;
    }
    document.getElementById('invEquipped').innerHTML = htmlEq;

    let htmlBag = '<h4>Armas</h4>';
    if(gameState.player.inventory.weapons.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armas en la mochila.</p>';
    gameState.player.inventory.weapons.forEach((w, idx) => {
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${buildWeaponStatsText(w)}</small></div><button onclick="equipFromInv('weapon', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    htmlBag += '<h4>Armaduras</h4>';
    if(gameState.player.inventory.armors.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armaduras en la mochila.</p>';
    gameState.player.inventory.armors.forEach((a, idx) => {
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${buildArmorStatsText(a)}</small></div><button onclick="equipFromInv('armor', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    document.getElementById('invBag').innerHTML = htmlBag; 
    document.getElementById('invModal').style.display = 'flex';
}

export function closeInventory() { playSFX(sfx.ui_click); document.getElementById('invModal').style.display = 'none'; }

export function unequipItem(type) {
   
