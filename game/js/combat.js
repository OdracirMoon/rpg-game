// =========================================
// SISTEMA DE COMBATE Y HABILIDADES
// =========================================
import { gameState } from './state.js';
import { mapData, skillsData } from './data.js';
import { sfx, playSFX, playBGM } from './audio.js';
import { 
    getAtk, getDef, getMag, getMaxHp, getMaxMp, getMaxEp, 
    getHpColor, getMapScale, logMsg, logCombat, spawnFloatingText, updateHUD 
} from './ui.js';
import { render, generateWorld } from './map.js';
import { saveGame } from './main.js';

// =========================================
// INTERFAZ DE COMBATE
// =========================================
export function generateCombatButtons() {
    const container = document.getElementById('combatActions');
    let html = ''; 

    // Botón 1: Ataque Fijo
    html += `<button id="btnAttack" onclick="doAttack()" style="font-size: 16px; padding: 12px;"><img src="img/weapons/iron_dagger.png" class="icon"> Atacar</button>`;

    // Botón 2: Habilidad Especial (Dinámica)
    const specialId = gameState.player.equippedSkills.special;
    if (specialId && skillsData[specialId]) {
        const skill = skillsData[specialId];
        const resText = skill.resource.toUpperCase();
        const cssClass = skill.resource === 'mp' ? 'btn-magic' : 'btn-skill';
        html += `<button id="btnSkill1" class="${cssClass}" onclick="useSkill('${skill.id}')" style="font-size: 16px; padding: 12px;">${skill.icon} ${skill.name} (${skill.cost} ${resText})</button>`;
    }

    // Botón 3: Habilidad Defensiva (Dinámica)
    const defId = gameState.player.equippedSkills.defensive;
    if (defId && skillsData[defId]) {
        const skill = skillsData[defId];
        const resText = skill.resource.toUpperCase();
        const cssClass = skill.resource === 'mp' ? 'btn-magic' : 'btn-skill';
        html += `<button id="btnSkill2" class="${cssClass}" onclick="useSkill('${skill.id}')" style="font-size: 16px; padding: 12px;">${skill.icon} ${skill.name} (${skill.cost} ${resText})</button>`;
    }

    // Botón 4: Huir Fijo (Cuesta 10 EP)
    html += `<button id="btnFlee" class="btn-danger" onclick="doFlee()" style="font-size: 16px; padding: 12px;">🏃 Huir (10 EP)</button>`;
    
    container.innerHTML = html;
}

export function lockCombatButtons(lock) {
    const btns = ['btnAttack', 'btnSkill1', 'btnSkill2', 'btnFlee'];
    btns.forEach(id => {
        let btn = document.getElementById(id);
        if(btn) btn.disabled = lock;
    });
}

export function animateDamage(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) {
        imgElement.classList.remove('anim-damage'); 
        void imgElement.offsetWidth; 
        imgElement.classList.add('anim-damage'); 
    }
}

export function animateHeal(elementId) { 
    const imgElement = document.getElementById(elementId); 
    if(imgElement) {
        imgElement.classList.remove('anim-heal'); 
        void imgElement.offsetWidth; 
        imgElement.classList.add('anim-heal'); 
    }
}

export function updateCombatUI() {
    if (!gameState.currentEnemyTile || !gameState.currentEnemyTile.enemy) return;
    let enemy = gameState.currentEnemyTile.enemy;
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
    gameState.combatState.defBuffTurns = 0;
    gameState.combatState.poisonTurns = 0;
    
    generateCombatButtons(); 
    lockCombatButtons(false); 
    gameState.inCombat = true; 
    gameState.currentEnemyTile = tile; 
    let enemy = tile.enemy;
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

    document.getElementById('combatPlayerName').textContent = gameState.player.playerClass || "Héroe";
    document.getElementById('combatPlayerImg').src = gameState.player.combatImg; 
    logCombat(`<div>¡Un <b>${enemy.name}</b> salvaje aparece!</div>`);
    
    updateCombatUI(); render();
}

export function endCombat() { 
    gameState.inCombat = false; gameState.currentEnemyTile = null; 
    document.getElementById('combatModal').style.display = 'none'; lockCombatButtons(false);
    playBGM('field');
    render(); 
}

export function checkEnemyDeathAndEndTurn(enemy) {
    updateCombatUI(); updateHUD();
    if (enemy.hp <= 0) {
        setTimeout(() => { logCombat(`🏆 ¡Enemigo derrotado!`); setTimeout(resolveVictory, 500); }, 200);
    } else {
        setTimeout(() => processEnemyTurn(enemy), 600);
    }
}

// =========================================
// ACCIONES DEL JUGADOR
// =========================================
export function doAttack() {
    lockCombatButtons(true);
    let enemy = gameState.currentEnemyTile.enemy;
    const pDmg = Math.max(1, getAtk() - enemy.def);
    enemy.hp -= pDmg;
    
    playSFX(sfx.attack); animateDamage('modalImg'); 
    spawnFloatingText('-' + pDmg + ' HP', '#fff', 'combat-enemy');
    logCombat(`🗡️ Atacas y haces <b style="color:#ffeb3b">${pDmg}</b> de daño.`);
    
    checkEnemyDeathAndEndTurn(enemy);
}

export function useSkill(skillId) {
    lockCombatButtons(true);
    let enemy = gameState.currentEnemyTile.enemy;
    const pMag = getMag();
    const pAtk = getAtk();
    const maxHp = getMaxHp();
    
    const skillInfo = skillsData[skillId];
    if (!skillInfo) { lockCombatButtons(false); return; }

    if (skillInfo.resource === 'ep') {
        if (gameState.player.ep < skillInfo.cost) { playSFX(sfx.error); logMsg(`¡Faltan ${skillInfo.cost} EP!`); lockCombatButtons(false); return; }
        gameState.player.ep -= skillInfo.cost;
    } else if (skillInfo.resource === 'mp') {
        if (gameState.player.mp < skillInfo.cost) { playSFX(sfx.error); logMsg(`¡Faltan ${skillInfo.cost} MP!`); lockCombatButtons(false); return; }
        gameState.player.mp -= skillInfo.cost;
    }

    // --- GUERRERO ---
    if (skillId === 'golpe_brutal') {
        let dmg = Math.max(1, Math.floor(pAtk * 2) - enemy.def); 
        enemy.hp -= dmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + dmg + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`💥 Golpe Brutal: <b style="color:#ffeb3b">${dmg}</b> de daño físico.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'corte_cruzado') {
        let dmgPerHit = Math.max(1, Math.floor(pAtk * 0.9) - Math.floor(enemy.def/3));
        let totalDmg = dmgPerHit * 3;
        enemy.hp -= totalDmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + totalDmg + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`⚔️ Corte Cruzado: Impactas 3 veces causando <b style="color:#ffeb3b">${totalDmg}</b> de daño.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'grito_guerra') {
        gameState.combatState.defBuffTurns = 3;
        playSFX(sfx.equip); animateHeal('combatPlayerImg');
        logCombat(`🛡️ Grito de Guerra: Tu defensa aumenta considerablemente por 3 turnos.`);
        checkEnemyDeathAndEndTurn(enemy); 
    }
    else if (skillId === 'piel_hierro') {
        gameState.combatState.defBuffTurns = 5; // Más duradero
        let heal = Math.floor(maxHp * 0.15); // Cura un 15% de tu vida máxima
        gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.equip); animateHeal('combatPlayerImg');
        spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-player');
        logCombat(`🗿 Piel de Hierro: Defensa masiva por 5 turnos y te curas <b style="color:#4caf50">${heal}</b> HP.`);
        checkEnemyDeathAndEndTurn(enemy); 
    }

    // --- ARQUERO ---
    else if (skillId === 'tiro_doble') {
        let dmg1 = Math.max(1, Math.floor(pAtk * 0.8) - Math.floor(enemy.def/2));
        let dmg2 = Math.max(1, Math.floor(pAtk * 0.8) - Math.floor(enemy.def/2));
        enemy.hp -= (dmg1 + dmg2);
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + (dmg1 + dmg2) + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`🏹 Tiro Doble: Impactas dos veces haciendo <b style="color:#ffeb3b">${dmg1}</b> y <b style="color:#ffeb3b">${dmg2}</b> de daño.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'lluvia_flechas') {
        let dmgPerHit = Math.max(1, Math.floor(pAtk * 0.6) - Math.floor(enemy.def/4));
        let totalDmg = dmgPerHit * 4;
        enemy.hp -= totalDmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + totalDmg + ' HP', '#ffeb3b', 'combat-enemy');
        logCombat(`🌧️ Lluvia de Flechas: 4 impactos perforantes para <b style="color:#ffeb3b">${totalDmg}</b> de daño.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'flecha_venenosa') {
        let dmg = Math.max(1, pAtk - enemy.def);
        enemy.hp -= dmg;
        gameState.combatState.poisonTurns = 4; 
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + dmg + ' HP', '#4caf50', 'combat-enemy');
        logCombat(`🐍 Flecha Venenosa: <b style="color:#ffeb3b">${dmg}</b> de daño y veneno por 4 turnos.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'trampa_espinas') {
        let dmg = Math.max(1, Math.floor(pAtk * 1.5) - enemy.def);
        enemy.hp -= dmg;
        gameState.combatState.poisonTurns = 6; // Veneno que dura mucho más
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + dmg + ' HP', '#4caf50', 'combat-enemy');
        logCombat(`🕸️ Trampa Letal: <b style="color:#ffeb3b">${dmg}</b> daño inicial y un veneno duradero (6 turnos).`);
        checkEnemyDeathAndEndTurn(enemy);
    }

    // --- MAGO ---
    else if (skillId === 'fuego') {
        const mDmg = Math.max(1, Math.floor(pMag * 1.8) - Math.floor(enemy.def / 2));
        enemy.hp -= mDmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + mDmg + ' HP', '#ff9800', 'combat-enemy');
        logCombat(`🔥 Fuego: <b style="color:#ff9800">${mDmg}</b> de daño mágico.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'meteorito') {
        const mDmg = Math.max(1, Math.floor(pMag * 3.5) - Math.floor(enemy.def / 2));
        enemy.hp -= mDmg;
        playSFX(sfx.attack); animateDamage('modalImg');
        spawnFloatingText('-' + mDmg + ' HP', '#ff9800', 'combat-enemy');
        logCombat(`☄️ ¡METEORITO!: Devastas al enemigo con <b style="color:#ff9800">${mDmg}</b> de daño mágico masivo.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'curar') {
        const heal = Math.floor(pMag * 2.5) + 10; 
        gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.use_potion); animateHeal('combatPlayerImg');
        spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-player');
        logCombat(`💚 Te curaste <b style="color:#4caf50">${heal}</b> de Vida.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
    else if (skillId === 'drenar_vida') {
        const mDmg = Math.max(1, Math.floor(pMag * 1.5) - Math.floor(enemy.def / 2));
        enemy.hp -= mDmg;
        const heal = Math.floor(mDmg * 0.8); // Te curas un 80% del daño hecho
        gameState.player.hp = Math.min(maxHp, gameState.player.hp + heal);
        playSFX(sfx.attack); animateDamage('modalImg'); animateHeal('combatPlayerImg');
        spawnFloatingText('-' + mDmg + ' HP', '#ff9800', 'combat-enemy');
        spawnFloatingText('+' + heal + ' HP', '#4caf50', 'combat-player');
        logCombat(`🦇 Drenar Vida: Robas <b style="color:#ff9800">${mDmg}</b> de vida y te curas <b style="color:#4caf50">${heal}</b>.`);
        checkEnemyDeathAndEndTurn(enemy);
    }
}

export function doFlee() { 
    if (gameState.player.ep < 10) {
        playSFX(sfx.error);
        logMsg("¡Estás exhausto! Necesitas 10 EP para huir.");
        return;
    }
    gameState.player.ep -= 10;
    
    playSFX(sfx.ui_click); 
    logMsg("¡Huiste usando 10 EP!"); 
    spawnFloatingText('-10 EP', '#9c27b0', 'combat-player');
    
    gameState.player.x = gameState.lastPlayerPos.x; 
    gameState.player.y = gameState.lastPlayerPos.y; 
    endCombat(); 
}

// =========================================
// TURNO DEL ENEMIGO Y MUERTE
// =========================================
export function processEnemyTurn(enemy) {
    try {
        if (!gameState.inCombat || !gameState.currentEnemyTile) return; 

        if (gameState.combatState.poisonTurns > 0) {
            let poisonDmg = Math.max(2, Math.floor((enemy.maxHp || enemy.hp) * 0.05));
            enemy.hp -= poisonDmg;
            gameState.combatState.poisonTurns--;
            animateDamage('modalImg');
            spawnFloatingText('-' + poisonDmg + ' HP', '#4caf50', 'combat-enemy');
            logCombat(`🤢 El veneno drena <b style="color:#4caf50">${poisonDmg}</b> HP al enemigo. (${gameState.combatState.poisonTurns} turnos rest.)`);
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
        if (gameState.combatState.defBuffTurns > 0) {
            playerCurrentDef = Math.floor(playerCurrentDef * 1.5) + 5; 
            gameState.combatState.defBuffTurns--;
            logCombat(`🛡️ Tienes escudo activo. (${gameState.combatState.defBuffTurns} turnos rest.)`);
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

        gameState.player.hp -= eDmg;
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
            if (gameState.player.hp <= 0) { 
                showDeathScreen(); 
            } 
        }, 350); 
    }
}

// =========================================
// SISTEMA DE CHECKPOINTS
// =========================================
export function saveCheckpoint(type) {
    const snapshot = {
        player: JSON.parse(JSON.stringify(gameState.player)),
        worldMap: JSON.parse(JSON.stringify(gameState.worldMap)),
        flags: JSON.parse(JSON.stringify(gameState.flags)),
        quest: JSON.parse(JSON.stringify(gameState.quest)),
        mapLevel: gameState.mapLevel
    };
    
    if (type === 'level') gameState.checkpoints.lastLevelUp = snapshot;
    if (type === 'boss') gameState.checkpoints.lastBoss = snapshot;
}

export function showDeathScreen() {
    document.getElementById('deathModal').style.display = 'flex';
    
    const btnLevel = document.getElementById('btnReviveLevel');
    const btnBoss = document.getElementById('btnReviveBoss');
    
    if (gameState.checkpoints && gameState.checkpoints.lastLevelUp) {
        btnLevel.style.display = 'block';
    } else {
        btnLevel.style.display = 'none';
    }
    
    if (gameState.checkpoints && gameState.checkpoints.lastBoss) {
        btnBoss.style.display = 'block';
    } else {
        btnBoss.style.display = 'none';
    }
}

export function reviveAt(type) {
    playSFX(sfx.ui_click);
    let snap = type === 'level' ? gameState.checkpoints.lastLevelUp : gameState.checkpoints.lastBoss;
    if (!snap) return; 
    
    gameState.player = JSON.parse(JSON.stringify(snap.player));
    gameState.worldMap = JSON.parse(JSON.stringify(snap.worldMap));
    gameState.flags = JSON.parse(JSON.stringify(snap.flags));
    gameState.quest = JSON.parse(JSON.stringify(snap.quest));
    gameState.mapLevel = snap.mapLevel;
    
    gameState.player.hp = getMaxHp();
    gameState.player.mp = getMaxMp();
    gameState.player.ep = getMaxEp();
    
    document.getElementById('deathModal').style.display = 'none';
    endCombat();
    
    logMsg(`✨ Una fuerza misteriosa te ha devuelto en el tiempo.`);
    saveGame();
}

// =========================================
// SISTEMA DE NIVEL Y ESTADÍSTICAS
// =========================================
let tempStats = { hp: 0, mp: 0, ep: 0, atk: 0, mag: 0, def: 0 };
let pointsToSpend = 0;

export function checkLevelUp() {
    const xpNeeded = gameState.player.level * 15;
    if (gameState.player.xp >= xpNeeded) {
        gameState.player.xp -= xpNeeded; 
        gameState.player.level++; 
        gameState.player.statPoints += 5; 
        
        // NUEVO: Sumamos +1 al SP
        if(gameState.player.skillPoints === undefined) gameState.player.skillPoints = 0;
        gameState.player.skillPoints += 1;
        
        playSFX(sfx.level_up);
        spawnFloatingText('¡NIVEL UP!', '#ffeb3b', gameState.inCombat ? 'combat-player' : 'map');
        logMsg(`¡NIVEL ${gameState.player.level}! Tienes puntos para repartir.`);
        
        checkLevelUp(); 
    } else if (gameState.player.statPoints > 0 && !gameState.inCombat) {
        openLevelUpModal();
    }
}

export function openLevelUpModal() {
    tempStats = { hp: 0, mp: 0, ep: 0, atk: 0, mag: 0, def: 0 };
    pointsToSpend = gameState.player.statPoints;
    updateLevelUpUI();
    document.getElementById('levelUpModal').style.display = 'flex';
}

export function updateLevelUpUI() {
    document.getElementById('statPointsDisplay').textContent = pointsToSpend;
    document.getElementById('lvlHpVal').textContent = tempStats.hp;
    document.getElementById('lvlMpVal').textContent = tempStats.mp;
    document.getElementById('lvlEpVal').textContent = tempStats.ep;
    document.getElementById('lvlAtkVal').textContent = tempStats.atk;
    document.getElementById('lvlMagVal').textContent = tempStats.mag;
    document.getElementById('lvlDefVal').textContent = tempStats.def;

    const btnConfirm = document.getElementById('btnConfirmStats');
    if (pointsToSpend === 0) {
        btnConfirm.style.opacity = '1';
        btnConfirm.style.pointerEvents = 'auto';
    } else {
        btnConfirm.style.opacity = '0.5';
        btnConfirm.style.pointerEvents = 'none';
    }
}

export function allocateStat(stat) {
    if (pointsToSpend > 0) {
        playSFX(sfx.ui_click);
        tempStats[stat]++;
        pointsToSpend--;
        updateLevelUpUI();
    } else {
        playSFX(sfx.error); 
    }
}

export function confirmLevelUp() {
    playSFX(sfx.quest_complete);
    
    gameState.player.baseMaxHp += tempStats.hp * 5;
    gameState.player.hp += tempStats.hp * 5; 
    
    gameState.player.baseMaxMp += tempStats.mp * 5;
    gameState.player.mp += tempStats.mp * 5;

    gameState.player.baseMaxEp += tempStats.ep * 5;
    gameState.player.ep += tempStats.ep * 5;

    gameState.player.baseAtk += tempStats.atk;
    gameState.player.baseMag += tempStats.mag;
    gameState.player.baseDef += tempStats.def;

    gameState.player.statPoints = 0; 
    
    document.getElementById('levelUpModal').style.display = 'none';
    logMsg(`Estadísticas aumentadas exitosamente. ¡Eres más fuerte!`);
    
    saveCheckpoint('level');
    
    updateHUD();
    saveGame();
}

// =========================================
// RESULTADOS Y RECOMPENSAS
// =========================================
export function resolveVictory() {
    try {
        let enemy = gameState.currentEnemyTile.enemy;
        
        if (enemy.isBoss && enemy.zone === 5) { 
            gameState.mapLevel++;
            alert(`¡HAS DERROTADO AL DRAGÓN DORADO!\n\nTu poder ha resonado en el mundo. Avanzas al Mapa Nivel ${gameState.mapLevel}. Los enemigos y botines serán más poderosos.`);
            
            gameState.quest = null;
            gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
            gameState.player.hasKey = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false };
            gameState.player.hp = getMaxHp();
            gameState.player.mp = getMaxMp();
            gameState.player.ep = getMaxEp();
            
            endCombat();
            generateWorld();
            
            saveCheckpoint('boss');
            
            checkLevelUp(); 
            saveGame();
            return;
        }
        
        if (enemy.isBoss) {
            playSFX(sfx.boss_die);
            gameState.flags['boss' + enemy.zone] = true; 
            logMsg(`¡Has derrotado al Jefe!`);
            
            saveCheckpoint('boss');
        } else {
            playSFX(sfx.enemy_die);
            logMsg(`¡${enemy.name} cayó! +${enemy.gold} Oro, +${enemy.xp} XP`);
        }

        gameState.player.gold += enemy.gold; gameState.player.xp += enemy.xp;
        
        let dropChance = enemy.isBoss ? 1.0 : 0.25; 
        if (Math.random() < dropChance) {
            const currentShop = mapData[gameState.currentEnemyTile.zone].shop; 
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
            droppedItem.name = droppedItem.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');

            logMsg(`🎁 ¡Encontraste: ${droppedItem.name}! Se ha guardado en tu Mochila.`);
            playSFX(sfx.quest_complete); 
            if (isWeapon) gameState.player.inventory.weapons.push(droppedItem); else gameState.player.inventory.armors.push(droppedItem);
        }

        if (gameState.quest) {
            if (gameState.quest.type === 'kill_enemy' && enemy.name === gameState.quest.target && !enemy.isBoss) gameState.quest.progress++;
            if (gameState.quest.type === 'kill_boss' && enemy.name.replace(` (Lv.${gameState.mapLevel})`, '') === gameState.quest.target) gameState.quest.progress++;
            if (gameState.quest.type === 'collect_gold') gameState.quest.progress += enemy.gold;
            
            if (gameState.quest.progress >= gameState.quest.goal) { 
                playSFX(sfx.quest_complete); logMsg(`¡Misión completada!`); 
                if (gameState.quest.rewardType === 'gold') gameState.player.gold += gameState.quest.rewardAmount; 
                if (gameState.quest.rewardType === 'xp') gameState.player.xp += gameState.quest.rewardAmount; 
                if (gameState.quest.rewardType === 'potion') gameState.player.potions += gameState.quest.rewardAmount; 
                
                if (gameState.quest.type === 'kill_boss') {
                    if (!gameState.player.hasKey) gameState.player.hasKey = {};
                    gameState.player.hasKey[gameState.quest.zone] = true;
                    logMsg(`🔑 ¡Has obtenido la Llave del Jefe! La puerta se ha abierto.`);
                    spawnFloatingText('+ Llave', '#ffeb3b', 'map');
                } else {
                    logMsg(`Vuelve a buscar un NPC para la siguiente tarea.`);
                }
                
                if (!gameState.player.zoneQuestProgress) gameState.player.zoneQuestProgress = [0, 0, 0, 0, 0, 0];
                gameState.player.zoneQuestProgress[gameState.quest.zone]++;
                gameState.quest = null; 
            }
        }
        
        gameState.currentEnemyTile.enemy = null; 
        endCombat(); 
        checkLevelUp();
        saveGame();
        
    } catch (error) { console.error("Falló la victoria.", error); endCombat(); }
}

// Conectar con el HTML
window.doAttack = doAttack;
window.useSkill = useSkill;
window.doFlee = doFlee;
window.allocateStat = allocateStat;
window.confirmLevelUp = confirmLevelUp;
window.reviveAt = reviveAt;