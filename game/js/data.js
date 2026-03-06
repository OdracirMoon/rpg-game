// =========================================
// DATOS ESTÁTICOS DEL JUEGO Y CONFIGURACIÓN
// =========================================

export const activeSlot = sessionStorage.getItem('activeSlot') || '1';
export const SAVE_KEY = 'miniRPG_WorldSave_' + activeSlot;

export const GAME_VERSION = '1.0.0';

// DICCIONARIO MAESTRO DE HABILIDADES (Expandido para el Árbol)
export const skillsData = {
    // DICCIONARIO MAESTRO DE PERSONAJES JUGABLES
export const charactersData = {
    // --- GUERREROS (Enfocados en HP, Armor y AD) ---
    'caballero': {
        id: 'caballero', name: 'Caballero Vanguardia', role: 'Guerrero',
        desc: 'Tanque duro de matar. Excelente armadura y regeneración.',
        stats: { hp: 120, hpReg: 5, mp: 0, ep: 100, ad: 15, ap: 0, armor: 25, mr: 15, ms: 300, crit: 0, lifesteal: 0 },
        imgs: { map: 'img/player/guerrero_mapa.png', combat: 'img/player/guerrero_combate.png' }
    },
    'berserker': {
        id: 'berserker', name: 'Berserker Sediento', role: 'Guerrero',
        desc: 'Guerrero ofensivo con Robo de Vida base y mucho Daño Físico (AD).',
        stats: { hp: 90, hpReg: 2, mp: 0, ep: 80, ad: 22, ap: 0, armor: 10, mr: 10, ms: 315, crit: 0.1, lifesteal: 0.05 },
        imgs: { map: 'img/player/guerrero_mapa.png', combat: 'img/player/guerrero_combate.png' } // Podrás cambiar las imgs después
    },

    // --- ARQUEROS (Enfocados en Attack Speed, Crit y Letalidad) ---
    'cazador': {
        id: 'cazador', name: 'Cazador Ágil', role: 'Arquero',
        desc: 'Alta velocidad de ataque y movimiento. Ideal para pegar rápido.',
        stats: { hp: 70, hpReg: 2, mp: 40, ep: 80, ad: 18, ap: 0, armor: 8, mr: 8, ms: 330, crit: 0.15, lifesteal: 0 },
        imgs: { map: 'img/player/arquero_mapa.png', combat: 'img/player/arquero_combate.png' }
    },
    'francotirador': {
        id: 'francotirador', name: 'Tirador Letal', role: 'Arquero',
        desc: 'Lento pero letal. Inicia con Letalidad para perforar armaduras.',
        stats: { hp: 65, hpReg: 1, mp: 60, ep: 50, ad: 25, ap: 0, armor: 5, mr: 5, ms: 290, crit: 0.05, lifesteal: 0 },
        imgs: { map: 'img/player/arquero_mapa.png', combat: 'img/player/arquero_combate.png' }
    },

    // --- MAGOS (Enfocados en AP, Maná y Penetración Mágica) ---
    'hechicero': {
        id: 'hechicero', name: 'Hechicero Arcano', role: 'Mago',
        desc: 'Maestro del daño mágico explosivo (Mucho AP y Maná).',
        stats: { hp: 55, hpReg: 1, mp: 150, ep: 0, ad: 5, ap: 30, armor: 4, mr: 12, ms: 300, crit: 0, lifesteal: 0 },
        imgs: { map: 'img/player/mago_mapa.png', combat: 'img/player/mago_combate.png' }
    },
    'brujo': {
        id: 'brujo', name: 'Brujo de Sangre', role: 'Mago',
        desc: 'Mago oscuro que recupera vida al hacer daño (Omnivamp).',
        stats: { hp: 75, hpReg: 3, mp: 100, ep: 0, ad: 8, ap: 20, armor: 8, mr: 15, ms: 295, crit: 0, lifesteal: 0 },
        imgs: { map: 'img/player/mago_mapa.png', combat: 'img/player/mago_combate.png' }
    },

    // --- SIMPLE (Equilibrado) ---
    'aldeano': {
        id: 'aldeano', name: 'Aldeano Ahorrador', role: 'Simple',
        desc: 'Estadísticas mediocres, pero empieza con 200 de Oro en los bolsillos.',
        stats: { hp: 60, hpReg: 1, mp: 20, ep: 40, ad: 8, ap: 8, armor: 5, mr: 5, ms: 300, crit: 0, lifesteal: 0 },
        imgs: { map: 'img/player/simple_mapa.png', combat: 'img/player/simple_combate.png' }
    }
};


export const MAP_W = 100; 
export const MAP_H = 100;

export const npcsData = [
    { name: 'Alcalde Rufus', img: 'img/npcs/alcalde.png', dialogues: ['¡Por favor, héroe! El mundo está en peligro.', 'Los caminos ya no son seguros. ¿Nos ayudarás?'] },
    { name: 'Herrero Balder', img: 'img/npcs/herrero.png', dialogues: ['Necesito materiales, pero esos bichos molestan a los mineros.', 'Las armas no se forjan solas. ¡Ayúdame a limpiar la zona!'] },
    { name: 'Sabia Elara', img: 'img/npcs/sabia.png', dialogues: ['Siento una perturbación en el flujo del maná... Ve a investigar.', 'Toma esta tarea. Es tu destino, lo quieras o no.'] },
    { name: 'Guardia Thorne', img: 'img/npcs/guardia.png', dialogues: ['Ojalá pudiera ir yo, pero me lastimé la rodilla con una flecha.', 'Mi lanza está oxidada, será mejor que tú hagas el trabajo sucio.'] }
];

export const mapData = [
    { rarity: 'Común', css: 'rarity-comun', colorClass: 'color-comun', colorHex: '#888', recLevel: '1-3', newEnemies: [{ name: 'Slime', hp: 15, atk: 7, def: 1, mag: 2, gold: 3, xp: 4, img: 'img/enemies/green_slime.png' }, { name: 'Rata', hp: 12, atk: 9, def: 0, mag: 0, gold: 3, xp: 4, img: 'img/enemies/rat.png' }], boss: { name: 'Slime Gigante', hp: 50, atk: 12, def: 3, mag: 4, trait: 'regen', gold: 25, xp: 25, img: 'img/bosses/giant_slime.png' }, 
      shop: { 
        weapons: [
            { name: 'Daga de Hierro', atk: 3, mag: 0, price: 30, icon: 'iron_dagger.png' },
            { name: 'Varita Astillada', atk: 0, mag: 4, price: 30, icon: 'wood_staff.png' },
            { name: 'Arco de Madera', atk: 2, mag: 1, price: 30, icon: 'wood_bow.png' }
        ], 
        armors: [
            { name: 'Chaleco de Cuero', def: 2, hpBonus: 15, mpBonus: 0, price: 40, icon: 'leather_vest.png' },
            { name: 'Túnica Rasgada', def: 1, hpBonus: 0, mpBonus: 20, price: 40, icon: 'torn_robe.png' },
            { name: 'Capa de Cazador', def: 1, hpBonus: 10, mpBonus: 5, price: 40, icon: 'hunter_cloak.png' }
        ] 
      } 
    },
    { rarity: 'Poco Común', css: 'rarity-pococomun', colorClass: 'color-pococomun', colorHex: '#4caf50', recLevel: '4-6', newEnemies: [{ name: 'Goblin', hp: 25, atk: 12, def: 2, mag: 0, gold: 6, xp: 8, img: 'img/enemies/goblin.png' }], boss: { name: 'Rey Goblin', hp: 90, atk: 18, def: 4, mag: 5, trait: 'crit', gold: 60, xp: 40, img: 'img/bosses/king_goblin.png' }, 
      shop: { 
        weapons: [
            { name: 'Espada de Acero', atk: 7, mag: 0, price: 90, icon: 'steel_sword.png' },
            { name: 'Cetro de Cristal', atk: 0, mag: 8, price: 90, icon: 'crystal_scepter.png' },
            { name: 'Arco Compuesto', atk: 5, mag: 2, price: 90, icon: 'composite_bow.png' }
        ], 
        armors: [
            { name: 'Cota de Malla', def: 4, hpBonus: 30, mpBonus: 0, price: 120, icon: 'chainmail.png' },
            { name: 'Manto Místico', def: 2, hpBonus: 10, mpBonus: 40, price: 120, icon: 'mystic_mantle.png' },
            { name: 'Jubón Reforzado', def: 3, hpBonus: 20, mpBonus: 10, price: 120, icon: 'reinforced_tunic.png' }
        ] 
      } 
    },
    { rarity: 'Raro', css: 'rarity-raro', colorClass: 'color-raro', colorHex: '#2196f3', recLevel: '7-10', newEnemies: [{ name: 'Lobo Oscuro', hp: 40, atk: 18, def: 3, mag: 0, gold: 12, xp: 14, img: 'img/enemies/dark_wolf.png' }], boss: { name: 'Bestia Alfa', hp: 150, atk: 25, def: 6, mag: 8, trait: 'crit', gold: 120, xp: 80, img: 'img/bosses/aplha_beast.png' }, 
      shop: { 
        weapons: [
            { name: 'Espada Larga', atk: 12, mag: 0, price: 250, icon: 'long_sword.png' },
            { name: 'Bastón Lunar', atk: 0, mag: 14, price: 250, icon: 'lunar_staff.png' },
            { name: 'Arco Largo', atk: 10, mag: 3, price: 250, icon: 'long_bow.png' }
        ], 
        armors: [
            { name: 'Armadura de Acero', def: 8, hpBonus: 60, mpBonus: 0, price: 400, icon: 'steel_armor.png' },
            { name: 'Túnica Estelar', def: 4, hpBonus: 15, mpBonus: 80, price: 400, icon: 'stellar_robe.png' },
            { name: 'Armadura Ligera', def: 6, hpBonus: 40, mpBonus: 20, price: 400, icon: 'light_armor.png' }
        ] 
      } 
    },
    { rarity: 'Épico', css: 'rarity-epico', colorClass: 'color-epico', colorHex: '#9c27b0', recLevel: '11-15', newEnemies: [{ name: 'Caballero Maldito', hp: 65, atk: 25, def: 6, mag: 10, gold: 25, xp: 28, img: 'img/enemies/cursed_knight.png' }], boss: { name: 'Caballero Oscuro', hp: 250, atk: 35, def: 10, mag: 15, trait: 'vampire', gold: 250, xp: 150, img: 'img/bosses/dark_knight.png' }, 
      shop: { 
        weapons: [
            { name: 'Mandoble Oscuro', atk: 20, mag: 0, price: 750, icon: 'dark_greatsword.png' },
            { name: 'Bastón del Vacío', atk: 0, mag: 23, price: 750, icon: 'void_staff.png' },
            { name: 'Arco de Sombras', atk: 16, mag: 6, price: 750, icon: 'shadow_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Oscura', def: 15, hpBonus: 120, mpBonus: 0, price: 1200, icon: 'dark_plate.png' },
            { name: 'Túnica Espectral', def: 7, hpBonus: 30, mpBonus: 150, price: 1200, icon: 'spectral_robe.png' },
            { name: 'Manto de Asesino', def: 11, hpBonus: 80, mpBonus: 40, price: 1200, icon: 'assassin_mantle.png' }
        ] 
      } 
    },
    { rarity: 'Legendario', css: 'rarity-legendario', colorClass: 'color-legendario', colorHex: '#ff9800', recLevel: '16-20', newEnemies: [{ name: 'Demonio Infernal', hp: 100, atk: 35, def: 8, mag: 20, gold: 50, xp: 60, img: 'img/enemies/infernal_demon.png' }], boss: { name: 'Señor Demonio', hp: 450, atk: 50, def: 15, mag: 25, trait: 'vampire', gold: 500, xp: 300, img: 'img/bosses/lord_demon.png' }, 
      shop: { 
        weapons: [
            { name: 'Hacha del Caos', atk: 35, mag: 0, price: 2200, icon: 'chaos_axe.png' },
            { name: 'Cetro Solar', atk: 0, mag: 40, price: 2200, icon: 'solar_scepter.png' },
            { name: 'Arco de Fuego', atk: 28, mag: 10, price: 2200, icon: 'fire_bow.png' }
        ], 
        armors: [
            { name: 'Coraza del Caos', def: 25, hpBonus: 250, mpBonus: 0, price: 3500, icon: 'chaos_plate.png' },
            { name: 'Manto Infernal', def: 12, hpBonus: 50, mpBonus: 300, price: 3500, icon: 'infernal_mantle.png' },
            { name: 'Armadura Escamada', def: 18, hpBonus: 150, mpBonus: 80, price: 3500, icon: 'scaled_armor.png' }
        ] 
      } 
    },
    { rarity: 'Mítico', css: 'rarity-mitico', colorClass: 'color-mitico', colorHex: '#ffeb3b', recLevel: '21+', newEnemies: [{ name: 'Dragón Antiguo', hp: 180, atk: 50, def: 12, mag: 30, gold: 100, xp: 120, img: 'img/enemies/dragon.png' }], boss: { name: 'Dragón Dorado', hp: 800, atk: 70, def: 25, mag: 40, trait: 'regen', gold: 1000, xp: 600, img: 'img/bosses/golden_dragon.png' }, 
      shop: { 
        weapons: [
            { name: 'Lanza Divina', atk: 60, mag: 0, price: 6500, icon: 'divine_spear.png' },
            { name: 'Báculo del Tiempo', atk: 0, mag: 68, price: 6500, icon: 'time_staff.png' },
            { name: 'Arco Celestial', atk: 50, mag: 15, price: 6500, icon: 'celestial_bow.png' }
        ], 
        armors: [
            { name: 'Coraza Divina', def: 40, hpBonus: 500, mpBonus: 0, price: 12000, icon: 'divine_plate.png' },
            { name: 'Túnica Astral', def: 20, hpBonus: 100, mpBonus: 600, price: 12000, icon: 'astral_robe.png' },
            { name: 'Manto Etéreo', def: 30, hpBonus: 300, mpBonus: 200, price: 12000, icon: 'ethereal_mantle.png' }
        ] 
      } 
    }
];
