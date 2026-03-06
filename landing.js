// ==========================================
// CONFIGURACIÓN PRINCIPAL
// ==========================================
// Esta es la clave que usaremos para guardar y buscar la partida en el navegador (localStorage).
// Si tu juego ya usa una clave diferente, puedes cambiar el nombre aquí.
const SAVE_KEY = 'miniRPG_WorldSave';

// ==========================================
// REFERENCIAS A ELEMENTOS DEL DOM (HTML)
// ==========================================
// Botones del menú principal
const btnJugar = document.getElementById('btn-jugar');
const btnNuevaPartida = document.getElementById('btn-nueva-partida');
const btnCargarPartida = document.getElementById('btn-cargar-partida');
const btnTienda = document.getElementById('btn-tienda');

// Modales (Ventanas ocultas)
const modalCargar = document.getElementById('modal-cargar');
const modalTienda = document.getElementById('modal-tienda');

// Elementos dentro de los modales
const btnCerrarCargar = document.getElementById('btn-cerrar-cargar');
const btnCerrarTienda = document.getElementById('btn-cerrar-tienda');
const inputArchivoPartida = document.getElementById('input-archivo-partida');
const btnProcesarCarga = document.getElementById('btn-procesar-carga');

// ==========================================
// LÓGICA DE LOS BOTONES DEL MENÚ
// ==========================================

// 1. BOTÓN JUGAR (Continuar o Empezar)
btnJugar.addEventListener('click', () => {
    // Si la partida existe, el juego la leerá automáticamente al abrirse.
    // Si no existe, el juego iniciará una nueva. 
    // Por lo tanto, solo necesitamos redirigir a la carpeta /game
    window.location.href = 'game/index.html';
});

// 2. BOTÓN NUEVA PARTIDA
btnNuevaPartida.addEventListener('click', () => {
    // Pedimos confirmación por si el jugador hace clic por accidente
    const confirmar = confirm("¿Estás seguro de iniciar una nueva partida? Cualquier progreso no exportado se perderá.");
    
    if (confirmar) {
        // Borramos la partida del localStorage
        localStorage.removeItem(SAVE_KEY);
        // Redirigimos al juego (que al no encontrar partida, empezará de cero)
        window.location.href = 'game/index.html';
    }
});

// ==========================================
// LÓGICA DE MODALES (ABRIR Y CERRAR)
// ==========================================

// Abrir Modal Cargar
btnCargarPartida.addEventListener('click', () => {
    modalCargar.classList.remove('hidden');
});

// Cerrar Modal Cargar
btnCerrarCargar.addEventListener('click', () => {
    modalCargar.classList.add('hidden');
    inputArchivoPartida.value = ''; // Limpiamos el input por si había seleccionado algo
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

    // Verificamos si el usuario realmente seleccionó un archivo
    if (!archivo) {
        alert("Por favor, selecciona un archivo .json primero.");
        return;
    }

    // Usamos FileReader para leer el contenido del archivo en el navegador
    const lector = new FileReader();

    lector.onload = function(evento) {
        try {
            // Obtenemos el texto del archivo
            const contenido = evento.target.result;
            
            // Verificamos que sea un JSON válido parseándolo
            const datosPartida = JSON.parse(contenido);

            // Verificamos de forma muy básica que parezca un archivo de nuestro juego
            // (En el futuro, aquí comprobaremos la versión del guardado)
            if (datosPartida) {
                // Guardamos el JSON convertido a string en el localStorage
                localStorage.setItem(SAVE_KEY, JSON.stringify(datosPartida));
                
                alert("¡Partida cargada con éxito! Entrando al juego...");
                
                // Redirigimos al juego
                window.location.href = 'game/index.html';
            } else {
                throw new Error("El archivo no tiene el formato correcto.");
            }

        } catch (error) {
            console.error("Error al leer el archivo:", error);
            alert("Error: El archivo no es un JSON válido o está corrupto.");
        }
    };

    // Si ocurre un error de lectura de hardware/navegador
    lector.onerror = function() {
        alert("Hubo un error al intentar leer el archivo desde tu dispositivo.");
    };

    // Iniciamos la lectura del archivo como texto
    lector.readAsText(archivo);
});
