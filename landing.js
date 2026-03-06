document.addEventListener('DOMContentLoaded', () => {
    const btnJugar = document.getElementById('btn-jugar');
    const modalModoLocal = document.getElementById('modal-modo-local');
    const btnNuevaPartida = document.getElementById('btn-nueva-partida');
    const btnCargarPartida = document.getElementById('btn-cargar-partida');
    const btnCerrarModoLocal = document.getElementById('btn-cerrar-modo-local');
    
    const modalRanuras = document.getElementById('modal-ranuras');
    const btnCerrarRanuras = document.getElementById('btn-cerrar-ranuras');
    const tituloRanuras = document.getElementById('titulo-ranuras');
    const slots = document.querySelectorAll('.slot-btn');

    let currentAction = ''; // Guardará 'new' o 'load'

    // Función que lee el localStorage para saber qué hay en cada ranura
    function updateSlotsUI() {
        for(let i=1; i<=3; i++) {
            const dataStr = localStorage.getItem('miniRPG_WorldSave_' + i);
            const statusSpan = document.getElementById('slot-' + i + '-status');
            
            if(dataStr) {
                try {
                    const data = JSON.parse(dataStr);
                    const name = data.playerData.characterName || data.playerData.playerClass || 'Héroe';
                    const lvl = data.playerData.level || 1;
                    statusSpan.textContent = `${name} (Lv.${lvl})`;
                    statusSpan.style.color = '#ffeb3b'; // Amarillo para ocupado
                } catch(e) {
                    statusSpan.textContent = "Datos Corruptos";
                    statusSpan.style.color = '#f44336'; // Rojo error
                }
            } else {
                statusSpan.textContent = "Vacía";
                statusSpan.style.color = '#aaa'; // Gris vacío
            }
        }
    }

    // Eventos de botones
    btnJugar.addEventListener('click', () => { modalModoLocal.classList.remove('hidden'); });
    btnCerrarModoLocal.addEventListener('click', () => { modalModoLocal.classList.add('hidden'); });

    btnNuevaPartida.addEventListener('click', () => {
        currentAction = 'new';
        tituloRanuras.textContent = "NUEVA PARTIDA: Elige Ranura";
        modalModoLocal.classList.add('hidden');
        updateSlotsUI();
        modalRanuras.classList.remove('hidden');
    });

    btnCargarPartida.addEventListener('click', () => {
        currentAction = 'load';
        tituloRanuras.textContent = "CARGAR PARTIDA: Elige Ranura";
        modalModoLocal.classList.add('hidden');
        updateSlotsUI();
        modalRanuras.classList.remove('hidden');
    });

    btnCerrarRanuras.addEventListener('click', () => {
        modalRanuras.classList.add('hidden');
        modalModoLocal.classList.remove('hidden'); // Vuelve al paso anterior
    });

    // Lógica al seleccionar la Ranura 1, 2 o 3
    slots.forEach(btn => {
        btn.addEventListener('click', () => {
            const slotNum = btn.getAttribute('data-slot');
            const saveKey = 'miniRPG_WorldSave_' + slotNum;
            const hasData = localStorage.getItem(saveKey);
            
            if (currentAction === 'new') {
                if (hasData) {
                    if(!confirm(`La Ranura ${slotNum} ya tiene una partida. ¿Deseas SOBRESCRIBIRLA? Perderás todo el progreso anterior.`)) {
                        return; // Si dice que no, cancelamos
                    }
                }
                // Limpiamos la ranura de inmediato para evitar bugs
                localStorage.removeItem(saveKey); 
                sessionStorage.setItem('activeSlot', slotNum);
                sessionStorage.setItem('gameAction', 'new');
                window.location.href = 'game/index.html';

            } else if (currentAction === 'load') {
                if (!hasData) {
                    alert(`La Ranura ${slotNum} está vacía. Selecciona otra ranura o inicia una Nueva Partida.`);
                    return;
                }
                sessionStorage.setItem('activeSlot', slotNum);
                sessionStorage.setItem('gameAction', 'load');
                window.location.href = 'game/index.html';
            }
        });
    });
});
