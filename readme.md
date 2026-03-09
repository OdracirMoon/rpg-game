# The Infinite Map - RPG Web

![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-success.svg)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-orange.svg)

The Infinite Map es un RPG web en JavaScript vanilla con exploracion en mapa tile-based, combate ATB por turnos, progresion por stats y guardado local por ranuras.

## Vista General

- Menu principal en `index.html` con:
  - Nueva partida
  - Cargar partida
  - Importar JSON
  - Tienda (UI en desarrollo)
  - Donacion/apoyo
- Juego principal en `game/index.html`.
- Motor modular ES6 (`game/js/*.js`).
- Persistencia en `localStorage` y estado de sesion en `sessionStorage`.

## Caracteristicas Implementadas

- Mapa de 100x100 tiles con render en Canvas y minimapa.
- Carga de mapa desde Tiled JSON (`map.json` con fallback a `mapa.json`).
- Render por GID con soporte de multiples tilesets.
- Sistema de zonas, NPCs, cofres, tienda y enemigos/jefes por zona.
- Combate ATB (barra de iniciativa) con dano fisico/magico, critico, robo de vida, penetraciones y estados.
- Arbol de habilidades y grimorio con skills equipables (especial y defensiva).
- Progresion por nivel: puntos de stats + puntos de skill.
- Inventario de armas, armaduras y accesorios.
- 3 ranuras de guardado + exportar/importar JSON.
- Checkpoints para reaparicion tras muerte.

## Clases y Recursos

- Guerrero (usa EP): enfoque AD/armadura.
- Arquero (usa EP): dano sostenido, veneno y rango.
- Mago (usa MP): burst magico y autocuracion.
- Simple: base equilibrada con ventaja economica.

## Controles

- Movimiento: `W`, `A`, `S`, `D` o flechas.
- Menu del sistema: `ESC`.
- En movil: D-pad tactil y botones UI en pantalla.
- Interaccion: acercarse e intentar avanzar sobre la casilla objetivo (enemigo, cofre, NPC, tienda).

## Arquitectura del Proyecto

Raiz:
- `index.html`: landing y seleccion de modo/ranura.
- `landing.js`: logica de modales, ranuras e importacion rapida desde landing.
- `landing.css`: estilos del menu principal.

Juego:
- `game/index.html`: interfaz principal del juego (HUD, modales, combate, minimapa).
- `game/style.css`: estilos del juego.
- `game/js/state.js`: estado global en memoria (`gameState`).
- `game/js/data.js`: datos estaticos (personajes, skills, formulas, enemigos, tiendas).
- `game/js/main.js`: inicializacion, seleccion de personaje, guardado/carga/export/import.
- `game/js/map.js`: generacion/carga de mundo, movimiento, render Canvas, minimapa, spawn de entidades.
- `game/js/combat.js`: motor de combate, turnos, skills, victoria/derrota, checkpoints.
- `game/js/ui.js`: HUD, logs, inventario, stats, grimorio y modales.
- `game/js/audio.js`: SFX y BGM.

Assets:
- `game/img/*`: tiles, player, enemies, bosses, items, NPCs.
- `game/sounds/*`: audio ambiente, combate, UI, etc.

## Guardado y Datos

- Claves de guardado por ranura:
  - `miniRPG_WorldSave_1`
  - `miniRPG_WorldSave_2`
  - `miniRPG_WorldSave_3`
- El slot activo se mantiene en `sessionStorage` como `activeSlot`.
- La accion de inicio (`new` o `load`) se guarda como `gameAction`.

## Ejecutar en Local

Como usa modulos ES (`import/export`), no abrir con doble clic. Usa servidor local.

Opcion VS Code (recomendada):
1. Instala la extension Live Server.
2. Abre `index.html` (raiz) con Live Server.

Opcion Python:
1. En la raiz del proyecto ejecuta: `python -m http.server 8000`
2. Abre: `http://localhost:8000`

Opcion Node:
1. Instala `http-server`: `npm i -g http-server`
2. Ejecuta en la raiz: `http-server`

## Estado del Proyecto

- Modo local: funcional.
- Modo online: en desarrollo.
- Tienda de landing: interfaz presente, contenido de compra pendiente.

## Licencia

Este repositorio incluye archivo `LICENSE` en la raiz.