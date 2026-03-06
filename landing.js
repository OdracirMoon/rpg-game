// ==========================================
// CONFIGURACIÓN PRINCIPAL
// ==========================================
// Base para las claves de guardado. Las ranuras serán 1, 2 y 3.
const BASE_SAVE_KEY = 'miniRPG_WorldSave_';

// ==========================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================
// Botones del menú principal
const btnJugar = document.getElementById('btn-jugar'); // MODO LOCAL
const btnCargarPartida = document.getElementById('btn-cargar-partida'); // IMPORTAR JSON
const btnTienda = document.getElementById('btn-tienda');

// Modales (Ventanas ocultas)
const modalRanuras = document.getElementById('modal-ranuras');
const modalCargar = document.getElementById('modal-cargar');
const modalTienda = document.getElementById('modal-tienda');

// Elementos dentro de los modales
const btnCerrarRanuras = document.getElementById('btn-cerrar-ranuras');
const btnCerrarCargar = document.getElementById('btn-cerrar-cargar');
const btnCerrarTienda = document.getElementById('btn-cerrar-tienda');

const inputArchivoPartida = document.getElementById('input-archivo-partida');
const btnProcesarCarga = document.getElementById('btn-procesar-carga');

const slotBtns = document.querySelectorAll('.slot-btn');

// ==========================================
// LÓGICA DE RANURAS DE GUARDADO
// ==========================================

// Función para leer qué hay en cada ranura y actualizar los textos
function actualizarTextosRanuras() {
    slotBtns.forEach(btn => {
        const slot = btn.getAttribute('data-slot');
        const statusSpan = document.getElementById(`slot-${slot}-status`);
        
        // Buscamos si existe la clave ej: 'miniRPG_WorldSave_1'
        const savedData = localStorage.getItem(BASE_SAVE_KEY + slot);
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                const p = parsed.playerData;
                // Si la partida existe, mostramos el nivel y la clase
                statusSpan.textContent = `Nivel ${p.level} - ${p.playerClass}`;
                statusSpan.style.color = "#4caf50"; // Verde brillante
            } catch (error) {
                statusSpan.textContent = "Datos corruptos";
                statusSpan.style.color = "#e55353"; // Rojo
            }
        } else {
            statusSpan.textContent = "Vacía";
            statusSpan.style.color = "#aaa"; // Gris
        }
    });
}

// Abrir el menú de ranuras
btnJugar.addEventListener('click', () => {
    actualizarTextosRanuras();
    modalRanuras.classList.remove('hidden');
});

// Cerrar el menú de ranuras
btnCerrarRanuras.addEventListener('click', () => {
    modalRanuras.classList.add('hidden');
});

// Acción al hacer clic en una ranura específica
slotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const slot = btn.getAttribute('data-slot');
        
        // Guardamos en la memoria de la sesión qué ranura elegimos
        // para que el juego sepa de dónde cargar y dónde guardar.
        sessionStorage.setItem('activeSlot', slot);
        
        // Redirigimos al juego
        window.location.href = 'game/index.html';
    });
});


// ==========================================
// LÓGICA DE OTROS MODALES (IMPORTAR Y TIENDA)
// ==========================================

// Abrir Modal Cargar
btnCargarPartida.addEventListener('click', () => {
    modalCargar.classList.remove('hidden');
});

// Cerrar Modal Cargar
btnCerrarCargar.addEventListener('click', () => {
    modalCargar.classList.add('hidden');
    inputArchivoPartida.value = ''; 
});

// Abrir Modal Tienda
btnTienda.addEventListener('click', () => {
    modalTienda.classList.remove('hidden');
});

// Cerrar Modal Tienda
btnCerrarTienda.addEventListener('click', () => {
    modalTienda.classList.add('hidden');
});


// ==========================================
// LÓGICA PARA IMPORTAR ARCHIVO JSON
// ==========================================
btnProcesarCarga.addEventListener('click', () => {
    const archivo = inputArchivoPartida.files[0];

    if (!archivo) {
        alert("Por favor, selecciona un archivo .json primero.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function(evento) {
        try {
            const contenido = evento.target.result;
            const datosPartida = JSON.parse(contenido);

            if (datosPartida && datosPartida.playerData) {
                // Forzamos guardar en la Ranura 1 como indica la interfaz
                localStorage.setItem(BASE_SAVE_KEY + '1', JSON.stringify(datosPartida));
                // Forzamos a que el juego abra la Ranura 1
                sessionStorage.setItem('activeSlot', '1');
                
                alert("¡Partida importada con éxito en la Ranura 1! Entrando al juego...");
                window.location.href = 'game/index.html';
            } else {
                throw new Error("Formato incorrecto.");
            }
        } catch (error) {
            console.error("Error al leer:", error);
            alert("Error: El archivo no es un JSON válido o está corrupto.");
        }
    };

    lector.readAsText(archivo);
});