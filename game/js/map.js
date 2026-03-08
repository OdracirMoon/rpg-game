// =========================================
// SISTEMA DE MAPA, GENERACIÓN Y MOVIMIENTO
// =========================================
import { gameState } from './state.js';
import { MAP_W, MAP_H, mapData, npcsData, activeSlot } from './data.js';
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

export function getTileBitmask(cx, cy, type) {
    let mask = 0;
    const isSame = (x, y) => {
        // Los bordes del mapa cuentan como el mismo tipo para que se conecten a la orilla
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
        let t = gameState.worldMap[y * MAP_W + x];
        return t && t.type === type;
    };
    if (isSame(cx, cy - 1)) mask += 1; // Norte
    if (isSame(cx + 1, cy)) mask += 2; // Este
    if (isSame(cx, cy + 1)) mask += 4; // Sur
    if (isSame(cx - 1, cy)) mask += 8; // Oeste
    return mask;
}

const autotileMap = {
    0: [1, 1],  // Aislado -> Usamos el centro solido temporalmente para evitar recortes vacios
    1: [1, 2],  // Extremo Sur
    2: [0, 1],  // Extremo Oeste
    3: [0, 2],  // Esquina Inferior Izquierda
    4: [1, 0],  // Extremo Norte
    5: [0, 1],  // Tubo Vertical -> Forzamos el uso del borde izquierdo
    6: [0, 0],  // Esquina Superior Izquierda
    7: [0, 1],  // Borde Izquierdo
    8: [2, 1],  // Extremo Este
    9: [2, 2],  // Esquina Inferior Derecha
    10: [1, 0], // Tubo Horizontal -> Forzamos el uso del borde superior
    11: [1, 2], // Borde Inferior
    12: [2, 0], // Esquina Superior Derecha
    13: [2, 1], // Borde Derecho
    14: [1, 0], // Borde Superior
    15: [1, 1]  // Centro Solido
};

export function drawStraightPath(startX, startY, endX, endY) {
    const brushSize = 1; // Genera un grosor de 3x3
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    for (let y = minY - brushSize; y <= maxY + brushSize; y++) {
        for (let x = minX - brushSize; x <= maxX + brushSize; x++) {
            if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
                let t = gameState.worldMap[y * MAP_W + x];
                if (t && t.type === 'grass') t.type = 'path';
            }
        }
    }
}

function ensureEnemy(enemy) {
    if (!enemy) return null;
    if (enemy.spriteSheet === undefined) enemy.spriteSheet = null;
    return enemy;
}

export function scaleEnemy(template, isBoss, zoneIdx) {
    let e = JSON.parse(JSON.stringify(template));
    let mapScale = 1 + (zoneIdx * 0.6); 
    let lvlScale = 1 + ((gameState.player.level - 1) * 0.25); 
    let globalMapLevelScale = getMapScale(); 
    
    let finalHpMulti = 3.5 * mapScale * lvlScale * globalMapLevelScale; 
    let finalAtkMulti = 2.2 * mapScale * lvlScale * globalMapLevelScale; 
    let finalDefMulti = 1.8 * mapScale * lvlScale * globalMapLevelScale; 
    let finalMagMulti = 2.0 * mapScale * lvlScale * globalMapLevelScale; 
    
    if(isBoss) { 
        finalHpMulti *= 2.5; 
        finalAtkMulti *= 1.8; 
        finalDefMulti *= 1.8; 
        finalMagMulti *= 1.8; 
    } 

    e.hp = Math.floor(e.hp * finalHpMulti); e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * finalAtkMulti); e.def = Math.floor(e.def * finalDefMulti); e.mag = Math.floor((e.mag || 0) * finalMagMulti);
    // si el template define mr (incluso 0) lo usamos, sino calculamos a partir de def
    let baseMr = (e.mr !== undefined ? e.mr : e.def * 0.5);
    e.mr = Math.floor(baseMr * finalDefMulti); // mr escala con def o su propio valor
    e.crit = e.crit || 0; // crit no escala
    e.lifesteal = e.lifesteal || 0;
    e.lethality = e.lethality || 0;
    e.magicPen = e.magicPen || 0;
    // nuevos campos de fase2
    e.evasion = e.evasion || 0;
    e.manaBurn = e.manaBurn || 0;
    e.trait = e.trait || '';
    e.spriteSheet = e.spriteSheet || null;

    e.gold = Math.floor(e.gold * (1 + zoneIdx * 0.3) * globalMapLevelScale); 
    e.xp = Math.floor(e.xp * (1 + zoneIdx * 0.4) * globalMapLevelScale);
    e.isBoss = isBoss; e.zone = zoneIdx;
    
    if(gameState.mapLevel > 1) e.name += ` (Lv.${gameState.mapLevel})`;
    
    return e;
}

// =========================================
// CACHE DE IMÁGENES Y DIBUJO SOBRE CANVAS
// =========================================

const spriteCache = {};
const failedSpriteSources = new Set();

function getCachedImage(src, forceReload = false) {
    if (!src) return null;
    if (!forceReload && spriteCache[src]) return spriteCache[src];

    const img = new Image();
    img.src = src;
    img.onload = () => {
        failedSpriteSources.delete(src);
    };
    img.onerror = () => {
        failedSpriteSources.add(src);
        console.warn("Tile image failed to load:", src);
    };
    spriteCache[src] = img;
    return img;
}

function drawEntitySprite(ctx, entity, fallbackSrc, px, py, TS) {
    const src = (entity && entity.spriteSheet) ? entity.spriteSheet : fallbackSrc;
    if (!src) return;
    let img = getCachedImage(src, failedSpriteSources.has(src));
    if (!img) return;

    if (img.complete && img.naturalWidth !== 0) {
        // Preparado para animación futura: hoy dibuja frame estático completo.
        ctx.drawImage(img, px, py, TS, TS);
    } else {
        img.onload = () => ctx.drawImage(img, px, py, TS, TS);
    }
}

function drawTile(ctx, t, px, py, TS, stride) {
    if (!t.discovered) {
        ctx.fillStyle = '#03070d';
        ctx.fillRect(px, py, TS, TS);
        return;
    }

    // Fondo base con Autotiling Universal y Offset
    if (t.type === 'path' || t.type === 'water' || t.type === 'wall') {
        let img = getCachedImage('./img/tiles/tiles.png');
        if (img.complete && img.naturalWidth !== 0) {
            let mask = getTileBitmask(t.x, t.y, t.type);
            let [baseCol, baseRow] = autotileMap[mask] || [1, 1];

            // Magia decorativa: Si es un centro solido, 45% de probabilidad de tener detalles (Fila 5)
            if (mask === 15) {
                let rand = ((t.x * 73) + (t.y * 31)) % 100;
                if (rand < 15) { baseCol = 0; baseRow = 5; }
                else if (rand < 30) { baseCol = 1; baseRow = 5; }
                else if (rand < 45) { baseCol = 2; baseRow = 5; }
            }

            // Desplazamiento segun el tipo de terreno (Magia del Offset)
            let offsetCol = 0;
            if (t.type === 'path') offsetCol = 3;  // Inicia en la columna 3
            if (t.type === 'water') offsetCol = 6; // Inicia en la columna 6
            // Si es 'wall', se queda en 0

            let finalCol = baseCol + offsetCol;

            ctx.drawImage(img, Math.floor(finalCol * 16), Math.floor(baseRow * 16), 16, 16, Math.floor(px), Math.floor(py), TS, TS);
        } else {
            const fallbackColors = { path: '#5d4037', water: '#10304a', wall: '#444' };
            ctx.fillStyle = fallbackColors[t.type] || '#222';
            ctx.fillRect(px, py, TS, TS);
            img.onload = () => render();
        }
    } else {
        let tileKey = 'tile_' + t.type;
        if (t.type === 'fountain') tileKey = 'tile_water';
        let img = getCachedImage('./img/tiles/' + tileKey + '.png');
        if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, Math.floor(px), Math.floor(py), TS, TS);
        } else {
            const colors = { grass: '#184b20', swamp: '#2b3b2c', fountain: '#008ba3' };
            ctx.fillStyle = colors[t.type] || '#222';
            ctx.fillRect(px, py, TS, TS);
            img.onload = () => render();
        }
    }

    // Dibujar el objeto de la fuente ENCIMA del fondo
    if (t.type === 'fountain') {
        let fImg = getCachedImage('img/tiles/fountain_obj.png');
        if (fImg.complete && fImg.naturalWidth !== 0) {
            ctx.drawImage(fImg, px, py, TS, TS);
        } else {
            fImg.onload = () => ctx.drawImage(fImg, px, py, TS, TS);
        }
    }

    // --- Resto de elementos superpuestos ---
    if (t.isBossTile) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, TS, TS);
    }

    // --- Bloque para Enemigos / Jefes ---
    if (t.enemy) {
        let eImgUrl = t.enemy.spriteSheet ? t.enemy.spriteSheet : t.enemy.img;
        let eImg = getCachedImage(eImgUrl);
        if (eImg.complete && eImg.naturalWidth !== 0) {
            if (t.enemy.spriteSheet) {
                // Extraer frame de LPC (832x256 = 13 cols x 4 filas)
                let fw = eImg.naturalWidth / 13;
                let fh = eImg.naturalHeight / 4;
                let sx = globalIdleFrame * fw; // Alterna entre col 0 y 1
                let sy = 2 * fh; // Fila 3 (Mirando hacia abajo, indice 2)
                let aspect = fh / fw;
                let drawHeight = TS * aspect;
                let offsetY = drawHeight - TS;
                ctx.drawImage(eImg, sx, sy, fw, fh, px, py - offsetY, TS, drawHeight);
            } else {
                // Imagen estatica normal
                let aspect = eImg.naturalHeight / eImg.naturalWidth;
                let drawHeight = TS * aspect;
                let offsetY = drawHeight - TS;
                ctx.drawImage(eImg, px, py - offsetY, TS, drawHeight);
            }
        } else {
            eImg.onload = () => { render(); };
        }
    }
    if (t.merchant) {
        let mImgUrl = 'img/npcs/merchant.png';
        let mImg = getCachedImage(mImgUrl);
        if (mImg.complete && mImg.naturalWidth !== 0) {
            // Recorte del spritesheet de 13x4
            let fw = mImg.naturalWidth / 13;
            let fh = mImg.naturalHeight / 4;
            let sx = globalIdleFrame * fw;
            let sy = 2 * fh; // Fila 3
            let aspect = fh / fw;
            let drawHeight = TS * aspect;
            let offsetY = drawHeight - TS;
            ctx.drawImage(mImg, sx, sy, fw, fh, px, py - offsetY, TS, drawHeight);
        } else {
            mImg.onload = () => { render(); };
        }
    }
    // --- Bloque para NPCs ---
    if (t.npc) {
        let nImgUrl = t.npc.spriteSheet ? t.npc.spriteSheet : t.npc.img;
        let nImg = getCachedImage(nImgUrl);
        if (nImg.complete && nImg.naturalWidth !== 0) {
            if (t.npc.spriteSheet) {
                let fw = nImg.naturalWidth / 13;
                let fh = nImg.naturalHeight / 4;
                let sx = globalIdleFrame * fw;
                let sy = 2 * fh;
                let aspect = fh / fw;
                let drawHeight = TS * aspect;
                let offsetY = drawHeight - TS;
                ctx.drawImage(nImg, sx, sy, fw, fh, px, py - offsetY, TS, drawHeight);
            } else {
                let aspect = nImg.naturalHeight / nImg.naturalWidth;
                let drawHeight = TS * aspect;
                let offsetY = drawHeight - TS;
                ctx.drawImage(nImg, px, py - offsetY, TS, drawHeight);
            }
        } else {
            nImg.onload = () => { render(); };
        }
    }
    if (t.chest) {
        let key = t.chest.opened ? 'chest_opened' : 'chest_closed';
        let cImg = getCachedImage('img/tiles/' + key + '.png');
        if (cImg.complete && cImg.naturalWidth !== 0) ctx.drawImage(cImg, px, py, TS, TS);
        else cImg.onload = () => ctx.drawImage(cImg, px, py, TS, TS);
    }
}

export function renderMiniMap(canvasId = 'miniMapCanvas') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !gameState.worldMap || gameState.worldMap.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileW = canvas.width / MAP_W;
    const tileH = canvas.height / MAP_H;

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const t = gameState.worldMap[y * MAP_W + x];
            if (!t || !t.discovered) {
                ctx.fillStyle = '#000';
            } else {
                const palette = {
                    grass: '#2e7d32',
                    path: '#8d6e63',
                    wall: '#424242',
                    water: '#1565c0',
                    swamp: '#33691e',
                    fountain: '#00acc1',
                    gate: '#ffeb3b'
                };
                ctx.fillStyle = palette[t.type] || '#263238';
            }
            ctx.fillRect(x * tileW, y * tileH, tileW, tileH);
        }
    }

    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(gameState.player.x * tileW, gameState.player.y * tileH, Math.max(2, tileW), Math.max(2, tileH));
}
window.renderMiniMap = renderMiniMap;

// =========================================
// UTILIDADES DE CACHE DEL MAPA (LOCALSTORAGE)
// =========================================
const MAP_CACHE_PREFIX = 'miniRPG_MapLevel_';

function getMapCacheKey(level) {
    return MAP_CACHE_PREFIX + activeSlot + '_lvl' + level;
}

function loadCachedMap(level) {
    try {
        const json = localStorage.getItem(getMapCacheKey(level));
        if (!json) return null;
        return JSON.parse(json);
    } catch (e) { return null; }
}

function saveCachedMap(level, map, flags) {
    try {
        localStorage.setItem(getMapCacheKey(level), JSON.stringify({ map, flags }));
    } catch (e) { console.warn('No se pudo cachear el mapa', e); }
}

function clearCachedMaps() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(MAP_CACHE_PREFIX + activeSlot)) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) { }
}

// =========================================
// GENERACIÓN DEL MUNDO
// =========================================
export function generateWorld(force = false) {
    // si ya tenemos mapa cargado y no se fuerza, no regeneramos
    if (!force && gameState.worldMap && gameState.worldMap.length === MAP_W * MAP_H) {
        return;
    }

    // intentar cargar mapa cacheado para el nivel actual
    const cache = loadCachedMap(gameState.mapLevel);
    if (cache && !force) {
        gameState.worldMap = cache.map;
        gameState.flags = cache.flags;
        updateFOV(); render();
        return;
    }

    gameState.worldMap = new Array(MAP_W * MAP_H);
    gameState.flags = { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false };

    // 1. Base y Borde de Agua
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            let type = 'grass';
            if(x <= 1 || y <= 1 || x >= MAP_W - 2 || y >= MAP_H - 2) type = 'water';
            gameState.worldMap[y * MAP_W + x] = { x, y, type, enemy: null, npc: null, merchant: false, chest: null, isBossTile: false, discovered: false, zone: getZoneIndex(x,y) };
        }
    }

    // 2. Dibujar Caminos Rectos (Forma de 'S' invertida)
    drawStraightPath(16, 25, 82, 25); // Fila Superior
    drawStraightPath(82, 25, 82, 75); // Conector Vertical Derecho
    drawStraightPath(82, 75, 16, 75); // Fila Inferior

    // 3. Dibujar Muros Divisores (Solo donde hay pasto, creando huecos automaticos en el camino)
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            let t = gameState.worldMap[y * MAP_W + x];
            if (t.type === 'grass') {
                if (x === 33 || x === 66 || y === 50) t.type = 'wall';
            }
        }
    }

    // 4. Colocar Jefes y Bloqueadores Invisibles
    const gates = [
        { x: 33, y: 25, bIdx: 0 },
        { x: 66, y: 25, bIdx: 1 },
        { x: 82, y: 50, bIdx: 2 },
        { x: 66, y: 75, bIdx: 3 },
        { x: 33, y: 75, bIdx: 4 },
        { x: 16, y: 75, bIdx: 5 } // Jefe final
    ];

    gates.forEach((gate) => {
        let gTile = gameState.worldMap[gate.y * MAP_W + gate.x];
        gTile.gateIndex = gate.bIdx;
        gTile.isBossTile = true;
        gTile.enemy = scaleEnemy(mapData[gate.bIdx].boss, true, gate.bIdx);

        // Anadir bloqueadores para que el jugador no esquive al jefe por el ancho del camino
        if (gate.x === 33 || gate.x === 66) {
            gameState.worldMap[(gate.y - 1) * MAP_W + gate.x].isBlocker = true;
            gameState.worldMap[(gate.y + 1) * MAP_W + gate.x].isBlocker = true;
        } else if (gate.y === 50) {
            gameState.worldMap[gate.y * MAP_W + (gate.x - 1)].isBlocker = true;
            gameState.worldMap[gate.y * MAP_W + (gate.x + 1)].isBlocker = true;
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
                } else if (rand < 0.08 && t.type === 'grass') {
                    t.type = 'fountain'; 
                }

                if (Math.random() < 0.02 && t.type !== 'fountain' && !t.enemy) {
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
    // guardamos versión cacheada del mapa inmediatamente
    saveCachedMap(gameState.mapLevel, gameState.worldMap, gameState.flags);
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
    return Math.floor(Math.min(window.innerWidth, window.innerHeight) / 9);
}

export function centerCamera() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    const TS = getTileSize();
    const stride = TS; // Sin margen para unificar el mapa
    
    const targetX = (gameState.player.x * stride) + (TS / 2) - (mapEl.clientWidth / 2);
    const targetY = (gameState.player.y * stride) + (TS / 2) - (mapEl.clientHeight / 2);
    mapEl.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
}

export function render() {
    // asegurarse de que el jugador descubre sus alrededores antes de dibujar
    if (gameState.player && gameState.worldMap) updateFOV();

    const TS = getTileSize();
    const stride = TS; // Sin margen para unificar el mapa
    const mapEl = document.getElementById('map');

    // actualizar variable CSS para tamaño de sprite
    document.documentElement.style.setProperty('--ts', TS + 'px');
    const canvas = document.getElementById('mapCanvas');
    if (!canvas || !mapEl) return;

    // viewport rendering: canvas del tamaño de la ventana
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.background = '#000';

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    // establecer fondo negro y limpiar
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    gameState.currentZoneIndex = getZoneIndex(gameState.player.x, gameState.player.y);

    // calcular cuántos tiles caben en el viewport
    const tilesPerRow = Math.ceil(canvasWidth / stride);
    const tilesPerCol = Math.ceil(canvasHeight / stride);

    // offset para centrar al jugador
    const offsetX = Math.floor(tilesPerRow / 2);
    const offsetY = Math.floor(tilesPerCol / 2);

    // Calculamos el centro exacto de la pantalla forzando enteros perfectos
    const startDrawX = Math.floor((canvasWidth / 2) - (TS / 2));
    const startDrawY = Math.floor((canvasHeight / 2) - (TS / 2));

    // Añadimos +1 al rango para que no desaparezcan tiles abruptamente en los bordes
    for (let dy = -offsetY - 1; dy <= offsetY + 1; dy++) {
        for (let dx = -offsetX - 1; dx <= offsetX + 1; dx++) {
            const x = gameState.player.x + dx;
            const y = gameState.player.y + dy;
            if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;

            let t = gameState.worldMap[y * MAP_W + x];
            if (!t) continue;

            // Posición en el canvas anclada al centro de la pantalla
            const canvasX = startDrawX + (dx * stride);
            const canvasY = startDrawY + (dy * stride);

            drawTile(ctx, t, canvasX, canvasY, TS, stride);
        }
    }

    // elemento sprite aún puede usarse para animar movimiento
    let sprite = document.getElementById('playerSprite');
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.id = 'playerSprite';
        mapEl.appendChild(sprite);
    }
    sprite.innerHTML = ''; // Limpiar imgs viejas
    
    // Forzar el tamaño dinámico directamente en el elemento
    sprite.style.setProperty('--ts', TS + 'px');
    sprite.style.width = TS + 'px';
    sprite.style.height = TS + 'px';
    
    let isSpriteSheet = !!gameState.player.spriteSheet;
    let spriteUrl = isSpriteSheet ? gameState.player.spriteSheet : gameState.player.mapImg;
    
    sprite.style.backgroundImage = "url('" + spriteUrl + "')";
    
    if (isSpriteSheet) {
        sprite.className = "player-sprite is-spritesheet dir-" + (gameState.player.direction || 'down') + (gameState.player.isWalking ? " is-walking" : " anim-idle");
    } else {
        sprite.className = "player-sprite is-static";
    }

    // Asegurar que el sprite HTML coincida exactamente con la matemática del canvas
    sprite.style.left = startDrawX + 'px';
    sprite.style.top = startDrawY + 'px';

    // no necesitamos centerCamera con viewport rendering
    // setTimeout(centerCamera, 10);

    // Si no hay tiles descubiertos visiblemente, garantizar que al menos casilla inicial se muestre
    if (gameState.player && gameState.worldMap) {
        updateFOV();
    }

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
    if (isMenuOpen || gameState.inCombat || document.getElementById('classModal').style.display === 'flex' || document.getElementById('npcModal').style.display === 'flex' || document.getElementById('shopModal').style.display === 'flex' || document.getElementById('mapModal').style.display === 'flex') return;
    
    // detectar dirección de desplazamiento
    if (dy === -1) gameState.player.direction = 'up';
    if (dy === 1) gameState.player.direction = 'down';
    if (dx === -1) gameState.player.direction = 'left';
    if (dx === 1) gameState.player.direction = 'right';

    let nx = gameState.player.x + dx, ny = gameState.player.y + dy;
    let tile = gameState.worldMap[ny * MAP_W + nx]; 
    
    if (!tile || tile.type === 'water' || tile.type === 'wall' || tile.isBlocker) return;

    let epCost = (tile.type === 'swamp') ? 2 : 1;

    if (gameState.player.ep < epCost) {
        playSFX(sfx.error);
        logMsg(`¡Estás exhausto! Necesitas ${epCost} EP para moverte aquí. Usa una poción o descansa.`);
        return;
    }

    if (tile.gateIndex !== undefined && (!gameState.player.hasKey || !gameState.player.hasKey[tile.gateIndex])) {
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
    gameState.player.isWalking = true;
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
        gameState.player.isWalking = false;
        startCombat(tile); 
    } else {
        render();
        setTimeout(() => {
            gameState.player.isWalking = false;
            render();
        }, 300);
    }
}

// =========================================
// MOTOR DE ANIMACION IDLE (NPCs y Enemigos)
// =========================================
export let globalIdleFrame = 0;
setInterval(() => {
    globalIdleFrame = globalIdleFrame === 0 ? 1 : 0;
    // Solo renderiza si el mapa esta cargado y activo
    if (gameState.worldMap && gameState.worldMap.length > 0) {
        render();
    }
}, 600);