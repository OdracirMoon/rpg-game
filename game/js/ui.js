// =========================================
// INTERFAZ DE USUARIO (HUD, Menús, Tienda, Inventario)
// =========================================
import { gameState } from './state.js';
import { mapData } from './data.js';
import { sfx, playSFX } from './audio.js';
// Importamos saveGame desde main.js (lo crearemos al final) para guardar tras acciones
import { saveGame } from './main.js';

export let isMenuOpen = false;
export let pendingQuest = null;

// =========================================
// UTILIDADES Y CÁLCULOS BASE
// =========================================
export function getMapScale() { return 1 + ((gameState.mapLevel - 1) * 0.5); }
export function getMaxHp() { return gameState.player.baseMaxHp + (gameState.player.armor ? gameState.player.armor.hpBonus : 0); }
export function getMaxMp() { return gameState.player.baseMaxMp + (gameState.player.armor ? gameState.player.armor.mpBonus : 0); }
export function getMaxEp() { return gameState.player.baseMaxEp; }
export function getAtk() { return gameState.player.baseAtk + (gameState.player.weapon ? gameState.player.weapon.atk : 0); }
export function getDef() { return gameState.player.baseDef + (gameState.player.armor ? gameState.player.armor.def : 0); }
export function getMag() { return gameState.player.baseMag + (gameState.player.weapon ? gameState.player.weapon.mag : 0); }
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
        const tAtk = getAtk(); const tDef = getDef(); const tMag = getMag();
        
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

        document.getElementById('playerClassName').textContent = gameState.player.playerClass || "Héroe";
        document.getElementById('playerLevel').textContent = `(Lv. ${gameState.player.level})`;

        let statsEl = document.getElementById('menuStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <b>Ataque Fís:</b> ${tAtk} <span class="stat-bonus">${gameState.player.weapon && gameState.player.weapon.atk > 0 ? '(+'+gameState.player.weapon.atk+')' : ''}</span><br>
                <b>Poder Mág:</b> ${tMag} <span class="stat-magic">${gameState.player.weapon && gameState.player.weapon.mag > 0 ? '(+'+gameState.player.weapon.mag+')' : ''}</span><br>
                <b>Defensa:</b> ${tDef} <span class="stat-bonus">${gameState.player.armor && gameState.player.armor.def > 0 ? '(+'+gameState.player.armor.def+')' : ''}</span><br>
                <b>XP:</b> ⭐${gameState.player.xp}/${gameState.player.level * 15} | <b>Oro:</b> <img src="img/items/coin.png" class="icon"> ${gameState.player.gold}
            `;
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
// PANELES Y VENTANAS
// =========================================
export function toggleMainMenu() {
    if (gameState.inCombat || document.getElementById('classModal').style.display === 'flex') return;
    
    isMenuOpen = !isMenuOpen;
    playSFX(sfx.ui_click);
    
    document.getElementById('invModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'none';
    document.getElementById('npcModal').style.display = 'none';

    document.getElementById('mainMenuModal').style.display = isMenuOpen ? 'flex' : 'none';
}
window.toggleMainMenu = toggleMainMenu;

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
        let statText = gameState.player.weapon.atk > 0 ? `ATK +${gameState.player.weapon.atk}` : `MAG +${gameState.player.weapon.mag}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.weapon.icon}" class="icon"> <span class="${gameState.player.weapon.colorClass}">${gameState.player.weapon.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('weapon')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Arma: Nada equipado</p>`;
    }
    
    if (gameState.player.armor) {
        let statText = gameState.player.armor.mpBonus > 0 ? `DEF +${gameState.player.armor.def} | MANÁ +${gameState.player.armor.mpBonus}` : `DEF +${gameState.player.armor.def} | VIDA +${gameState.player.armor.hpBonus}`;
        htmlEq += `<div class="shop-item"><div><img src="img/weapons/${gameState.player.armor.icon}" class="icon"> <span class="${gameState.player.armor.colorClass}">${gameState.player.armor.name}</span><br><small>${statText}</small></div><button onclick="unequipItem('armor')" class="btn-danger">Desequipar</button></div>`;
    } else {
        htmlEq += `<p style="font-size:12px; color:#aaa; text-align:center; padding:10px;">Armadura: Nada equipado</p>`;
    }
    document.getElementById('invEquipped').innerHTML = htmlEq;

    let htmlBag = '<h4>Armas</h4>';
    if(gameState.player.inventory.weapons.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armas en la mochila.</p>';
    gameState.player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('weapon', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    htmlBag += '<h4>Armaduras</h4>';
    if(gameState.player.inventory.armors.length === 0) htmlBag += '<p style="font-size:12px; color:#aaa; text-align:center;">No tienes armaduras en la mochila.</p>';
    gameState.player.inventory.armors.forEach((a, idx) => {
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        htmlBag += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${statText}</small></div><button onclick="equipFromInv('armor', ${idx})" style="background:var(--accent); color:#000;">Equipar</button></div>`;
    });
    
    document.getElementById('invBag').innerHTML = htmlBag; 
    document.getElementById('invModal').style.display = 'flex';
}

export function closeInventory() { playSFX(sfx.ui_click); document.getElementById('invModal').style.display = 'none'; }

export function unequipItem(type) {
    playSFX(sfx.equip);
    if (type === 'weapon' && gameState.player.weapon) {
        gameState.player.inventory.weapons.push(gameState.player.weapon);
        gameState.player.weapon = null;
        logMsg("Desequipaste tu arma.");
    } else if (type === 'armor' && gameState.player.armor) {
        gameState.player.inventory.armors.push(gameState.player.armor);
        gameState.player.armor = null;
        gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp);
        gameState.player.mp = Math.min(getMaxMp(), gameState.player.mp);
        logMsg("Desequipaste tu armadura.");
    }
    updateHUD(); openInventory(); saveGame();
}

export function equipFromInv(type, idx) {
    playSFX(sfx.equip);
    if (type === 'weapon') {
        const item = gameState.player.inventory.weapons.splice(idx, 1)[0];
        if(gameState.player.weapon) { gameState.player.inventory.weapons.push(gameState.player.weapon); }
        gameState.player.weapon = item;
    } else {
        const item = gameState.player.inventory.armors.splice(idx, 1)[0];
        if(gameState.player.armor) { gameState.player.inventory.armors.push(gameState.player.armor); }
        gameState.player.armor = item; 
        gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + (item.hpBonus || 0));
    }
    updateHUD(); openInventory(); saveGame();
}

export function usePotion() { const max = getMaxHp(); if (gameState.player.potions > 0 && gameState.player.hp < max) { gameState.player.hp = Math.min(max, gameState.player.hp + 25); gameState.player.potions--; playSFX(sfx.use_potion); spawnFloatingText('+25 HP', '#4caf50', gameState.inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Vida (+25 HP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
export function useManaPotion() { const max = getMaxMp(); if (gameState.player.manaPotions > 0 && gameState.player.mp < max) { gameState.player.mp = Math.min(max, gameState.player.mp + 20); gameState.player.manaPotions--; playSFX(sfx.use_potion); spawnFloatingText('+20 MP', '#2196f3', gameState.inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Maná (+20 MP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }
export function useEnergyPotion() { const max = getMaxEp(); if (gameState.player.energyPotions > 0 && gameState.player.ep < max) { gameState.player.ep = Math.min(max, gameState.player.ep + 30); gameState.player.energyPotions--; playSFX(sfx.use_potion); spawnFloatingText('+30 EP', '#9c27b0', gameState.inCombat ? 'combat-player' : 'map'); logMsg("Usaste Poción Energía (+30 EP)"); updateHUD(); saveGame(); } else { playSFX(sfx.error); } }

window.openInventory = openInventory;
window.closeInventory = closeInventory;
window.unequipItem = unequipItem;
window.equipFromInv = equipFromInv;
window.usePotion = usePotion;
window.useManaPotion = useManaPotion;
window.useEnergyPotion = useEnergyPotion;

// =========================================
// TIENDA DEL JUEGO
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
    cd.shop.weapons.forEach(w => { 
        let sAtk = Math.floor(w.atk * scaleFactor);
        let sMag = Math.floor(w.mag * scaleFactor);
        let sPrice = Math.floor(w.price * scaleFactor);
        let sName = w.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        let statText = sAtk > 0 ? `ATK +${sAtk}` : `MAG +${sMag}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${statText}</small></div><button onclick="buyWeapon('${sName}', ${sAtk}, ${sMag}, ${sPrice}, '${cd.colorClass}', '${w.icon}')">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    cd.shop.armors.forEach(a => { 
        let sDef = Math.floor(a.def * scaleFactor);
        let sHpB = Math.floor(a.hpBonus * scaleFactor);
        let sMpB = Math.floor(a.mpBonus * scaleFactor);
        let sPrice = Math.floor(a.price * scaleFactor);
        let sName = a.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');
        let statText = sMpB > 0 ? `DEF +${sDef} | MANÁ +${sMpB}` : `DEF +${sDef} | VIDA +${sHpB}`;
        htmlBuy += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${cd.colorClass}">${sName}</span><br><small>${statText}</small></div><button onclick="buyArmor('${sName}', ${sDef}, ${sHpB}, ${sMpB}, ${sPrice}, '${cd.colorClass}', '${a.icon}')">${sPrice} <img src="img/items/coin.png" class="icon"></button></div>`; 
    });
    document.getElementById('shopContentBuy').innerHTML = htmlBuy; 
    
    renderSellTab(); 
    switchShopTab('buy'); 
    
    document.getElementById('shopModal').style.display = 'flex';
}

export function renderSellTab() {
    let htmlSell = '<h4>Tus Armas</h4>';
    if(gameState.player.inventory.weapons.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    gameState.player.inventory.weapons.forEach((w, idx) => {
        let statText = w.atk > 0 ? `ATK +${w.atk}` : `MAG +${w.mag}`;
        let sellPrice = Math.floor((w.price || 15) / 2); 
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${w.icon}" class="icon"> <span class="${w.colorClass}">${w.name}</span><br><small>${statText}</small></div><button class="btn-success" onclick="sellWeapon(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    
    htmlSell += '<h4>Tus Armaduras</h4>';
    if(gameState.player.inventory.armors.length === 0) htmlSell += '<p style="font-size:12px; color:#aaa; text-align:center;">Mochila vacía.</p>';
    gameState.player.inventory.armors.forEach((a, idx) => {
        let statText = a.mpBonus > 0 ? `DEF +${a.def} | MANÁ +${a.mpBonus}` : `DEF +${a.def} | VIDA +${a.hpBonus}`;
        let sellPrice = Math.floor((a.price || 20) / 2);
        htmlSell += `<div class="shop-item"><div><img src="img/weapons/${a.icon}" class="icon"> <span class="${a.colorClass}">${a.name}</span><br><small>${statText}</small></div><button class="btn-success" onclick="sellArmor(${idx}, ${sellPrice})">+${sellPrice} <img src="img/items/coin.png" class="icon"></button></div>`;
    });
    document.getElementById('shopContentSell').innerHTML = htmlSell;
}

export function switchShopTab(tab) {
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

export function closeShop() { playSFX(sfx.shop_close); document.getElementById('shopModal').style.display = 'none'; }

export function sellWeapon(idx, price) { playSFX(sfx.sell_item); gameState.player.inventory.weapons.splice(idx, 1); gameState.player.gold += price; logMsg(`Vendiste un arma por ${price} oro.`); updateHUD(); renderSellTab(); saveGame(); }
export function sellArmor(idx, price) { playSFX(sfx.sell_item); gameState.player.inventory.armors.splice(idx, 1); gameState.player.gold += price; logMsg(`Vendiste una armadura por ${price} oro.`); updateHUD(); renderSellTab(); saveGame(); }

export function buyPotion() { let p = Math.floor(20 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.potions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Vida."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
export function buyManaPotion() { let p = Math.floor(25 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.manaPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Maná."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }
export function buyEnergyPotion() { let p = Math.floor(15 * getMapScale()); if (gameState.player.gold >= p) { gameState.player.gold -= p; gameState.player.energyPotions++; playSFX(sfx.buy_item); logMsg("Compraste 1 Poción Energía."); updateHUD(); saveGame(); } else { playSFX(sfx.error); alert("Oro insuficiente."); } }

export function buyWeapon(name, atk, mag, price, colorClass, icon) { 
    if (gameState.player.gold >= price) { 
        gameState.player.gold -= price; 
        gameState.player.inventory.weapons.push({ name, atk, mag, price, colorClass, icon }); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

export function buyArmor(name, def, hpBonus, mpBonus, price, colorClass, icon) { 
    if (gameState.player.gold >= price) { 
        gameState.player.gold -= price; 
        gameState.player.inventory.armors.push({ name, def, hpBonus, mpBonus, price, colorClass, icon }); 
        playSFX(sfx.buy_item); logMsg(`Compraste: ${name}. Revisa tu mochila.`); 
        updateHUD(); renderSellTab(); saveGame(); 
    } else { playSFX(sfx.error); alert("Oro insuficiente."); } 
}

window.switchShopTab = switchShopTab;
window.closeShop = closeShop;
window.sellWeapon = sellWeapon;
window.sellArmor = sellArmor;
window.buyPotion = buyPotion;
window.buyManaPotion = buyManaPotion;
window.buyEnergyPotion = buyEnergyPotion;
window.buyWeapon = buyWeapon;
window.buyArmor = buyArmor;