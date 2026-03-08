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

function canOpenUiPanels() {
    return !gameState.inCombat &&
        document.getElementById('roleModal').style.display !== 'flex' &&
        document.getElementById('characterModal').style.display !== 'flex';
}

function closeNonSystemPanels() {
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'none';
    document.getElementById('npcModal').style.display = 'none';
    document.getElementById('statsModal').style.display = 'none';
    const mapModal = document.getElementById('mapModal'); if (mapModal) mapModal.style.display = 'none';
    const grimoire = document.getElementById('grimoireModal'); if (grimoire) grimoire.style.display = 'none';
    const tree = document.getElementById('skillTreeModal'); if (tree) tree.style.display = 'none';
}

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

// muestra quién tiene el próximo turno y barras de iniciativa
export function updateInitiativeDisplay() {
    const infoEl = document.getElementById('initiativeInfo');
    if (!infoEl) return;
    const pi = gameState.combatState.initiative || 0;
    const ei = gameState.combatState.enemyInitiative || 0;
    const next = pi >= ei ? 'Jugador' : 'Enemigo';
    infoEl.textContent = `Próximo: ${next} (${Math.floor(pi)} / ${Math.floor(ei)})`;
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

        // Botón fijo de subida de nivel para móvil/escritorio sin inyectar HTML dinámico en menús.
        const hudLevelBtn = document.getElementById('hudLevelUpBtn');
        if (hudLevelBtn) {
            if ((gameState.player.statPoints || 0) > 0) {
                hudLevelBtn.style.display = 'block';
                hudLevelBtn.textContent = `⭐ +${gameState.player.statPoints} Punto(s)`;
            } else {
                hudLevelBtn.style.display = 'none';
            }
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
        document.getElementById('invModal').style.display = 'none';
        const mapModal = document.getElementById('mapModal'); if (mapModal) mapModal.style.display = 'none';
        const p = gameState.player;
        
        let atkSpeed = Number(p.baseAttackSpeed); if (isNaN(atkSpeed)) atkSpeed = 1.0;
        // añadir bonus de accesorio
        if (p.accessory) {
            if(p.accessory.attackSpeed) atkSpeed += p.accessory.attackSpeed;
        }
        let haste = p.baseAbilityHaste || 0;
        let moveSpd = p.baseMoveSpeed || 300;
        let mpRegen = p.baseMpRegen || 0;
        if (p.accessory) {
            if(p.accessory.abilityHaste) haste += p.accessory.abilityHaste;
            if(p.accessory.moveSpeed) moveSpd += p.accessory.moveSpeed;
            if(p.accessory.mpRegen) mpRegen += p.accessory.mpRegen;
        }
        
        let html = `
            <div style="background: #1a0f14; padding: 12px; border-radius: 8px; border: 1px solid #f44336; box-shadow: inset 0 0 10px rgba(244,67,54,0.1);">
                <h3 style="color:#f44336; margin-top:0; font-size: 16px; border-bottom: 1px dashed #f44336; padding-bottom: 5px;">❤️ Supervivencia</h3>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Vida Máxima:</span> <b style="color:#fff;">${getMaxHp() || 0}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. Vida:</span> <b style="color:#4caf50;">+${p.baseHpRegen || 0}/5s</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Regen. MP:</span> <b style="color:#2196f3;">+${mpRegen}/5s</b></p>
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
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>Ability Haste:</span> <b style="color:#fff;">${haste}</b></p>
                <p style="margin: 5px 0; font-size: 13px; display:flex; justify-content:space-between;"><span>👟 Vel. Movimiento:</span> <b style="color:#fff;">${moveSpd}</b></p>
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
    } catch (e) { document.getElementById('statsModal').style.display = 'none'; }
}
export function closeStatsModal() { playSFX(sfx.ui_click); document.getElementById('statsModal').style.display = 'none'; }
window.openStatsModal = openStatsModal; window.closeStatsModal = closeStatsModal;

// =========================================
// PANELES Y VENTANAS
// =========================================
export function toggleMainMenu() {
    if (!canOpenUiPanels()) return;
    isMenuOpen = !isMenuOpen; playSFX(sfx.ui_click);
    if (isMenuOpen) { updateHUD(); closeNonSystemPanels(); }
    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
}
window.toggleMainMenu = toggleMainMenu;
window.openLevelUpModal = openLevelUpModal;

export function openMapModal() {
    if (!canOpenUiPanels()) return;
    playSFX(sfx.ui_click);
    isMenuOpen = false;
    closeNonSystemPanels();
    document.getElementById('mainMenuModal').style.display = 'none';

    const mapQuestInfo = document.getElementById('mapQuestInfo');
    if (mapQuestInfo) {
        if (gameState.quest) {
            const q = gameState.quest;
            const prog = q.progress || 0;
            let detail = q.text || 'Misión activa';
            if (q.type === 'collect_gold') {
                detail = `${prog} / ${q.goal} oro`;
            } else if (q.target) {
                detail = `${prog} / ${q.goal} ${q.target}`;
            } else {
                detail = `${prog} / ${q.goal}`;
            }
            mapQuestInfo.innerHTML = `<b>Misión Actual:</b> ${q.text}<br><b>Progreso:</b> ${detail}`;
        } else {
            mapQuestInfo.innerHTML = '<b>Sin misión activa.</b> Explora y habla con NPCs para obtener tareas.';
        }
    }

    if (typeof window.renderMiniMap === 'function') {
        window.renderMiniMap('miniMapCanvas');
    }
    document.getElementById('mapModal').style.display = 'flex';
}

export function closeMapModal() {
    playSFX(sfx.ui_click);
    document.getElementById('mapModal').style.display = 'none';
}

export function toggleMapModal() {
    const mapModal = document.getElementById('mapModal');
    if (!mapModal || !canOpenUiPanels()) return;
    if (mapModal.style.display === 'flex') closeMapModal();
    else openMapModal();
}
window.openMapModal = openMapModal;
window.closeMapModal = closeMapModal;
window.toggleMapModal = toggleMapModal;


// =========================================
// GENERACIÓN DINÁMICA DE TEXTO DE ITEMS
// =========================================
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

function buildAccessoryStatsText(acc) {
    let stats = [];
    if(acc.moveSpeed) stats.push(`Vel.move +${acc.moveSpeed}`);
    if(acc.attackSpeed) stats.push(`Vel.ataque +${(acc.attackSpeed*100).toFixed(0)}%`);
    if(acc.abilityHaste) stats.push(`Ability Haste +${acc.abilityHaste}`);
    if(acc.mpRegen) stats.push(`MP Regen +${acc.mpRegen}`);
    return stats.join(' | ') || 'Sin atributos';
}


// =========================================
// INVENTARIO Y EQUIPAMIENTO
// =========================================
export function openInventory() {
    playSFX(sfx.ui_click);
    isMenuOpen = false;
    document.getElementById('mainMenuModal').style.display = 'none';
    
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
    // accesorio
    if (gameState.player && gameState.player.accessory) {
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.accessory.icon}" class="icon"> <span class="color-epico">${gameState.player.accessory.name}</span><br><small>${buildAccessoryStatsText(gameState.player.accessory)}</small></div><button onclick="unequipItem('accessory')" class="btn-danger">Quitar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Accesorio: Nada equipado</p>`;
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
    
    htmlBag += '<h4>Accesorios</h4>';
    if(!gameState.player.inventory.accessories || gameState.player.inventory.accessories.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes accesorios.</p>';
    else {
        gameState.player.inventory.accessories.forEach((acc, idx) => {
            htmlBag += `<div class="shop-item"><div><img src="img/weapons/${acc.icon}" class="icon"> <span class="color-epico">${acc.name}</span><br><small>${buildAccessoryStatsText(acc)}</small></div><button onclick="equipFromInv('accessory', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
        });
    }
    // Consumibles dinámicos
    let htmlConsumables = '';
    if (gameState.player.potions > 0) {
        htmlConsumables += `<div class="shop-item"><div><img src="img/items/potion.png" class="icon"> <span class="color-raro">Poción de Vida</span><br><small>Restaura 25 HP</small></div><button onclick="useConsumable('hp')" class="btn-success">Usar (${gameState.player.potions})</button></div>`;
    }
    if (gameState.player.manaPotions > 0) {
        htmlConsumables += `<div class="shop-item"><div><img src="img/items/mana_potion.png" class="icon"> <span class="color-raro">Poción de Maná</span><br><small>Restaura 20 MP</small></div><button onclick="useConsumable('mp')" class="btn-magic">Usar (${gameState.player.manaPotions})</button></div>`;
    }
    if (gameState.player.energyPotions > 0) {
        htmlConsumables += `<div class="shop-item"><div><img src="img/items/energy_potion.png" class="icon" style="filter: hue-rotate(280deg);"> <span class="color-raro">Poción de Energía</span><br><small>Restaura 30 EP</small></div><button onclick="useConsumable('ep')" class="btn-skill">Usar (${gameState.player.energyPotions})</button></div>`;
    }
    if (htmlConsumables !== '') { htmlBag += '<h4>Consumibles</h4>' + htmlConsumables; }
    document.getElementById('invBag').innerHTML = htmlBag; 
    document.getElementById('invModal').style.display = 'flex';
}

export function closeInventory() { playSFX(sfx.ui_click); document.getElementById('invModal').style.display = 'none'; }

export function unequipItem(type) {
    playSFX(sfx.equip);
    if (type === 'weapon' && gameState.player.weapon) {
        gameState.player.inventory.weapons.push(gameState.player.weapon);
        gameState.player.weapon = null; logMsg("Desequipaste tu arma.");
    } else if (type === 'armor' && gameState.player.armor) {
        gameState.player.inventory.armors.push(gameState.player.armor);
        gameState.player.armor = null;
        gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp);
        logMsg("Desequipaste tu armadura.");
    } else if (type === 'accessory' && gameState.player.accessory) {
        gameState.player.inventory.accessories.push(gameState.player.accessory);
        gameState.player.accessory = null;
        logMsg("Desequipaste tu accesorio.");
    }
    updateHUD(); openInventory(); saveGame();
}

export function equipFromInv(type, idx) {
    playSFX(sfx.equip);
    if (type === 'weapon') {
        const item = gameState.player.inventory.weapons.splice(idx, 1)[0];
        if(gameState.player.weapon) { gameState.player.inventory.weapons.push(gameState.player.weapon); }
        gameState.player.weapon = item;
    } else if (type === 'armor') {
        const item = gameState.player.inventory.armors.splice(idx, 1)[0];
        if(gameState.player.armor) { gameState.player.inventory.armors.push(gameState.player.armor); }
        gameState.player.armor = item; 
        gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + (item.hpBonus || 0));
    } else if (type === 'accessory') {
        const item = gameState.player.inventory.accessories.splice(idx, 1)[0];
        if(gameState.player.accessory) { gameState.player.inventory.accessories.push(gameState.player.accessory); }
        gameState.player.accessory = item;
    }
    updateHUD(); openInventory(); saveGame();
}

export function useConsumable(type) {
    if (type === 'hp' && gameState.player.potions > 0) {
        gameState.player.potions--;
        gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + 25);
        logMsg("Usaste una Poción de Vida (+25 HP).");
        spawnFloatingText('+25 HP', '#4caf50', 'map');
    } else if (type === 'mp' && gameState.player.manaPotions > 0) {
        gameState.player.manaPotions--;
        gameState.player.mp = Math.min(getMaxMp(), gameState.player.mp + 20);
        logMsg("Usaste una Poción de Maná (+20 MP).");
        spawnFloatingText('+20 MP', '#2196f3', 'map');
    } else if (type === 'ep' && gameState.player.energyPotions > 0) {
        gameState.player.energyPotions--;
        gameState.player.ep = Math.min(getMaxEp(), gameState.player.ep + 30);
        logMsg("Usaste una Poción de Energía (+30 EP).");
        spawnFloatingText('+30 EP', '#9c27b0', 'map');
    } else { return; } 
    
    playSFX(sfx.use_potion);
    updateHUD(); 
    openInventory(); 
    saveGame();
}
window.useConsumable = useConsumable;
window.openInventory = openInventory; window.closeInventory = closeInventory;
window.unequipItem = unequipItem; window.equipFromInv = equipFromInv;
            // =========================================
// SISTEMA DE GRIMORIO
// =========================================
export function openGrimoire() {
    playSFX(sfx.ui_click);
    document.getElementById('invModal').style.display = 'none';
    
    let htmlEq = '';
    const eqSp = gameState.player.equippedSkills.special;
    if (eqSp && skillsData[eqSp]) {
        let s = skillsData[eqSp];
        htmlEq += `<div class="shop-item" style="border-color: #f44336;"><div><span style="font-size:24px">${s.icon}</span> <span>${s.name}</span><br><small>Ofensiva | ${s.cost} ${s.resource.toUpperCase()}</small></div><button onclick="unequipSkill('special')" class="btn-danger">Quitar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px; border: 1px dashed #f44336;">Espacio Ofensivo: Vacío</p>`;
    }
    
    const eqDef = gameState.player.equippedSkills.defensive;
    if (eqDef && skillsData[eqDef]) {
        let s = skillsData[eqDef];
        htmlEq += `<div class="shop-item" style="border-color: #4caf50;"><div><span style="font-size:24px">${s.icon}</span> <span>${s.name}</span><br><small>Defensiva | ${s.cost} ${s.resource.toUpperCase()}</small></div><button onclick="unequipSkill('defensive')" class="btn-danger">Quitar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px; border: 1px dashed #4caf50;">Espacio Defensivo: Vacío</p>`;
    }
    document.getElementById('grimEquipped').innerHTML = htmlEq;

    let htmlKnown = '';
    if (!gameState.player.knownSkills || gameState.player.knownSkills.length === 0) {
        htmlKnown = '<p style="font-size:12px; color:#aaa; text-align:center;">Aún no conoces ninguna habilidad nueva.</p>';
    } else {
        gameState.player.knownSkills.forEach(skillId => {
            let s = skillsData[skillId];
            let isEquipped = (eqSp === skillId || eqDef === skillId);
            let btnHtml = '';
            
            if (isEquipped) {
                btnHtml = `<button disabled style="background:#555; color:#888;">En uso</button>`;
            } else if (s.type === 'special') {
                btnHtml = `<button onclick="equipSkill('${skillId}', 'special')" style="background:#f44336; color:#fff;">Usar Ofensiva</button>`;
            } else {
                btnHtml = `<button onclick="equipSkill('${skillId}', 'defensive')" style="background:#4caf50; color:#fff;">Usar Defensiva</button>`;
            }
            
            htmlKnown += `
                <div class="shop-item" style="flex-direction:column; align-items:flex-start; gap:8px;">
                    <div style="display:flex; justify-content:space-between; width:100%; align-items: center;">
                        <div><span style="font-size:20px">${s.icon}</span> <span style="font-weight:bold; color:#fff;">${s.name}</span> <small style="color:${s.resource === 'mp' ? '#2196f3' : '#9c27b0'};">(${s.cost} ${s.resource.toUpperCase()})</small></div>
                        ${btnHtml}
                    </div>
                    <div style="font-size:12px; color:#ccc; line-height: 1.4;">${s.desc}</div>
                </div>`;
        });
    }
    document.getElementById('grimList').innerHTML = htmlKnown; 
    document.getElementById('mainMenuModal').style.display = 'none';
    document.getElementById('grimoireModal').style.display = 'flex';
}
export function closeGrimoire() { playSFX(sfx.ui_click); document.getElementById('grimoireModal').style.display = 'none'; }
export function equipSkill(skillId, slot) { playSFX(sfx.equip); gameState.player.equippedSkills[slot] = skillId; logMsg(`Has equipado: ${skillsData[skillId].name}.`); saveGame(); openGrimoire(); }
export function unequipSkill(slot) { playSFX(sfx.equip); gameState.player.equippedSkills[slot] = null; saveGame(); openGrimoire(); }
window.openGrimoire = openGrimoire; window.closeGrimoire = closeGrimoire; window.equipSkill = equipSkill; window.unequipSkill = unequipSkill;

// =========================================
// SISTEMA DE ÁRBOL DE HABILIDADES
// =========================================
export function openSkillTree() {
    playSFX(sfx.ui_click);
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('mainMenuModal').style.display = 'none';
    document.getElementById('spDisplay').textContent = gameState.player.skillPoints || 0;
    
    const container = document.getElementById('skillTreeContainer');
    const emptyMsg = document.getElementById('skillTreeEmptyMsg');
    container.innerHTML = '';
    
    const classSkills = Object.values(skillsData).filter(s => s.class === gameState.player.role);
    
    if (classSkills.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        classSkills.forEach(skill => {
            const isLearned = gameState.player.knownSkills.includes(skill.id);
            const reqLearned = skill.req ? gameState.player.knownSkills.includes(skill.req) : true;
            
            let htmlNode = `<div style="width: 300px; padding: 15px; border-radius: 8px; background: #0b1220; display: flex; flex-direction: column; align-items: center; border: 2px solid `;
            let btnHtml = '';
            
            if (isLearned) {
                htmlNode += `#ffeb3b; box-shadow: 0 0 15px rgba(255, 235, 59, 0.4);">`;
                btnHtml = `<button disabled style="background:transparent; color:#ffeb3b; border: 1px solid #ffeb3b;">⭐ Ya Aprendida</button>`;
            } else if (!reqLearned) {
                htmlNode += `#333; opacity: 0.5;">`;
                let reqName = skillsData[skill.req].name;
                btnHtml = `<button disabled style="background:#333; color:#888;">Bloqueada (Req: ${reqName})</button>`;
            } else {
                htmlNode += `#00bcd4;">`;
                if (gameState.player.skillPoints > 0) { btnHtml = `<button onclick="learnSkill('${skill.id}')" style="background:#00bcd4; color:#fff;">Aprender (1 SP)</button>`; } 
                else { btnHtml = `<button disabled style="background:#555; color:#aaa;">Falta 1 SP</button>`; }
            }
            
            htmlNode += `
                <div style="font-size: 40px; margin-bottom: 5px;">${skill.icon}</div>
                <h4 style="margin: 0 0 5px 0; color: #fff;">${skill.name}</h4>
                <p style="font-size: 12px; color: #aaa; text-align: center; height: 35px; margin-bottom: 10px;">${skill.desc}</p>
                <div style="font-size: 11px; color: ${skill.resource === 'mp' ? '#2196f3' : '#9c27b0'}; margin-bottom: 15px;">Costo: ${skill.cost} ${skill.resource.toUpperCase()}</div>
                ${btnHtml}
            </div>`;
            container.innerHTML += htmlNode;
        });
    }
    document.getElementById('skillTreeModal').style.display = 'flex';
}
export function closeSkillTree() { playSFX(sfx.ui_click); document.getElementById('skillTreeModal').style.display = 'none'; }
export function learnSkill(skillId) { if (gameState.player.skillPoints > 0) { playSFX(sfx.quest_complete); gameState.player.skillPoints--; gameState.player.knownSkills.push(skillId); logMsg(`¡Has aprendido ${skillsData[skillId].name}!`); saveGame(); openSkillTree(); } }
window.openSkillTree = openSkillTree; window.closeSkillTree = closeSkillTree; window.learnSkill = learnSkill;


// =========================================
// TIENDA DEL JUEGO (REDISEÑADA PARA MOBA)
// =========================================
export function openShop() {
    playSFX(sfx.shop_open); 
    const cd = mapData[gameState.currentZoneIndex];
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
    
    cd.shop.weapons.forEach((w, idx) => { 
        let sPrice = Math.floor(w.price * scaleFactor);
        let sName = w.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        let viewW = JSON.parse(JSON.stringify(w));
        if(viewW.ad) viewW.ad = Math.floor(viewW.ad * scaleFactor);
        if(viewW.ap) viewW.ap = Math.floor(viewW.ap * scaleFactor);
        if(viewW.lethality) viewW.lethality = Math.floor(viewW.lethality * scaleFactor);
        if(viewW.magicPen) viewW.magicPen = Math.floor(viewW.magicPen * scaleFactor);

        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${buildWeaponStatsText(viewW)}</small></div><button onclick="buyWeapon(${idx})">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    
    cd.shop.armors.forEach((a, idx) => { 
        let sPrice = Math.floor(a.price * scaleFactor);
        let sName = a.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        let viewA = JSON.parse(JSON.stringify(a));
        if(viewA.armor) viewA.armor = Math.floor(viewA.armor * scaleFactor);
        if(viewA.mr) viewA.mr = Math.floor(viewA.mr * scaleFactor);
        if(viewA.hpBonus) viewA.hpBonus = Math.floor(viewA.hpBonus * scaleFactor);
        if(viewA.mpBonus) viewA.mpBonus = Math.floor(viewA.mpBonus * scaleFactor);
        
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${buildArmorStatsText(viewA)}</small></div><button onclick="buyArmor(${idx})">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    // accesorios
    if (cd.shop.accessories) {
        cd.shop.accessories.forEach((acc, idx) => {
            let sPrice = Math.floor(acc.price * scaleFactor);
            let sName = acc.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
            let viewAcc = JSON.parse(JSON.stringify(acc));
            // no scaling other than maybe speed? leave as is
            htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${acc.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${buildAccessoryStatsText(viewAcc)}</small></div><button onclick="buyAccessory(${idx})">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
        });
    }
    
    document.getElementById('shopContentBuy').innerHTML = htmlBuy; 
    renderSellTab(); switchShopTab('buy'); 
    document.getElementById('shopModal').style.display = 'flex';
}

export function renderSellTab() {
    let htmlSell = '<h4>Tus Armas</h4>';
    if(gameState.player.inventory.weapons.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    gameState.player.inventory.weapons.forEach((w, idx) => {
        let sellPrice = Math.floor((w.price || 15) / 2); 
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${buildWeaponStatsText(w)}</small></div><button class="btn-success" onclick="sellWeapon(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    
    htmlSell += '<h4>Tus Armaduras</h4>';
    if(gameState.player.inventory.armors.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    gameState.player.inventory.armors.forEach((a, idx) => {
        let sellPrice = Math.floor((a.price || 20) / 2);
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${buildArmorStatsText(a)}</small></div><button class="btn-success" onclick="sellArmor(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    htmlSell += '<h4>Tus Accesorios</h4>';
    if(!gameState.player.inventory.accessories || gameState.player.inventory.accessories.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    else {
        gameState.player.inventory.accessories.forEach((acc, idx) => {
            let sellPrice = Math.floor((acc.price || 20) / 2);
            htmlSell += `<div class="shop-item"><div><img src="img/weapons/${acc.icon}" class="icon"> <span class="${acc.colorClass || ''}">${acc.name}</span><br><small>${buildAccessoryStatsText(acc)}</small></div><button class="btn-success" onclick="sellAccessory(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
        });
    }
    document.getElementById('shopContentSell').innerHTML = htmlSell;
}

export function buyWeapon(idx) { 
    const cd = mapData[gameState.currentZoneIndex];
    const baseItem = cd.shop.weapons[idx];
    let scaleFactor = getMapScale();
    let price = Math.floor(baseItem.price * scaleFactor);

    if (gameState.player.gold >= price) { 
        gameState.player.gold -= price; 
        
        let item = JSON.parse(JSON.stringify(baseItem));
        item.name = item.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        if(item.ad) item.ad = Math.floor(item.ad * scaleFactor);
        if(item.ap) item.ap = Math.floor(item.ap * scaleFactor);
        if(item.lethality) item.lethality = Math.floor(item.lethality * scaleFactor);
        if(item.magicPen) item.magicPen = Math.floor(item.magicPen * scaleFactor);
        item.price = price;
        item.colorClass = cd.colorClass;

        gameState.player.inventory.weapons.push(item); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${item.name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

export function buyArmor(idx) { 
    const cd = mapData[gameState.currentZoneIndex];
    const baseItem = cd.shop.armors[idx];
    let scaleFactor = getMapScale();
    let price = Math.floor(baseItem.price * scaleFactor);

    if (gameState.player.gold >= price) { 
        gameState.player.gold -= price; 
        
        let item = JSON.parse(JSON.stringify(baseItem));
        item.name = item.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        if(item.armor) item.armor = Math.floor(item.armor * scaleFactor);
        if(item.mr) item.mr = Math.floor(item.mr * scaleFactor);
        if(item.hpBonus) item.hpBonus = Math.floor(item.hpBonus * scaleFactor);
        if(item.mpBonus) item.mpBonus = Math.floor(item.mpBonus * scaleFactor);
        item.price = price;
        item.colorClass = cd.colorClass;

        gameState.player.inventory.armors.push(item); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${item.name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

// nuevas funciones de accesorios (resuelven ReferenceError)
export function buyAccessory(idx) { 
    const cd = mapData[gameState.currentZoneIndex];
    const baseItem = cd.shop.accessories[idx];
    let scaleFactor = getMapScale();
    let price = Math.floor(baseItem.price * scaleFactor);

    if (gameState.player.gold >= price) { 
        gameState.player.gold -= price; 
        
        let item = JSON.parse(JSON.stringify(baseItem));
        item.name = item.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        // Mantener los stats del accesorio intactos
        item.price = price;
        item.colorClass = cd.colorClass;

        gameState.player.inventory.accessories.push(item); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${item.name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

export function sellAccessory(idx, price) { 
    playSFX(sfx.sell_item); 
    gameState.player.inventory.accessories.splice(idx, 1); 
    gameState.player.gold += price; 
    logMsg(`Vendiste un accesorio por ${price} oro.`); 
    updateHUD(); renderSellTab(); saveGame(); 
}

export function switchShopTab(tab) { playSFX(sfx.ui_click); if(tab === 'buy') { document.getElementById('tabBuy').classList.add('active-tab'); document.getElementById('tabSell').classList.remove('active-tab'); document.getElementById('shopContentBuy').style.display = 'grid'; document.getElementById('shopContentSell').style.display = 'none'; } else { document.getElementById('tabSell').classList.add('active-tab'); document.getElementById('tabBuy').classList.remove('active-tab'); document.getElementById('shopContentSell').style.display = 'grid'; document.getElementById('shopContentBuy').style.display = 'none'; } }
export function closeShop() { playSFX(sfx.shop_close); document.getElementById('shopModal').style.display = 'none'; }
export function sellWeapon(idx, price) { playSFX(sfx.sell_item); gameState.player.inventory.weapons.splice(idx, 1); gameState.player.gold += price; logMsg(`Vendiste un arma por ${price} oro.`); updateHUD(); renderSellTab(); saveGame(); }
export function sellArmor(idx, price) { playSFX(sfx.sell_item); gameState.player.inventory.armors.splice(idx, 1); gameState.player.gold += price; logMsg(`Vendiste una armadura por ${price} oro.`); updateHUD(); renderSellTab(); saveGame(); }
export function buyPotion() { let p = Math.floor(20 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.potions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Vida."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
export function buyManaPotion() { let p = Math.floor(25 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.manaPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Maná."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
export function buyEnergyPotion() { let p = Math.floor(15 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.energyPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Energía."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }

window.switchShopTab = switchShopTab; window.closeShop = closeShop; window.sellWeapon = sellWeapon; window.sellArmor = sellArmor; window.buyPotion = buyPotion; window.buyManaPotion = buyManaPotion; window.buyEnergyPotion = buyEnergyPotion; window.buyWeapon = buyWeapon; window.buyArmor = buyArmor; window.buyAccessory = buyAccessory; window.sellAccessory = sellAccessory;
// =========================================
// SISTEMA DE NPCs
// =========================================
export function openSpecificNPCModal(npcData) {
    if (gameState.quest) { playSFX(sfx.error); logMsg(`${npcData.name} te dice: '¡Termina la misión que tienes primero!'`); return; }
    playSFX(sfx.ui_click);
    if (!gameState.player.zoneQuestProgress) gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
    if (!gameState.player.hasKey) gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
    let step = gameState.player.zoneQuestProgress[gameState.currentZoneIndex];
    if (step >= 3) { playSFX(sfx.error); logMsg(`${npcData.name} te dice: 'Ya has completado todas mis tareas en esta zona. ¡Cruza la puerta y avanza!'`); return; }
    const cd = mapData[gameState.currentZoneIndex]; let qScale = getMapScale(); 
    if (step === 0) { pendingQuest = { type: 'kill_enemy', target: cd.newEnemies[0].name, goal: 3, progress: 0, rewardType: 'gold', rewardAmount: Math.floor(20 * (gameState.currentZoneIndex + 1) * qScale), text: `Derrota 3 ${cd.newEnemies[0].name}s`, zone: gameState.currentZoneIndex }; } 
    else if (step === 1) { const gTarget = Math.floor(30 * (gameState.currentZoneIndex + 1) * qScale); pendingQuest = { type: 'collect_gold', goal: gTarget, progress: 0, rewardType: 'xp', rewardAmount: Math.floor(15 * (gameState.currentZoneIndex + 1) * qScale), text: `Consigue ${gTarget} de oro`, zone: gameState.currentZoneIndex }; } 
    else if (step === 2) { pendingQuest = { type: 'kill_boss', target: cd.boss.name, goal: 1, progress: 0, rewardType: 'potion', rewardAmount: 1, text: `Derrota al Jefe: ${cd.boss.name}`, zone: gameState.currentZoneIndex }; }
    const dialog = npcData.dialogues[Math.floor(Math.random() * npcData.dialogues.length)];
    const isNpcSprite = !!npcData.spriteSheet;
    document.getElementById('npcIcon').innerHTML = `<div class="${isNpcSprite ? 'anim-idle' : ''}" style="width: 96px; height: 96px; margin: 0 auto; background-image: url('${npcData.spriteSheet || npcData.img}'); background-size: ${isNpcSprite ? '1300% 400%' : 'contain'}; background-position-y: ${isNpcSprite ? '66.666%' : 'center'}; background-repeat: no-repeat; image-rendering: pixelated;"></div>`; document.getElementById('npcName').textContent = npcData.name; document.getElementById('npcDialog').textContent = `"${dialog}"`;
    let rewardText = pendingQuest.rewardAmount + " " + (pendingQuest.rewardType === 'gold' ? 'Oro' : pendingQuest.rewardType === 'xp' ? 'XP' : 'Poción'); if (step === 2) rewardText += " y la Llave";
    document.getElementById('npcQuestDetail').innerHTML = `<b>Objetivo:</b> ${pendingQuest.text}<br><b>Recompensa:</b> ${rewardText}`;
    document.getElementById('npcModal').style.display = 'flex';
}
export function closeNPCModal() { playSFX(sfx.ui_click); pendingQuest = null; document.getElementById('npcModal').style.display = 'none'; }
export function acceptNPCQuest() { gameState.quest = pendingQuest; pendingQuest = null; playSFX(sfx.quest_accept); logMsg("¡Misión aceptada!"); updateHUD(); saveGame(); document.getElementById('npcModal').style.display = 'none'; }
window.closeNPCModal = closeNPCModal; window.acceptNPCQuest = acceptNPCQuest;

