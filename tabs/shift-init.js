// Vista de inicio de turno

// Cajas fijas del sistema (namespace para evitar conflictos)
const SHIFT_INIT_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos'
};

// Turnos disponibles (namespace para evitar conflictos)
const SHIFT_INIT_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

let shiftInitData = {
  date: '',
  shift: '',
  cashierName: '',
  boxes: {
    'mostrador': {
      initialFund: null,
      initialFundBreakdown: null
    },
    'banca-juegos': {
      initialFund: null,
      initialFundBreakdown: null
    }
  },
  productCounts: {
    'cafe-senior': null,
    'cigarros-grandes': null,
    'cigarros-chicos': null,
    'tabaco': null
  }
};

let isStartingShift = false; // Bandera para prevenir múltiples clics

// Obtener fecha actual en formato YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Determinar turno según la hora actual
function getDefaultShift() {
  const now = new Date();
  const hour = now.getHours();
  // Turno mañana: antes de las 14:00 (2:00 PM)
  // Turno tarde: desde las 14:00 en adelante
  return hour < 14 ? 'mañana' : 'tarde';
}

// Formatear fecha para mostrar
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Cargar vista de inicio
function loadInitView() {
  logger.debug('Loading shift init view');
  const container = document.getElementById('shift-init-view');
  if (!container) {
    logger.warn('Shift init view container not found');
    return;
  }
  
  // Resetear datos
  shiftInitData = {
    date: getTodayDate(),
    shift: getDefaultShift(), // Establecer turno por defecto según hora actual
    cashierName: '',
    boxes: {
      'mostrador': {
        initialFund: null,
        initialFundBreakdown: null
      },
      'banca-juegos': {
        initialFund: null,
        initialFundBreakdown: null
      }
    },
    productCounts: {
      'cafe-senior': null,
      'cigarros-grandes': null,
      'cigarros-chicos': null,
      'tabaco': null
    }
  };
  
  renderInitView();
}

// Renderizar vista de inicio
function renderInitView() {
  const container = document.getElementById('shift-init-view');
  if (!container) return;
  
  const formattedDate = formatDate(shiftInitData.date);
  const mostradorFund = shiftInitData.boxes.mostrador.initialFund || '';
  const bancaFund = shiftInitData.boxes['banca-juegos'].initialFund || '';
  const cafeSeniorCount = shiftInitData.productCounts['cafe-senior'] || '';
  const cigarrosGrandesCount = shiftInitData.productCounts['cigarros-grandes'] || '';
  const cigarrosChicosCount = shiftInitData.productCounts['cigarros-chicos'] || '';
  const tabacoCount = shiftInitData.productCounts['tabaco'] || '';
  
  const html = `
    <div class="w-full h-full bg-white flex flex-col">
      <!-- Header -->
      <div class="bg-green-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
        <div>
          <h2 class="text-xl font-semibold tracking-tight">Iniciar Turno</h2>
          <p class="text-sm text-white/90 mt-1">Complete los datos para iniciar un nuevo turno</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="exit-fullscreen-init-btn" onclick="exitFullscreenInit()" 
            class="text-white hover:text-gray-200 text-xl font-light w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors  hidden"
            title="Salir de pantalla completa">
            ⛶
          </button>
          <button id="enter-fullscreen-init-btn" onclick="enterFullscreenInit()" 
            class="text-white hover:text-gray-200 text-xl font-light w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors "
            title="Pantalla completa">
            ⛶
          </button>
          <button onclick="backToShifts()" 
            class="text-white hover:text-gray-200 text-3xl font-light w-10 h-10 flex items-center justify-center hover:bg-white/20 transition-colors "
            title="Cerrar">
            ×
          </button>
        </div>
      </div>
      
      <div class="flex-1 p-6 space-y-6 w-full overflow-y-auto">
        <!-- Fecha -->
        <div>
          <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Fecha</label>
          <input type="date" id="init-date" value="${shiftInitData.date}" required
            class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
        </div>
        
        <!-- Turno -->
        <div>
          <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Turno</label>
          <select id="init-shift" required
            class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
            <option value="">Seleccione un turno</option>
            <option value="mañana" ${shiftInitData.shift === 'mañana' ? 'selected' : ''}>Turno Mañana</option>
            <option value="tarde" ${shiftInitData.shift === 'tarde' ? 'selected' : ''}>Turno Tarde</option>
          </select>
        </div>
        
        <!-- Nombre de Cajera -->
        <div>
          <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Nombre de Cajera</label>
          <input type="text" id="init-cashier-name" value="${shiftInitData.cashierName}" required
            placeholder="Ingrese el nombre de la cajera"
            class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
        </div>
        
        <!-- Fondo Caja Mostrador -->
        <div class="border-2 border-gray-200  p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Caja Mostrador</h3>
          <div class="space-y-4">
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Fondo Recibido</label>
              <div class="flex gap-3">
                <input type="number" id="init-fund-mostrador" step="0.01" min="0" value="${mostradorFund}" required
                  placeholder="0.00"
                  class="flex-1 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
                <button type="button" onclick="registerInitialFundBreakdown('mostrador')"
                  class="px-6 py-4 border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-colors uppercase tracking-wider text-base font-medium  min-w-[120px]">
                  Desglose
                </button>
              </div>
              <div id="init-fund-mostrador-breakdown" class="mt-2 text-sm text-gray-500"></div>
            </div>
          </div>
        </div>
        
        <!-- Fondo Caja Banca de Juegos -->
        <div class="border-2 border-gray-200  p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Caja Banca de Juegos</h3>
          <div class="space-y-4">
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Fondo Recibido</label>
              <div class="flex gap-3">
                <input type="number" id="init-fund-banca-juegos" step="0.01" min="0" value="${bancaFund}" required
                  placeholder="0.00"
                  class="flex-1 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
                <button type="button" onclick="registerInitialFundBreakdown('banca-juegos')"
                  class="px-6 py-4 border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-colors uppercase tracking-wider text-base font-medium  min-w-[120px]">
                  Desglose
                </button>
              </div>
              <div id="init-fund-banca-juegos-breakdown" class="mt-2 text-sm text-gray-500"></div>
            </div>
          </div>
        </div>
        
        <!-- Conteo de Productos -->
        <div class="border-2 border-gray-200  p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Conteo de Productos</h3>
          <p class="text-sm text-gray-600 mb-4">Registre el conteo inicial de productos controlados en este turno</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Café Senior</label>
              <input type="number" id="init-product-cafe-senior" step="1" min="0" value="${cafeSeniorCount}" required
                placeholder="0"
                class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
            </div>
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Cigarros Grandes</label>
              <input type="number" id="init-product-cigarros-grandes" step="1" min="0" value="${cigarrosGrandesCount}" required
                placeholder="0"
                class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
            </div>
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Cigarros Chicos</label>
              <input type="number" id="init-product-cigarros-chicos" step="1" min="0" value="${cigarrosChicosCount}" required
                placeholder="0"
                class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
            </div>
            <div>
              <label class="block mb-3 text-base uppercase tracking-wider text-gray-700 font-medium">Tabaco</label>
              <input type="number" id="init-product-tabaco" step="1" min="0" value="${tabacoCount}" required
                placeholder="0"
                class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-green-600 bg-white text-lg ">
            </div>
          </div>
        </div>
        
        <!-- Botones -->
        <div class="flex flex-col gap-4 pt-6 border-t-2 border-gray-200">
          <button onclick="backToShifts()"
            class="w-full px-6 py-5 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base font-medium ">
            Cancelar
          </button>
          <button onclick="startShift()"
            class="w-full px-6 py-5 bg-green-600 text-white border-2 border-green-600 hover:bg-green-700 transition-colors uppercase tracking-wider text-base font-semibold ">
            Iniciar Turno
          </button>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Configurar event listeners directos para los botones de fullscreen
  const enterBtn = document.getElementById('enter-fullscreen-init-btn');
  const exitBtn = document.getElementById('exit-fullscreen-init-btn');
  
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      logger.debug('Enter fullscreen init button clicked (via addEventListener)');
      window.enterFullscreenInit();
    });
  }
  
  if (exitBtn) {
    exitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      logger.debug('Exit fullscreen init button clicked (via addEventListener)');
      window.exitFullscreenInit();
    });
  }
  
  // Actualizar breakdowns si existen
  updateBreakdownDisplay('mostrador');
  updateBreakdownDisplay('banca-juegos');
  
  // Actualizar botones de fullscreen después de que el DOM se actualice
  setTimeout(() => {
    updateFullscreenInitButtons();
    
    // Intentar activar fullscreen automáticamente (puede fallar si no hay gesto del usuario)
    // El usuario puede usar el botón si la activación automática falla
    try {
      enterFullscreenInit();
    } catch (error) {
      logger.debug('Auto fullscreen failed (expected if no user gesture)', error);
    }
  }, 100);
}

// Actualizar display de breakdown
function updateBreakdownDisplay(box) {
  const breakdown = shiftInitData.boxes[box].initialFundBreakdown;
  const displayEl = document.getElementById(`init-fund-${box}-breakdown`);
  if (displayEl && breakdown) {
    const formatted = window.cashBreakdownUtils?.formatBreakdown(breakdown);
    displayEl.textContent = formatted ? `Desglose: ${formatted}` : '';
  }
}

// Registrar desglose de fondo (global para onclick)
window.registerInitialFundBreakdown = async function(box) {
  const currentFund = shiftInitData.boxes[box].initialFund;
  if (!currentFund || currentFund <= 0) {
    await showError('Primero ingrese el monto del fondo');
    return;
  }
  
  const breakdown = await showCashBreakdownModal(
    `Desglose de Fondo - ${SHIFT_INIT_BOXES[box]}`,
    shiftInitData.boxes[box].initialFundBreakdown,
    currentFund
  );
  
  if (breakdown) {
    shiftInitData.boxes[box].initialFundBreakdown = breakdown;
    updateBreakdownDisplay(box);
  }
};

// Validar datos de inicio
function validateInitData() {
  return window.shiftValidations.validateInitShiftData(shiftInitData);
}

// Iniciar turno (global para onclick)
window.startShift = async function() {
  // Prevenir múltiples clics
  if (isStartingShift) {
    logger.debug('Shift initiation already in progress, ignoring click');
    return;
  }
  
  try {
    isStartingShift = true;
    logger.debug('Starting shift', shiftInitData);
    
    // Deshabilitar botón mientras se procesa
    const startButton = document.querySelector('button[onclick*="startShift"]');
    if (startButton) {
      startButton.disabled = true;
      startButton.style.opacity = '0.6';
      startButton.style.cursor = 'not-allowed';
    }
    
    // Validar que nrd y shifts estén disponibles
    if (!window.nrd || !window.nrd.shifts) {
      await showError('Servicios no disponibles. Por favor, recarga la página.');
      isStartingShift = false;
      if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
      }
      return;
    }
    
    // Obtener valores del formulario
    const dateInput = document.getElementById('init-date');
    const shiftSelect = document.getElementById('init-shift');
    const cashierInput = document.getElementById('init-cashier-name');
    const mostradorFundInput = document.getElementById('init-fund-mostrador');
    const bancaFundInput = document.getElementById('init-fund-banca-juegos');
    const cafeSeniorInput = document.getElementById('init-product-cafe-senior');
    const cigarrosGrandesInput = document.getElementById('init-product-cigarros-grandes');
    const cigarrosChicosInput = document.getElementById('init-product-cigarros-chicos');
    const tabacoInput = document.getElementById('init-product-tabaco');
    
    if (!dateInput || !shiftSelect || !cashierInput || !mostradorFundInput || !bancaFundInput || 
        !cafeSeniorInput || !cigarrosGrandesInput || !cigarrosChicosInput || !tabacoInput) {
      await showError('Error al obtener datos del formulario');
      isStartingShift = false;
      if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
      }
      return;
    }
    
    // Actualizar datos
    shiftInitData.date = dateInput.value;
    shiftInitData.shift = shiftSelect.value;
    shiftInitData.cashierName = cashierInput.value.trim();
    shiftInitData.boxes.mostrador.initialFund = parseFloat(mostradorFundInput.value) || 0;
    shiftInitData.boxes['banca-juegos'].initialFund = parseFloat(bancaFundInput.value) || 0;
    shiftInitData.productCounts['cafe-senior'] = parseInt(cafeSeniorInput.value) || 0;
    shiftInitData.productCounts['cigarros-grandes'] = parseInt(cigarrosGrandesInput.value) || 0;
    shiftInitData.productCounts['cigarros-chicos'] = parseInt(cigarrosChicosInput.value) || 0;
    shiftInitData.productCounts['tabaco'] = parseInt(tabacoInput.value) || 0;
    
    // Validar
    const validation = validateInitData();
    if (!validation.valid) {
      await showError(validation.errors.join('\n'));
      isStartingShift = false;
      if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
      }
      return;
    }
    
    // Verificar que no exista otro turno ACTIVO (no cerrado) para la misma fecha/turno
    const existingActiveShift = await window.nrd.shifts.getActiveShift(
      shiftInitData.date,
      shiftInitData.shift
    );
    
    if (existingActiveShift) {
      await showError(`Ya existe un turno activo ${SHIFT_INIT_SHIFTS[shiftInitData.shift]} para la fecha ${formatDate(shiftInitData.date)}. Debe cerrarlo antes de iniciar uno nuevo.`);
      isStartingShift = false;
      if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
      }
      return;
    }
    
    // Obtener email del usuario actual
    const user = window.nrd?.auth?.getCurrentUser();
    if (!user) {
      await showError('Usuario no autenticado');
      isStartingShift = false;
      if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
      }
      return;
    }
    
    showSpinner('Iniciando turno...');
    
    // Crear turno
    const shiftData = {
      date: shiftInitData.date,
      shift: shiftInitData.shift,
      cashierName: shiftInitData.cashierName,
      cashierEmail: user.email,
      closed: false,
      boxes: {
        'mostrador': {
          initialFund: shiftInitData.boxes.mostrador.initialFund,
          initialFundBreakdown: shiftInitData.boxes.mostrador.initialFundBreakdown || null
        },
        'banca-juegos': {
          initialFund: shiftInitData.boxes['banca-juegos'].initialFund,
          initialFundBreakdown: shiftInitData.boxes['banca-juegos'].initialFundBreakdown || null
        }
      },
      productCounts: {
        opening: {
          'cafe-senior': shiftInitData.productCounts['cafe-senior'],
          'cigarros-grandes': shiftInitData.productCounts['cigarros-grandes'],
          'cigarros-chicos': shiftInitData.productCounts['cigarros-chicos'],
          'tabaco': shiftInitData.productCounts['tabaco']
        }
      }
    };
    
    const shiftId = await window.nrd.shifts.create(shiftData);
    
    // Enviar notificación de inicio de turno
    if (typeof window.notifyShiftStarted === 'function') {
      try {
        const shiftWithId = { ...shiftData, id: shiftId };
        await window.notifyShiftStarted(shiftWithId);
      } catch (error) {
        // No interrumpir el flujo si falla la notificación
        logger.warn('Error al enviar notificación de inicio de turno', error);
      }
    }
    
    hideSpinner();
    
    // Salir del fullscreen antes de cambiar de vista
    const container = document.getElementById('shift-init-view');
    if (container) {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (fullscreenElement === container) {
        logger.debug('Exiting fullscreen before switching to operational view');
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        // Esperar un momento para que el fullscreen se cierre completamente
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Restaurar modales al body si estaban en fullscreen
    if (typeof window.moveModalsToFullscreen === 'function') {
      window.moveModalsToFullscreen();
    } else {
      moveModalsToFullscreenInit();
    }
    
    // Cambiar directamente a la vista operacional sin mostrar mensaje de éxito
    logger.debug('Redirecting to operational view after successful shift creation', { shiftId });
    isStartingShift = false;
    switchView('shift-operational', shiftId);
    
  } catch (error) {
    hideSpinner();
    isStartingShift = false;
    logger.error('Error starting shift', error);
    await showError(error.message || 'Error al iniciar turno');
    
    // Rehabilitar botón en caso de error
    const startButton = document.querySelector('button[onclick*="startShift"]');
    if (startButton) {
      startButton.disabled = false;
      startButton.style.opacity = '1';
      startButton.style.cursor = 'pointer';
    }
  }
};

// Volver a vista principal (global para onclick)
window.backToShifts = function() {
  // Salir del fullscreen antes de cambiar de vista
  const container = document.getElementById('shift-init-view');
  if (container) {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (fullscreenElement === container) {
      exitFullscreenInit();
    }
  }
  switchView('shifts');
};

// Entrar en fullscreen (global para onclick)
window.enterFullscreenInit = function() {
  logger.debug('enterFullscreenInit called');
  const container = document.getElementById('shift-init-view');
  if (!container) {
    logger.warn('shift-init-view container not found for fullscreen');
    return;
  }
  
  try {
    logger.debug('Attempting to enter fullscreen', { 
      hasRequestFullscreen: !!container.requestFullscreen,
      hasWebkit: !!container.webkitRequestFullscreen,
      hasMoz: !!container.mozRequestFullScreen,
      hasMs: !!container.msRequestFullscreen
    });
    
    if (container.requestFullscreen) {
      container.requestFullscreen().then(() => {
        logger.debug('Fullscreen entered successfully');
        updateFullscreenInitButtons();
        moveModalsToFullscreenInit();
      }).catch((error) => {
        logger.error('Error entering fullscreen (promise rejected)', error);
      });
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    } else {
      logger.warn('Fullscreen API not supported');
    }
  } catch (error) {
    logger.error('Error entering fullscreen', error);
  }
};

// Salir del fullscreen (global para onclick)
window.exitFullscreenInit = function() {
  logger.debug('exitFullscreenInit called');
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        logger.debug('Fullscreen exited successfully');
        updateFullscreenInitButtons();
        moveModalsToFullscreenInit();
      }).catch((error) => {
        logger.error('Error exiting fullscreen (promise rejected)', error);
      });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      updateFullscreenInitButtons();
      setTimeout(moveModalsToFullscreenInit, 100);
    }
  } catch (error) {
    logger.error('Error exiting fullscreen', error);
  }
};

// Función para mover modales (compartida con shift-operational)
function moveModalsToFullscreenInit() {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  const modals = ['custom-modal', 'custom-alert', 'loading-spinner', 'profile-modal'];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal && fullscreenElement) {
      // Guardar el padre original si no está guardado
      if (!modal.dataset.originalParent) {
        modal.dataset.originalParent = modal.parentElement ? modal.parentElement.id || 'body' : 'body';
      }
      // Mover al elemento fullscreen
      if (modal.parentElement !== fullscreenElement) {
        fullscreenElement.appendChild(modal);
      }
    } else if (modal && !fullscreenElement) {
      // Restaurar al padre original
      const originalParent = modal.dataset.originalParent;
      if (originalParent === 'body') {
        document.body.appendChild(modal);
      } else if (originalParent) {
        const parent = document.getElementById(originalParent);
        if (parent) {
          parent.appendChild(modal);
        } else {
          document.body.appendChild(modal);
        }
      }
      delete modal.dataset.originalParent;
    }
  });
}

// Actualizar botones de fullscreen según el estado
function updateFullscreenInitButtons() {
  const enterBtn = document.getElementById('enter-fullscreen-init-btn');
  const exitBtn = document.getElementById('exit-fullscreen-init-btn');
  const container = document.getElementById('shift-init-view');
  
  logger.debug('updateFullscreenInitButtons called', { 
    hasEnterBtn: !!enterBtn, 
    hasExitBtn: !!exitBtn, 
    hasContainer: !!container 
  });
  
  if (!container) {
    logger.warn('shift-init-view container not found');
    return;
  }
  
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  const isFullscreen = fullscreenElement === container;
  
  logger.debug('Fullscreen state', { isFullscreen, fullscreenElement: fullscreenElement ? 'exists' : 'null' });
  
  if (enterBtn && exitBtn) {
    if (isFullscreen) {
      enterBtn.classList.add('hidden');
      exitBtn.classList.remove('hidden');
      logger.debug('Showing exit button, hiding enter button');
    } else {
      enterBtn.classList.remove('hidden');
      exitBtn.classList.add('hidden');
      logger.debug('Showing enter button, hiding exit button');
    }
  } else {
    logger.warn('Buttons not found', { enterBtn: !!enterBtn, exitBtn: !!exitBtn });
  }
}

// Listener para cambios de fullscreen
function setupFullscreenInitListeners() {
  const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      updateFullscreenInitButtons();
      moveModalsToFullscreenInit();
    });
  });
}

// Inicializar listeners de fullscreen cuando se carga el script
setupFullscreenInitListeners();

// Inicializar vista de inicio
function initializeShiftInit() {
  logger.debug('Initializing shift init view');
  loadInitView();
}
