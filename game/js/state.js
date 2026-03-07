// =========================================
// ESTADO DINÁMICO DEL JUEGO (Variables)
// =========================================

export const gameState = {
    worldMap: [], 
    flags: { boss0: false, boss1: false, boss2: false, boss3: false, boss4: false, boss5: false },
    currentZoneIndex: 0, 
    mapLevel: 1, 

    player: { 
        x: 16, y: 25,
        hp: 0, mp: 0, ep: 0, xp: 0, gold: 0, potions: 3, manaPotions: 1, energyPotions: 1, level: 1,
        
        // IDENTIDAD (Nuevo sistema Rol -> Personaje)
        role: '', 
        characterId: '', 
        characterName: '',
        mapImg: 'img/player/heroe.png', 
        combatImg: 'img/player/heroe.png',
        direction: 'down',
        isWalking: false,
        spriteSheet: null,

        // --- ESTADÍSTICAS BASE (Estilo MOBA) ---
        // Supervivencia
        baseMaxHp: 0, baseHpRegen: 0,
        baseMaxMp: 0, baseMpRegen: 0,
        baseMaxEp: 0, baseEpRegen: 0,
        baseArmor: 0, baseMagicResist: 0,
        baseTenacity: 0, // Porcentaje de reducción de CC (0 a 100)

        // Daño
        baseAd: 0, // Attack Damage (Físico)
        baseAp: 0, // Ability Power (Mágico)
        baseCritChance: 0, // 0.0 a 1.0
        baseCritDamage: 1.75, // Multiplicador base (175%)

        // Velocidad
        baseAttackSpeed: 1.0, 
        baseAbilityHaste: 0, 
        baseMoveSpeed: 300,

        // Sustento
        baseLifeSteal: 0, // Porcentaje de curación en ataques básicos
        baseOmnivamp: 0,  // Porcentaje de curación en todo el daño

        // Penetración
        baseArmorPen: 0, // Porcentaje (ej. 0.30 ignora 30% armadura)
        baseLethality: 0, // Plana (ej. 10 ignora 10 puntos de armadura directos)
        baseMagicPen: 0, // Porcentaje o plana para daño mágico

        baseRange: 1, // 1 es cuerpo a cuerpo, 3+ es a distancia

        // Inventario y Progresión
        weapon: null, armor: null, accessory: null,
        inventory: { weapons: [], armors: [], accessories: [] },
        zoneQuestProgress: [0, 0, 0, 0, 0, 0],
        hasKey: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false },
        
        statPoints: 0,
        skillPoints: 0, 
        knownSkills: [], 
        equippedSkills: { special: null, defensive: null },
        cooldowns: {}  // track remaining turns on abilities
    },

    quest: null, 
    inCombat: false, 
    currentEnemyTile: null, 
    lastPlayerPos: { x: 16, y: 25 },

    combatState: {
        defBuffTurns: 0,
        poisonTurns: 0,
        playerPoisonTurns: 0, // veneno aplicado por enemigos
        playerPoisonDamage: 0,
        enemySlowTurns: 0,
        // control de efectos de estado
        stunTurns: 0,
        silenceTurns: 0,
        blindTurns: 0,
        // iniciativa ATB
        initiative: 0,
        enemyInitiative: 0
    },

    checkpoints: {
        lastLevelUp: null,
        lastBoss: null
    }
};
