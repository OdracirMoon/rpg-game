# 🗺️ The Infinite Map - Mini RPG Web

![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-blue.svg)
![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-success.svg)
![Tecnologías](https://img.shields.io/badge/Tecnolog%C3%ADas-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-orange.svg)

**The Infinite Map** es un juego de rol (RPG) clásico por turnos, construido íntegramente con tecnologías web nativas (Vanilla HTML, CSS y JavaScript moderno). Diseñado para ser ligero, altamente escalable y jugable tanto en navegadores de escritorio como en dispositivos móviles.

---

## ✨ Características Principales

* **🗺️ Exploración de Mundo Infinito:** Generación de mapa por cuadrícula (Tile-based) utilizando un sistema de renderizado de vista (Viewport Rendering) en el DOM para un rendimiento óptimo sin Canvas.
* **⚔️ Combate por Turnos Dinámico:** Sistema de batallas con cálculo de daño físico y mágico, estados alterados (veneno, escudos) y evasión.
* **🌳 Árbol de Habilidades y Grimorio:** Los jugadores obtienen *Skill Points (SP)* al subir de nivel para desbloquear hechizos avanzados y pueden equiparlos de forma dinámica en su Grimorio.
* **📈 Progresión Personalizada:** Al subir de nivel, el jugador recibe puntos para distribuir manualmente entre sus atributos (Vida, Maná, Energía, Ataque, Magia y Defensa).
* **💾 Sistema de Guardado Avanzado:** * 3 Ranuras de guardado independientes en `localStorage`.
  * Exportación e Importación de partidas a través de archivos `.json`.
  * Sistema de **Checkpoints** (Puntos de control) que permite revivir en el último nivel o tras el último Jefe derrotado, sin perder la partida entera.
* **🎒 Inventario y Tienda:** Sistema completo de mochila, equipamiento de armas/armaduras, uso de pociones (HP, MP, EP) y mecánicas de compra/venta de botín.
* **📜 Misiones (Quests) y NPCs:** Interacción con personajes del mapa para recibir tareas de cacería o recolección a cambio de recompensas.

---

## 🧙‍♂️ Clases Jugables

1. **Guerrero:** Especialista en daño físico y aguante. (Usa Energía - EP). *Habilidades destacadas: Golpe Brutal, Piel de Hierro.*
2. **Arquero:** Daño ágil y letal con estados alterados. (Usa Energía - EP). *Habilidades destacadas: Lluvia de Flechas, Trampa Letal.*
3. **Mago:** Frágil pero con poder destructivo masivo. (Usa Maná - MP). *Habilidades destacadas: Meteorito, Drenar Vida.*
4. **Simple:** Sin entrenamiento militar formal, pero comienza con una ventaja económica (+100 Oro).

---

## 🎮 Controles

El juego detecta automáticamente si estás en un dispositivo móvil o de escritorio.

* **Movimiento:** Teclas `W`, `A`, `S`, `D` o `Flechas Direccionales`. En móvil: D-Pad táctil en pantalla.
* **Menú Principal:** Tecla `[ESC]` o botón "☰ Menú" en móvil.
* **Interacciones:** Acércate a un enemigo, cofre o NPC e intenta caminar hacia su casilla para interactuar/atacar.

---

## 🛠️ Arquitectura del Código (Para Desarrolladores)

El proyecto utiliza **ES6 Modules** para mantener el código limpio y mantenible, separado por responsabilidades dentro de la carpeta `/game/js/`:

* `state.js`: Contiene el objeto global `gameState`. Es la "memoria" RAM del juego (posición del jugador, inventario, banderas, puntos de habilidad).
* `data.js`: Base de datos estática. Contiene la información de los mapas, atributos de enemigos, diálogos de NPCs y el diccionario maestro de Habilidades (`skillsData`).
* `main.js`: Punto de entrada de la aplicación. Maneja el bucle de inicialización, la selección de clase, el guardado/carga y los eventos de teclado.
* `map.js`: Lógica del renderizado del mapa. Actualiza el "Viewport" (FOV) y calcula las colisiones y el movimiento.
* `combat.js`: Motor matemático del juego. Calcula el daño, la experiencia, el uso de habilidades mágicas y maneja los Checkpoints.
* `ui.js`: Manipulación del DOM. Maneja los paneles modales (Inventario, Tienda, Grimorio, Árbol de Habilidades) y la barra de vida en pantalla.
* `audio.js`: Sistema de gestión de efectos de sonido (SFX) y música de fondo (BGM).

---

## 🚀 Instalación y Uso Local

Dado que el juego utiliza Módulos ES6 (`import`/`export`), no puede ejecutarse simplemente abriendo el archivo `index.html` con doble clic debido a las políticas de seguridad CORS de los navegadores. **Necesitas un servidor local.**

**Opción 1: Visual Studio Code (Recomendada)**
1. Instala la extensión **Live Server**.
2. Haz clic derecho sobre el archivo `/index.html` de la carpeta raíz.
3. Selecciona *Open with Live Server*.

**Opción 2: NodeJS / Python**
* En NodeJS: Instala `http-server` (`npm install -g http-server`) y ejecuta `http-server` en el directorio.
* En Python: Ejecuta `python -m http.server 8000` en tu terminal.

---

## 🗺️ Hoja de Ruta (Roadmap)

- [x] Subida de nivel con estadísticas elegibles.
- [x] Sistema de Checkpoints por muerte.
- [x] 4 botones de combate y habilidades dinámicas.
- [x] Árbol de habilidades con requisitos.
- [ ] Reemplazar la iconografía actual (basada en Emojis) por Assets (imágenes PNG/SVG).
- [ ] Implementar un Minimapa visual de la zona descubierta.
- [ ] MODO ONLINE: Refactorización hacia servidor autoritativo para multijugador, rankings y economía online.

---

## 📄 Licencia y Créditos

Desarrollado con ❤️ para la comunidad de juegos web indie.
Si deseas aportar, ¡siéntete libre de hacer un fork y proponer mejoras!