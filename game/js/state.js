// =========================================
// ESTADO DINÁMICO DEL JUEGO (Variables)
// =========================================
// Agrupamos todas las variables en un solo objeto para poder
// modificarlas y leerlas fácilmente desde cualquier otro módulo.

export const gameState = {
    worldMap: [], 
    flags: { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false },
    currentZoneIndex: 0, 
    mapLevel: 1, 

    player: { 
        x: 16, y: 25,
        hp: 0, mp: 0, ep: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, energyPotions: 1, level: 1,
        baseMaxHp: 0, baseMaxMp: 0, baseMaxEp: 0, baseAtk: 0, baseDef: 0, baseMag: 0, weapon: null, armor: null, playerClass: '',
        mapImg: 'img/player/heroe.png', combatImg: 'img/player/heroe.png',
        inventory: { weapons: [], armors: [] },
        zoneQuestProgress: [0, 0, 0, 0, 0, 0],
        hasKey: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false }
    },

    quest: null, 
    inCombat: false, 
    currentEnemyTile: null, 
    lastPlayerPos: { x: 16, y: 25 },

    combatState: {
        defBuffTurns: 0,
        poisonTurns: 0
    }
};