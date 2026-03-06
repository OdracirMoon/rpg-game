// =========================================
// SISTEMA DE MAPA, GENERACIÓN Y MOVIMIENTO
// =========================================
import { gameState } from './state.js';
import { MAP_W, MAP_H, mapData, npcsData } from './data.js';
import { sfx, playSFX } from './audio.js';
import { 
    isMenuOpen, updateHUD, logMsg, spawnFloatingText, 
    openSpecificNPCModal, openShop, getMapScale, 
    getMaxHp, getMaxMp 
} from './ui.js';
import { startCombat } from './combat.js';
import { saveGame } from './main.js';

// =========================================
// UTILIDADES DEL MAPA
// =========================================
export function getZoneIndex(x, y) {
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

export function drawPathWorld(startX, startY, endX, endY) {
    let x = startX, y = startY;
    while(x !== endX || y !== endY) {
        let t = gameState.worldMap[y * MAP_W + x];
        if(t && t.type === 'grass') t.type = 'path';
        if(Math.random() < 0.5) { 
            if(x < endX) x++; else if(x > endX) x--; else if(y < endY) y++; else if(y > endY) y--; 
        } else { 
            if(y < endY) y++; else if(y > endY) y--; else if(x < endX) x++; else if(x > endX) x--; 
        }
    }
}

export function scaleEnemy(template, isBoss, zoneIdx) {
    let e = JSON.parse(JSON.stringify(template));
    let mapScale = 1 + (zoneIdx * 0.6); 
    let lvlScale = 1 + ((gameState.player.level - 1) * 0.25); 
    let globalMapLevelScale = getMapScale(); 
    
    let finalHpMulti = 1.4 * mapScale * lvlScale * globalMapLevelScale; 
    let finalAtkMulti = 1.3 * mapScale * lvlScale * globalMapLevelScale;
    let finalDefMulti = 1.2 * mapScale * lvlScale * globalMapLevelScale;
    
    if(isBoss) { finalHpMulti *= 1.6; finalAtkMulti *= 1.4; finalDefMulti *= 1.3; } 

    e.hp = Math.floor(e.hp * finalHpMulti); e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * finalAtkMulti); e.def = Math.floor(e.def * finalDefMulti); e.mag = Math.floor(e.mag * finalAtkMulti);
    e.gold = Math.floor(e.gold * (1 + zoneIdx * 0.3) * globalMapLevelScale); 
    e.xp = Math.floor(e.xp * (1 + zoneIdx * 0.4) * globalMapLevelScale);
    e.isBoss = isBoss; e.zone = zoneIdx;
    
    if(gameState.mapLevel > 1) e.name += ` (Lv.${gameState.mapLevel})`;
    
    return e;
}

// =========================================
// GENERACIÓN DEL MUNDO
// =========================================
export function generateWorld() {
    gameState.worldMap = new Array(MAP_W * MAP_H);
    gameState.flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };

    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            let type = 'grass';
            if(x===0 || y===0 || x===MAP_W-1 || y===MAP_H-1) type = 'water';
            else if (x === 32 || x === 65 || y === 50) type = 'wall'; 
            
            gameState.worldMap[y * MAP_W + x] = { x, y, type, enemy: null, npc: null, merchant: false, chest: null, isBossTile: false, discovered: false, zone: getZoneIndex(x,y) };
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

        let bTile = gameState.worldMap[poi.bY * MAP_W + poi.bX];
        bTile.isBossTile = true;
        bTile.enemy = scaleEnemy(mapData[poi.bIdx].boss, true, poi.bIdx);

        if(poi.gX) {
            let gTile = gameState.worldMap[poi.gY * MAP_W + poi.gX];
            gTile.type = 'gate';
            gTile.gateIndex = poi.bIdx;
        }
    });

    let enemiesPools = [[],[],[],[],[],[]];
    for(let z=0; z<=5; z++) {
        for(let i=0; i<=z; i++) enemiesPools[z].push(...mapData[i].newEnemies);
    }

    for(let i=0; i < MAP_W * MAP_H; i++) {
        let t = gameState.worldMap[i];
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
        let zoneTiles = gameState.worldMap.filter(t => t.zone === z && t.type === 'path' && !t.isBossTile && !t.enemy && !(t.x === 16 && t.y === 25));
        
        if (zoneTiles.length < 2) {
            let extraTiles = gameState.worldMap.filter(t => t.zone === z && (t.type === 'grass' || t.type === 'swamp') && !t.isBossTile && !t.enemy && !(t.x === 16 && t.y === 25));
            zoneTiles = zoneTiles.concat(extraTiles);
        }

        zoneTiles.sort(() => Math.random() - 0.5); 
        
        let randomNPC = npcsData[Math.floor(Math.random() * npcsData.length)];

        if(zoneTiles[0]) { zoneTiles[0].npc = randomNPC; }
        if(zoneTiles[1]) { zoneTiles[1].merchant = true; }
    }

    gameState.player.x = 16; gameState.player.y = 25; 
    playSFX(sfx.map_change);
    updateFOV(); render(); saveGame();
}

// =========================================
// RENDERIZADO Y CÁMARA
// =========================================
export function updateFOV() {
    for(let y = Math.max(0, gameState.player.y - 3); y <= Math.min(MAP_H - 1, gameState.player.y + 3); y++) {
        for(let x = Math.max(0, gameState.player.x - 3); x <= Math.min(MAP_W - 1, gameState.player.x + 3); x++) {
            if (Math.hypot(x - gameState.player.x, y - gameState.player.y) <= 3) {
                gameState.worldMap[y * MAP_W + x].discovered = true;
            }
        }
    }
}

export function getTileSize() {
    return Math.floor(Math.min(window.innerWidth, window.innerHeight) / 3);
}

export function centerCamera() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    const TS = getTileSize();
    const stride = TS + 2; 
    
    const targetX = (gameState.player.x * stride) + (TS / 2) - (mapEl.clientWidth / 2);
    const targetY = (gameState.player.y * stride) + (TS / 2) - (mapEl.clientHeight / 2);
    mapEl.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
}

export function render() {
    const TS = getTileSize();
    const stride = TS + 2;
    const m = document.getElementById('map'); 
    
    m.style.gridTemplateColumns = `repeat(${MAP_W}, ${TS}px)`;
    m.style.gridAutoRows = `${TS}px`;
    
    const existingTiles = m.querySelectorAll('.tile');
    existingTiles.forEach(t => t.remove());
    
    gameState.currentZoneIndex = getZoneIndex(gameState.player.x, gameState.player.y);
    
    const widthTiles = Math.ceil(window.innerWidth / TS);
    const heightTiles = Math.ceil(window.innerHeight / TS);
    const vRadiusX = Math.ceil(widthTiles / 2) + 1;
    const vRadiusY = Math.ceil(heightTiles / 2) + 1;

    for(let y = Math.max(0, gameState.player.y - vRadiusY); y <= Math.min(MAP_H - 1, gameState.player.y + vRadiusY); y++) {
        for(let x = Math.max(0, gameState.player.x - vRadiusX); x <= Math.min(MAP_W - 1, gameState.player.x + vRadiusX); x++) {
            let t = gameState.worldMap[y * MAP_W + x];
            if(!t) continue;

            const d = document.createElement('div'); 
            d.style.gridColumn = x + 1;
            d.style.gridRow = y + 1;

            if (!t.discovered) { d.className = 'tile fog'; } 
            else {
                d.className = 'tile ' + t.type;
                if (t.isBossTile) d.classList.add(mapData[t.zone].css);
                
                if (t.type === 'gate' && gameState.player.hasKey && gameState.player.hasKey[t.gateIndex]) {
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
    sprite.innerHTML = `<img src="${gameState.player.mapImg}">`;
    sprite.style.width = `${TS}px`;
    sprite.style.height = `${TS}px`;
    sprite.style.left = (gameState.player.x * stride) + 'px';
    sprite.style.top = (gameState.player.y * stride) + 'px';
    
    setTimeout(centerCamera, 10);
    
    document.getElementById('mapName').textContent = mapData[gameState.currentZoneIndex].rarity + (gameState.mapLevel > 1 ? ` (Mapa Lv.${gameState.mapLevel})` : '');
    updateHUD();
}

// =========================================
// INTERACCIONES Y MOVIMIENTO
// =========================================
export function openChest(tile) {
    tile.chest.opened = true;
    playSFX(sfx.quest_complete); 
    let r = Math.random();
    let scaleFactor = getMapScale();
    
    if (r < 0.4) {
        let g = Math.floor(20 * (gameState.currentZoneIndex + 1) * (1 + Math.random()) * scaleFactor);
        gameState.player.gold += g;
        spawnFloatingText('+' + g + ' Oro', '#ffeb3b', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#ffeb3b">${g} Oro</b>.`);
    } else if (r < 0.65) {
        gameState.player.potions++;
        spawnFloatingText('+1 HP Potion', '#f44336', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#f44336">1 Poción de Vida</b>.`);
    } else if (r < 0.85) {
        gameState.player.energyPotions++;
        spawnFloatingText('+1 EP Potion', '#9c27b0', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste <b style="color:#9c27b0">1 Poción de Energía</b>.`);
    } else {
        const currentShop = mapData[gameState.currentZoneIndex].shop;
        const isWeapon = Math.random() < 0.5;
        const pool = isWeapon ? currentShop.weapons : currentShop.armors;
        const droppedItem = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
        
        if (isWeapon) {
            droppedItem.atk = Math.floor(droppedItem.atk * scaleFactor);
            droppedItem.mag = Math.floor(droppedItem.mag * scaleFactor);
            gameState.player.inventory.weapons.push(droppedItem);
        } else {
            droppedItem.def = Math.floor(droppedItem.def * scaleFactor);
            droppedItem.hpBonus = Math.floor(droppedItem.hpBonus * scaleFactor);
            droppedItem.mpBonus = Math.floor(droppedItem.mpBonus * scaleFactor);
            gameState.player.inventory.armors.push(droppedItem);
        }
        
        droppedItem.price = Math.floor((droppedItem.price || 15) * scaleFactor);
        droppedItem.name = droppedItem.name + (gameState.mapLevel > 1 ? ` +${gameState.mapLevel - 1}` : '');

        spawnFloatingText('+ ' + droppedItem.name, '#7ad7ff', 'map');
        logMsg(`📦 ¡Cofre abierto! Encontraste una recompensa rara: <b class="${droppedItem.colorClass}">${droppedItem.name}</b>.`);
    }
    
    updateHUD(); saveGame();
}

export function move(dx, dy) {
    if (isMenuOpen || gameState.inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex' || document.getElementById('shopModal').style.display === 'flex') return;
    
    let nx = gameState.player.x + dx, ny = gameState.player.y + dy;
    let tile = gameState.worldMap[ny * MAP_W + nx]; 
    
    if (!tile || tile.type === 'water' || tile.type === 'wall') return;

    let epCost = (tile.type === 'swamp') ? 2 : 1;

    if (gameState.player.ep < epCost) {
        playSFX(sfx.error);
        logMsg(`¡Estás exhausto! Necesitas ${epCost} EP para moverte aquí. Usa una poción o descansa.`);
        return;
    }

    if (tile.type === 'gate' && (!gameState.player.hasKey || !gameState.player.hasKey[tile.gateIndex])) {
        playSFX(sfx.error); logMsg("🚫 La puerta está cerrada. Necesitas la llave (completa la misión del Jefe)."); return; 
    }

    if (tile.enemy && tile.enemy.isBoss) {
        if (!gameState.quest || gameState.quest.type !== 'kill_boss' || gameState.quest.target !== tile.enemy.name.replace(` (Lv.${gameState.mapLevel})`, '')) {
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
    gameState.lastPlayerPos = { x: gameState.player.x, y: gameState.player.y }; 
    gameState.player.x = nx; gameState.player.y = ny;
    gameState.player.ep -= epCost;
    spawnFloatingText('-' + epCost + ' EP', '#9c27b0', 'map');
    
    updateFOV(); centerCamera();
    
    if (tile.chest && !tile.chest.opened) {
        openChest(tile);
    }

    if (tile.type === 'fountain') {
        let healAmount = getMaxHp() - gameState.player.hp;
        let mpAmount = getMaxMp() - gameState.player.mp;
        gameState.player.hp = getMaxHp();
        gameState.player.mp = getMaxMp();
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