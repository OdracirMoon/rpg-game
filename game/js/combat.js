// =========================================
// SISTEMA DE COMBATE Y MATEMÁTICAS MOBA
// =========================================
import { gameState } from './state.js';
import { mapData, skillsData, combatFormulas } from './data.js';
import { sfx, playSFX, playBGM } from './audio.js';
import { 
    getAtk, getDef, getMag, getMaxHp, getMaxMp, getMaxEp, 
    getCrit, getLifesteal, getLethality, getMagicPen, getMr,
    getHpColor, getMapScale, logMsg, logCombat, spawnFloatingText, updateHUD 
} from './ui.js';
import { render, generateWorld } from './map.js';
import { saveGame } from './main.js';

// =========================================
// UTILS DE VALIDACIÓN
// =========================================

// asegura que el objeto enemy tiene propiedades numéricas básicas
function ensureEnemy(enemy) {
    if (!enemy) return { hp: 0, atk: 0, def: 0, mag: 0, maxHp: 1, isBoss: false };
    enemy.hp = (enemy.hp !== undefined) ? enemy.hp : 0;
    enemy.atk = enemy.atk || 0;
    enemy.def = enemy.def || 0;
    enemy.mag = enemy.mag || 0;
    enemy.maxHp = (enemy.maxHp !== undefined) ? enemy.maxHp : enemy.hp || 1;
    // Nuevos stats para equilibrar con el jugador
    enemy.mr = enemy.mr || Math.floor(enemy.def * combatFormulas.magicResistanceMultiplier);
    enemy.crit = enemy.crit || 0;
    enemy.lifesteal = enemy.lifesteal || 0;
    enemy.lethality = enemy.lethality || 0;
    enemy.magicPen = enemy.magicPen || 0;
    return enemy;
}

// asegura que el estado del player no tiene valores undefined
function ensurePlayer() {
    if (!gameState.player) gameState.player = {};
    const p = gameState.player;
    p.hp = (p.hp !== undefined) ? p.hp : 0;
    p.mp = (p.mp !== undefined) ? p.mp : 0;
    p.ep = (p.ep !== undefined) ? p.ep : 0;
    p.gold = p.gold || 0;
    p.xp = p.xp || 0;
    p.level = p.level || 1;
    // atributos MOBA básicos
    p.baseMaxHp = p.baseMaxHp || 0;
    p.baseMaxMp = p.baseMaxMp || 0;
    p.baseMaxEp = p.baseMaxEp || 0;
    p.baseAd = p.baseAd || 0;
    p.baseAp = p.baseAp || 0;
    p.baseArmor = p.baseArmor || 0;
}

// =========================================
// INTERFAZ DE COMBATE
// =========================================
export function generateCombatButtons() {
    const container = document.getElementById('combatActions');
    let html = `<button id="btnAttack" onclick="doAttack()" style="font-size: 16px; padding: 12px;"><img src="img/weapons/iron_dagger.png" class="icon"> Atacar</button>`;

    const specialId = gameState.player.equippedSkills.special;
    if (specialId && skillsData[specialId]) {
        const skill = skillsData[specialId];
        const cssClass = skill.resource === 'mp' ? 'btn-magic' : 'btn-skill';
        html += `<button id="btnSkill1" class="${cssClass}" onclick="useSkill('${skill.id}')" style="font-size: 16px; padding: 12px;">${skill.icon} ${skill.name} (${skill.cost} ${skill.resource.toUpperCase()})</button>`;
    }

    const defId = gameState.player.equippedSkills.defensive;
    if (defId && skillsData[defId]) {
        const skill = skillsData[defId];
        const cssClass = skill.resource === 'mp' ? 'btn-magic' : 'btn-skill';
        html += `<button id="btnSkill2" class="${cssClass}" onclick="useSkill('${skill.id}')" style="font-size: 16px; padding: 12px;">${skill.icon} ${skill.name} (${skill.cost} ${skill.resource.toUpperCase()})</button>`;
    }

    html += `<button id="btnFlee" class="btn-danger" onclick="doFlee()" style="font-size: 16px; padding: 12px;">🏃 Huir (10 EP)</button>`;
    container.innerHTML = html;
}

export function lockCombatButtons(lock) {
    ['btnAttack', 'btnSkill1', 'btnSkill2', 'btnFlee'].forEach(id => {
        let btn = document.getElementById(id); if(btn) btn.disabled = lock;
    });
}

export function animateDamage(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) { imgElement.classList.remove('anim-damage'); void imgElement.offsetWidth; imgElement.classList.add('anim-damage'); }
}

export function animateHeal(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) { imgElement.classList.remove('anim-heal'); void imgElement.offsetWidth; imgElement.classList.add('anim-heal'); }
}

export function updateCombatUI() {
    if (!gameState.currentEnemyTile || !gameState.currentEnemyTile.enemy) return;
    let enemy = ensureEnemy(gameState.currentEnemyTile.enemy);
    ensurePlayer();
    let safeMaxHp = enemy.maxHp || 1;
    
    const hpPercent = Math.max(0, (enemy.hp / safeMaxHp) * 100);
    document.getElementById('enemyHpBar').style.width = `${hpPercent}%`;
    document.getElementById('enemyHpBar').style.backgroundColor = getHpColor(hpPercent);
    document.getElementById('enemyHpText').textContent = `${enemy.hp} / ${safeMaxHp}`;
    document.getElementById('enemyAtk').textContent = enemy.atk;
    document.getElementById('enemyDef').textContent = `${enemy.def} | Mag: ${enemy.mag || 0}`;

    const tHp = getMaxHp(); const tMp = getMaxMp(); const tEp = getMaxEp();
    const pOp = Math.max(0, (gameState.player.hp / tHp) * 100);
    document.getElementById('combatPlayerHpBar').style.width = `${pOp}%`;
    document.getElementById('combatPlayerHpBar').style.backgroundColor = getHpColor(pOp);
    document.getElementById('combatPlayerHpText').textContent = `${gameState.player.hp} / ${tHp}`;

    const pMp = Math.max(0, (gameState.player.mp / tMp) * 100);
    document.getElementById('combatPlayerMpBar').style.width = `${pMp}%`;
    document.getElementById('combatPlayerMpText').textContent = `${gameState.player.mp} / ${tMp}`;
    
    const pEp = Math.max(0, (gameState.player.ep / tEp) * 100);
    document.getElementById('combatPlayerEpBar').style.width = `${pEp}%`;
    document.getElementById('combatPlayerEpText').textContent = `${gameState.player.ep} / ${tEp}`;
}

// =========================================
// FLUJO DE COMBATE
// =========================================
export function startCombat(tile) {
    ensurePlayer();
    gameState.combatState.defBuffTurns = 0; gameState.combatState.poisonTurns = 0;
    generateCombatButtons(); lockCombatButtons(false); 
    gameState.inCombat = true; gameState.currentEnemyTile = tile; 
    let enemy = ensureEnemy(tile.enemy);
    enemy.mag = enemy.mag || 0; enemy.maxHp = enemy.maxHp || enemy.hp;
    
    if (enemy.isBoss) { playSFX(sfx.boss_spawn); playBGM('boss'); } else { playSFX(sfx.enemy_spawn); }
    document.getElementById('combatModal').style.display = 'flex'; document.getElementById('modalLog').innerHTML = ''; 
    document.getElementById('modalName').textContent = enemy.isBoss ? `JEFE: ${enemy.name}` : enemy.name;
    document.getElementById('modalImg').src = enemy.img;
    
    let traitText = "";
    if (enemy.isBoss && enemy.trait) {
        if(enemy.trait === 'regen') traitText = "✨ Regeneración";
        if(enemy.trait === 'crit') traitText = "⚡ Crítico";
        if(enemy.trait === 'vampire') traitText = "🦇 Vampirismo";
    }
    document.getElementById('enemyTraitDisplay').textContent = traitText;
    document.getElementById('combatPlayerName').textContent = gameState.player.characterName || "Héroe";
    document.getElementById('combatPlayerImg').src = gameState.player.combatImg; 
    logCombat(`<div>¡Un <b>${enemy.name}</b> salvaje aparece!</div>`);
    updateCombatUI(); render();
}

export function endCombat() { 
    gameState.inCombat = false; gameState.currentEnemyTile = null; 
    document.getElementById('combatModal').style.display = 'none'; lockCombatButtons(false);
    playBGM('field'); render(); 
}

export function checkEnemyDeathAndEndTurn(enemy) {
    enemy = ensureEnemy(enemy);
    ensurePlayer();
    updateCombatUI(); updateHUD();
    if (enemy.hp <= 0) { setTimeout(() => { logCombat(`🏆 ¡Enemigo derrotado!`); setTimeout(resolveVictory, 500); }, 200); } 
    else { setTimeout(() => processEnemyTurn(enemy), 600); }
}

// =========================================
// ATAQUE Y MATEMÁTICAS MOBA
// =========================================
export function doAttack() {
    ensurePlayer();
    lockCombatButtons(true);
    let enemy = ensureEnemy(gameState.currentEnemyTile && gameState.currentEnemyTile.enemy);
    
    // 1. CÁLCULO DE CRÍTICO Y DAÑO BASE
    let ad = getAtk();
    let isCrit = Math.random() < getCrit();
    if (isCrit) ad = Math.floor(ad * combatFormulas.critMultiplier);
    
    // 2. CÁLCULO DE LETALIDAD (Ignora armadura)
    let effDef = Math.max(0, enemy.def - getLethality());
    const pDmg = Math.max(combatFormulas.minDamage, ad - effDef);
    enemy.hp -= pDmg;
    
    playSFX(sfx.attack); animateDamage('modalImg'); 
    
    if (isCrit) {
        spawnFloatingText('¡CRÍTICO! -' + pDmg, '#ff9800', 'combat-enemy');
        logCombat(`💥 ¡CRÍTICO! Haces <b style="color:#ff9800">${pDmg}</b> de daño físico.`);
    } else {
        spawnFloatingText('-' + pDmg + ' HP', '#fff', 'combat-enemy');
        logCombat(`🗡️ Atacas y haces <b style="color:#ffeb3b">${pDmg}</b> de daño.`);
    }

    // 3. CÁLCULO DE ROBO DE VIDA
    let totalLifesteal = getLifesteal() + (gameState.player.baseOmnivamp || 0);
    if (totalLifesteal > 0) {
        let heal = Math.floor(pDmg * combatFormulas.lifestealHealPercent * totalLifesteal);
        if (heal > 0) {
            gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + heal);
            animateHeal('combatPlayerImg');
            spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-player');
        }
    }
    
    checkEnemyDeathAndEndTurn(enemy);
}

export function useSkill(skillId) {
    ensurePlayer();
    lockCombatButtons(true);
    let enemy = ensureEnemy(gameState.currentEnemyTile && gameState.currentEnemyTile.enemy);
    const pMag = getMag(); const pAtk = getAtk(); const maxHp = getMaxHp();
    
    const skillInfo = skillsData[skillId];
    if (!skillInfo) { lockCombatButtons(false); return; }

    if (skillInfo.resource === 'ep') {
        if (gameState.player.ep < skillInfo.cost) { playSFX(sfx.error); logMsg(`¡Faltan ${skillInfo.cost} EP!`); lockCombatButtons(false); return; }
        gameState.player.ep -= skillInfo.cost;
    } else if (skillInfo.resource === 'mp') {
        if (gameState.player.mp < skillInfo.cost) { playSFX(sfx.error); logMsg(`¡Faltan ${skillInfo.cost} MP!`); lockCombatButtons(false); return; }
        gameState.player.mp -= skillInfo.cost;
    }

    // Defensas efectivas
    let effDef = Math.max(0, enemy.def - getLethality());
    let effMr = Math.max(0, Math.floor(enemy.def * combatFormulas.magicResistanceMultiplier) - getMagicPen()); // Magia ignora resistencia mágica

    let dmgDealt = 0;

    // --- HABILIDADES ---
    if (skillId === 'golpe_brutal') {
        dmgDealt = Math.max(combatFormulas.minDamage, Math.floor(pAtk * combatFormulas.golpeBrutalMultiplier) - effDef);
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ffeb3b', 'combat-enemy');
        logCombat(`💥 Golpe Brutal: <b style="color:#ffeb3b">${dmgDealt}</b> de daño físico.`);
    }
    else if (skillId === 'corte_cruzado') {
        let dmgPerHit = Math.max(combatFormulas.minDamage, Math.floor(pAtk * combatFormulas.corteCruzadoMultiplier) - Math.floor(effDef / combatFormulas.corteCruzadoDefDivider));
        dmgDealt = dmgPerHit * combatFormulas.corteCruzadoHits; enemy.hp -= dmgDealt;
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ffeb3b', 'combat-enemy');
        logCombat(`⚔️ Corte Cruzado: 3 impactos para <b style="color:#ffeb3b">${dmgDealt}</b> de daño.`);
    }
    else if (skillId === 'grito_guerra') {
        gameState.combatState.defBuffTurns = combatFormulas.defBuffTurns; playSFX(sfx.equip); animateHeal('combatPlayerImg');
        logCombat(`🛡️ Grito de Guerra: Tu Armadura aumenta enormemente por 3 turnos.`);
    }
    else if (skillId === 'piel_hierro') {
        gameState.combatState.defBuffTurns = combatFormulas.pielHierroTurns; let heal = Math.floor(maxHp * combatFormulas.pielHierroHealPercent); gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.equip); animateHeal('combatPlayerImg'); spawnFloatingText('+' + heal, '#4caf50', 'combat-player');
        logCombat(`🗿 Piel de Hierro: Armadura masiva y curas <b style="color:#4caf50">${heal}</b> HP.`);
    }
    else if (skillId === 'tiro_doble') {
        let dmg1 = Math.max(combatFormulas.minDamage, Math.floor(pAtk * combatFormulas.tiroDobleMultiplier) - Math.floor(effDef / combatFormulas.tiroDobleDefDivider)); dmgDealt = dmg1 * combatFormulas.tiroDobleHits; enemy.hp -= dmgDealt;
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ffeb3b', 'combat-enemy');
        logCombat(`🏹 Tiro Doble: <b style="color:#ffeb3b">${dmgDealt}</b> de daño total.`);
    }
    else if (skillId === 'lluvia_flechas') {
        let d = Math.max(combatFormulas.minDamage, Math.floor(pAtk * combatFormulas.lluviaFlechasMultiplier) - Math.floor(effDef / combatFormulas.lluviaFlechasDefDivider)); dmgDealt = d * combatFormulas.lluviaFlechasHits; enemy.hp -= dmgDealt;
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ffeb3b', 'combat-enemy');
        logCombat(`🌧️ Lluvia de Flechas: 4 impactos para <b style="color:#ffeb3b">${dmgDealt}</b> de daño.`);
    }
    else if (skillId === 'flecha_venenosa') {
        dmgDealt = Math.max(combatFormulas.minDamage, pAtk * combatFormulas.flechaVenenosaMultiplier - effDef); enemy.hp -= dmgDealt; gameState.combatState.poisonTurns = combatFormulas.flechaVenenosaTurns; 
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#4caf50', 'combat-enemy');
        logCombat(`🐍 Veneno: <b style="color:#ffeb3b">${dmgDealt}</b> daño y envenena (4 turnos).`);
    }
    else if (skillId === 'trampa_espinas') {
        dmgDealt = Math.max(combatFormulas.minDamage, Math.floor(pAtk * combatFormulas.trampaEspinasMultiplier) - effDef); enemy.hp -= dmgDealt; gameState.combatState.poisonTurns = combatFormulas.trampaEspinasTurns; 
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#4caf50', 'combat-enemy');
        logCombat(`🕸️ Trampa Letal: <b style="color:#ffeb3b">${dmgDealt}</b> daño y veneno grave (6 turnos).`);
    }
    else if (skillId === 'fuego') {
        dmgDealt = Math.max(combatFormulas.minDamage, Math.floor(pMag * combatFormulas.fuegoMultiplier) - effMr); enemy.hp -= dmgDealt;
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ff9800', 'combat-enemy');
        logCombat(`🔥 Fuego: <b style="color:#ff9800">${dmgDealt}</b> de daño mágico.`);
    }
    else if (skillId === 'meteorito') {
        dmgDealt = Math.max(combatFormulas.minDamage, Math.floor(pMag * combatFormulas.meteoritoMultiplier) - effMr); enemy.hp -= dmgDealt;
        playSFX(sfx.attack); animateDamage('modalImg'); spawnFloatingText('-' + dmgDealt, '#ff9800', 'combat-enemy');
        logCombat(`☄️ METEORITO: <b style="color:#ff9800">${dmgDealt}</b> daño mágico destructivo.`);
    }
    else if (skillId === 'curar') {
        const heal = Math.floor(pMag * combatFormulas.curarMultiplier) + combatFormulas.curarBonus; gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.use_potion); animateHeal('combatPlayerImg'); spawnFloatingText('+' + heal, '#4caf50', 'combat-player');
        logCombat(`💚 Te curaste <b style="color:#4caf50">${heal}</b> de Vida.`);
    }
    else if (skillId === 'drenar_vida') {
        dmgDealt = Math.max(combatFormulas.minDamage, Math.floor(pMag * combatFormulas.drenarVidaMultiplier) - effMr); enemy.hp -= dmgDealt;
        const heal = Math.floor(dmgDealt * combatFormulas.drenarVidaHealPercent); gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.attack); animateDamage('modalImg'); animateHeal('combatPlayerImg');
        spawnFloatingText('-' + dmgDealt, '#ff9800', 'combat-enemy'); spawnFloatingText('+' + heal, '#4caf50', 'combat-player');
        logCombat(`🦇 Drenar Vida: Robas <b style="color:#ff9800">${dmgDealt}</b> de vida y te curas <b style="color:#4caf50">${heal}</b>.`);
    }

    // OMNIVAMP (Cura extra universal por habilidades)
    let omni = gameState.player.baseOmnivamp || 0;
    if (omni > 0 && dmgDealt > 0) {
        let extraHeal = Math.floor(dmgDealt * combatFormulas.omnivampHealPercent * omni);
        if(extraHeal > 0) {
            gameState.player.hp = Math.min(maxHp, gameState.player.hp + extraHeal);
            spawnFloatingText('+' + extraHeal, '#4caf50', 'combat-player');
        }
    }

    checkEnemyDeathAndEndTurn(enemy);
}

export function doFlee() { 
    ensurePlayer();
    if (gameState.player.ep < 10) { playSFX(sfx.error); logMsg("¡Necesitas 10 EP para huir!"); return; }
    gameState.player.ep -= 10; playSFX(sfx.ui_click); logMsg("¡Huiste usando 10 EP!"); 
    spawnFloatingText('-10 EP', '#9c27b0', 'combat-player');
    gameState.player.x = gameState.lastPlayerPos.x; gameState.player.y = gameState.lastPlayerPos.y; 
    endCombat(); 
}
// =========================================
// TURNO DEL ENEMIGO (DAÑO MITIGADO POR MR Y ARMOR)
// =========================================
export function processEnemyTurn(enemy) {
    enemy = ensureEnemy(enemy);
    ensurePlayer();
    try {
        if (!gameState.inCombat || !gameState.currentEnemyTile) return; 

        if (gameState.combatState.poisonTurns > 0) {
            let poisonDmg = Math.max(combatFormulas.minPoisonDamage, Math.floor((enemy.maxHp || enemy.hp) * combatFormulas.poisonDamagePercent));
            enemy.hp -= poisonDmg; gameState.combatState.poisonTurns--;
            animateDamage('modalImg'); spawnFloatingText('-' + poisonDmg, '#4caf50', 'combat-enemy');
            logCombat(`🤢 El veneno drena <b style="color:#4caf50">${poisonDmg}</b> HP. (${gameState.combatState.poisonTurns} rest)`);
            updateCombatUI();
            if (enemy.hp <= 0) { setTimeout(() => { logCombat(`🏆 ¡Enemigo sucumbió al veneno!`); setTimeout(resolveVictory, 500); }, 200); return; }
        }

        let eDmg = 0; let enemyMag = enemy.mag || 0; let isMagic = (enemyMag > 0 && Math.random() < 0.4); 
        if (enemy.isBoss) playSFX(sfx.boss_attack);

        let minDmg = Math.max(combatFormulas.minDamage, Math.floor(enemy.atk * combatFormulas.enemyMinDamagePercent));
        
        let playerArmor = getDef();
        let playerMR = getMr();

        if (gameState.combatState.defBuffTurns > 0) {
            playerArmor = Math.floor(playerArmor * combatFormulas.defBuffMultiplier) + combatFormulas.defBuffBonus; // Escudo aumenta armadura
            gameState.combatState.defBuffTurns--;
            logCombat(`🛡️ Armadura extra activa. (${gameState.combatState.defBuffTurns} rest)`);
        }

        if (isMagic) {
            // El enemigo ataca con magia, mitigado por tu Resistencia Mágica (MR)
            eDmg = Math.max(minDmg, Math.floor((enemyMag * combatFormulas.enemyMagicMultiplier) - playerMR));
            logCombat(`🔮 ¡Magia oscura! Recibes <b style="color:#f44336">${eDmg}</b> de daño.`);
        } else {
            // El enemigo ataca con físico, mitigado por tu Armadura
            eDmg = Math.max(minDmg, enemy.atk - playerArmor);
            if (enemy.isBoss && enemy.trait === 'crit' && Math.random() < combatFormulas.enemyCritChance) { 
                eDmg = Math.floor(eDmg * combatFormulas.enemyCritMultiplier); logCombat(`⚡ <b style="color:#ffeb3b">¡CRÍTICO ENEMIGO!</b>`); 
            }
            logCombat(`💥 Recibes <b style="color:#f44336">${eDmg}</b> de daño físico.`);
        }

        gameState.player.hp -= eDmg;
        if (eDmg > 0) {
            playSFX(sfx.hurt); animateDamage('combatPlayerImg'); 
            spawnFloatingText('-' + eDmg, '#f44336', 'combat-player');
        }

        if (enemy.isBoss && enemy.trait === 'vampire' && eDmg > 0) {
            let heal = Math.floor(eDmg * combatFormulas.vampireHealPercent); enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg'); spawnFloatingText('+' + heal, '#4caf50', 'combat-enemy');
            logCombat(`🦇 El jefe se cura <b style="color:#4caf50">${heal}</b> HP.`);
        }
        if (enemy.isBoss && enemy.trait === 'regen') {
            let heal = Math.max(combatFormulas.minRegenHeal, Math.floor((enemy.maxHp || enemy.hp) * combatFormulas.regenHealPercent));
            enemy.hp = Math.min(enemy.maxHp || enemy.hp, enemy.hp + heal);
            animateHeal('modalImg'); spawnFloatingText('+' + heal, '#4caf50', 'combat-enemy');
            logCombat(`✨ Regenera <b style="color:#4caf50">${heal}</b> HP.`);
        }

        updateCombatUI(); updateHUD();
    } catch (e) { 
        console.error("Error turno enemigo:", e); logCombat("<b style='color:red'>⚠️ Error de sistema.</b>");
    } finally { 
        setTimeout(() => { lockCombatButtons(false); if (gameState.player.hp <= 0) { showDeathScreen(); } }, 350); 
    }
}

// =========================================
// SISTEMA DE CHECKPOINTS Y MUERTE
// =========================================
export function saveCheckpoint(type) {
    const snapshot = { player: JSON.parse(JSON.stringify(gameState.player)), worldMap: JSON.parse(JSON.stringify(gameState.worldMap)), flags: JSON.parse(JSON.stringify(gameState.flags)), quest: JSON.parse(JSON.stringify(gameState.quest)), mapLevel: gameState.mapLevel };
    if (type === 'level') gameState.checkpoints.lastLevelUp = snapshot;
    if (type === 'boss') gameState.checkpoints.lastBoss = snapshot;
}

export function showDeathScreen() {
    document.getElementById('deathModal').style.display = 'flex';
    document.getElementById('btnReviveLevel').style.display = (gameState.checkpoints && gameState.checkpoints.lastLevelUp) ? 'block' : 'none';
    document.getElementById('btnReviveBoss').style.display = (gameState.checkpoints && gameState.checkpoints.lastBoss) ? 'block' : 'none';
}

export function reviveAt(type) {
    playSFX(sfx.ui_click);
    let snap = type === 'level' ? gameState.checkpoints.lastLevelUp : gameState.checkpoints.lastBoss;
    if (!snap) return; 
    gameState.player = JSON.parse(JSON.stringify(snap.player)); gameState.worldMap = JSON.parse(JSON.stringify(snap.worldMap)); gameState.flags = JSON.parse(JSON.stringify(snap.flags)); gameState.quest = JSON.parse(JSON.stringify(snap.quest)); gameState.mapLevel = snap.mapLevel;
    gameState.player.hp = getMaxHp(); gameState.player.mp = getMaxMp(); gameState.player.ep = getMaxEp();
    document.getElementById('deathModal').style.display = 'none'; endCombat();
    logMsg(`✨ Una fuerza misteriosa te ha devuelto en el tiempo.`); saveGame();
}

// =========================================
// SISTEMA DE NIVEL Y ESTADÍSTICAS
// =========================================
let tempStats = { hp: 0, mp: 0, ep: 0, atk: 0, mag: 0, def: 0 };
let pointsToSpend = 0;

export function checkLevelUp() {
    const xpNeeded = (gameState.player.level || 1) * 15;
    if (gameState.player.xp >= xpNeeded) {
        gameState.player.xp -= xpNeeded; gameState.player.level++; gameState.player.statPoints += 5; 
        if(gameState.player.skillPoints === undefined) gameState.player.skillPoints = 0;
        gameState.player.skillPoints += 1;
        playSFX(sfx.level_up); spawnFloatingText('¡NIVEL UP!', '#ffeb3b', gameState.inCombat ? 'combat-player' : 'map');
        logMsg(`¡NIVEL ${gameState.player.level}! Tienes puntos para repartir.`);
        checkLevelUp(); 
    } else if (gameState.player.statPoints > 0 && !gameState.inCombat) {
        openLevelUpModal();
    }
}

export function openLevelUpModal() {
    tempStats = { hp: 0, mp: 0, ep: 0, atk: 0, mag: 0, def: 0 };
    pointsToSpend = gameState.player.statPoints; updateLevelUpUI();
    document.getElementById('levelUpModal').style.display = 'flex';
}

export function updateLevelUpUI() {
    document.getElementById('statPointsDisplay').textContent = pointsToSpend;
    document.getElementById('lvlHpVal').textContent = tempStats.hp; document.getElementById('lvlMpVal').textContent = tempStats.mp; document.getElementById('lvlEpVal').textContent = tempStats.ep;
    document.getElementById('lvlAtkVal').textContent = tempStats.atk; document.getElementById('lvlMagVal').textContent = tempStats.mag; document.getElementById('lvlDefVal').textContent = tempStats.def;
    const btnConfirm = document.getElementById('btnConfirmStats');
    if (pointsToSpend === 0) { btnConfirm.style.opacity = '1'; btnConfirm.style.pointerEvents = 'auto'; } 
    else { btnConfirm.style.opacity = '0.5'; btnConfirm.style.pointerEvents = 'none'; }
}

export function allocateStat(stat) { if (pointsToSpend > 0) { playSFX(sfx.ui_click); tempStats[stat]++; pointsToSpend--; updateLevelUpUI(); } else { playSFX(sfx.error); } }

export function confirmLevelUp() {
    playSFX(sfx.quest_complete);
    gameState.player.baseMaxHp += tempStats.hp * 5; gameState.player.hp += tempStats.hp * 5; 
    gameState.player.baseMaxMp += tempStats.mp * 5; gameState.player.mp += tempStats.mp * 5;
    gameState.player.baseMaxEp += tempStats.ep * 5; gameState.player.ep += tempStats.ep * 5;
    
    // Subir estadísticas MOBA
    gameState.player.baseAd += tempStats.atk;
    gameState.player.baseAp += tempStats.mag;
    gameState.player.baseArmor += tempStats.def;

    gameState.player.statPoints = 0; 
    document.getElementById('levelUpModal').style.display = 'none';
    logMsg(`Estadísticas aumentadas exitosamente.`);
    saveCheckpoint('level'); updateHUD(); saveGame();
}

// =========================================
// RESULTADOS Y RECOMPENSAS
// =========================================
export function resolveVictory() {
    try {
        let enemy = ensureEnemy(gameState.currentEnemyTile && gameState.currentEnemyTile.enemy);
        ensurePlayer();
        
        if (enemy.isBoss && enemy.zone === 5) { 
            gameState.mapLevel++;
            alert(`¡HAS DERROTADO AL DRAGÓN DORADO!\nAvanzas al Mapa Nivel ${gameState.mapLevel}.`);
            gameState.quest = null; gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0]; gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
            gameState.player.hp = getMaxHp(); gameState.player.mp = getMaxMp(); gameState.player.ep = getMaxEp();
            endCombat(); generateWorld(true); saveCheckpoint('boss'); checkLevelUp(); saveGame(); return;
        }
        
        if (enemy.isBoss) { playSFX(sfx.boss_die); gameState.flags['boss' + enemy.zone] = true; logMsg(`¡Has derrotado al Jefe!`); saveCheckpoint('boss'); } 
        else { playSFX(sfx.enemy_die); logMsg(`¡${enemy.name} cayó! +${enemy.gold} Oro, +${enemy.xp} XP`); }

        gameState.player.gold += enemy.gold; gameState.player.xp += enemy.xp;
        
        let dropChance = enemy.isBoss ? 1.0 : 0.25; 
        if (Math.random() < dropChance) {
            const currentShop = mapData[gameState.currentEnemyTile.zone].shop; 
            const isWeapon = Math.random() < 0.5;
            const pool = isWeapon ? currentShop.weapons : currentShop.armors;
            const droppedItem = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
            
            let scaleFactor = getMapScale();
            if(isWeapon) {
                if(droppedItem.ad) droppedItem.ad = Math.floor(droppedItem.ad * scaleFactor);
                if(droppedItem.ap) droppedItem.ap = Math.floor(droppedItem.ap * scaleFactor);
                if(droppedItem.lethality) droppedItem.lethality = Math.floor(droppedItem.lethality * scaleFactor);
            } else {
                if(droppedItem.armor) droppedItem.armor = Math.floor(droppedItem.armor * scaleFactor);
                if(droppedItem.mr) droppedItem.mr = Math.floor(droppedItem.mr * scaleFactor);
                if(droppedItem.hpBonus) droppedItem.hpBonus = Math.floor(droppedItem.hpBonus * scaleFactor);
                if(droppedItem.mpBonus) droppedItem.mpBonus = Math.floor(droppedItem.mpBonus * scaleFactor);
            }
            droppedItem.price = Math.floor((droppedItem.price || 15) * scaleFactor);
            droppedItem.name = droppedItem.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');

            logMsg(`🎁 ¡Encontraste: ${droppedItem.name}! Se ha guardado en tu Mochila.`);
            playSFX(sfx.quest_complete); 
            if (isWeapon) gameState.player.inventory.weapons.push(droppedItem); else gameState.player.inventory.armors.push(droppedItem);
        }

        if (gameState.quest) {
            if (gameState.quest.type === 'kill_enemy' && enemy.name === gameState.quest.target && !enemy.isBoss) gameState.quest.progress++;
            if (gameState.quest.type === 'kill_boss' && enemy.name.replace(` (Lv.${gameState.mapLevel})`, '') === gameState.quest.target) gameState.quest.progress++;
            if (gameState.quest.type === 'collect_gold') gameState.quest.progress += enemy.gold;
            
            // actualizar HUD tras avanzar
            updateHUD();
            
            if (gameState.quest.progress >= gameState.quest.goal) { 
                playSFX(sfx.quest_complete); logMsg(`¡Misión completada!`); 
                if (gameState.quest.rewardType === 'gold') gameState.player.gold += gameState.quest.rewardAmount; 
                if (gameState.quest.rewardType === 'xp') gameState.player.xp += gameState.quest.rewardAmount; 
                if (gameState.quest.rewardType === 'potion') gameState.player.potions += gameState.quest.rewardAmount; 
                
                if (gameState.quest.type === 'kill_boss') {
                    if (!gameState.player.hasKey) gameState.player.hasKey = {};
                    gameState.player.hasKey[gameState.quest.zone] = true;
                    logMsg(`🔑 ¡Has obtenido la Llave del Jefe!`);
                    spawnFloatingText('+ Llave', '#ffeb3b', 'map');
                }
                
                if (!gameState.player.zoneQuestProgress) gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
                gameState.player.zoneQuestProgress[gameState.quest.zone]++;
                gameState.quest = null; 
                updateHUD();
            }
        }
        
        gameState.currentEnemyTile.enemy = null; endCombat(); checkLevelUp(); saveGame();
    } catch (error) { console.error("Falló la victoria.", error); endCombat(); }
}

window.doAttack = doAttack; window.useSkill = useSkill; window.doFlee = doFlee;
window.allocateStat = allocateStat; window.confirmLevelUp = confirmLevelUp; window.reviveAt = reviveAt;
