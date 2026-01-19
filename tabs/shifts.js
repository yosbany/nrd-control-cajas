// Gestión de turnos - Vista principal

// Cajas fijas del sistema (namespace para evitar conflictos)
const SHIFTS_VIEW_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos'
};

// Turnos disponibles (namespace para evitar conflictos)
const SHIFTS_VIEW_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

// Tipos de incidentes predefinidos
const INCIDENT_TYPES = [
  'Falta de efectivo',
  'Sobrante de efectivo',
  'Error en transacción',
  'Problema con cliente',
  'Problema técnico',
  'Otro'
];

let shiftsListener = null;
let currentShifts = [];
let activeShift = null;
let loadShiftsRetryCount = 0;
const SHIFTS_MAX_RETRIES = 10; // Maximum 10 retries (2 seconds total)

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Formatear fecha
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

// Obtener fecha actual en formato YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Verificar si existe turno activo
async function checkActiveShift() {
  try {
    // Validar que nrd y shifts estén disponibles
    if (!window.nrd || !window.nrd.shifts) {
      logger.warn('NRD Data Access shifts service not available yet');
      activeShift = null;
      return null;
    }
    
    const today = getTodayDate();
    // Verificar turno mañana
    let shift = await window.nrd.shifts.getActiveShift(today, 'mañana');
    if (shift) {
      activeShift = shift;
      return shift;
    }
    // Verificar turno tarde
    shift = await window.nrd.shifts.getActiveShift(today, 'tarde');
    if (shift) {
      activeShift = shift;
      return shift;
    }
    activeShift = null;
    return null;
  } catch (error) {
    logger.error('Error checking active shift', error);
    activeShift = null;
    return null;
  }
}

// Filtrar solo turnos cerrados
function filterClosedShifts(shifts) {
  if (!shifts || !Array.isArray(shifts)) return [];
  return shifts.filter(shift => shift.closed === true);
}

// Renderizar card de turno activo
function renderActiveShiftCard(shift) {
  if (!shift) return '';
  
  const shiftLabel = SHIFTS_VIEW_SHIFTS[shift.shift] || shift.shift;
  const formattedDate = formatDate(shift.date);
  
  return `
    <div class="bg-blue-50 border-2 border-blue-600  p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-2xl font-semibold text-blue-900 mb-2">Turno Activo</h3>
          <p class="text-lg text-blue-700 mb-1">${formattedDate} - ${shiftLabel}</p>
          <p class="text-base text-blue-600">Cajera: ${escapeHtml(shift.cashierName || 'N/A')}</p>
        </div>
        <div class="px-4 py-2 bg-blue-600 text-white  text-base font-medium">
          ABIERTO
        </div>
      </div>
      <button onclick="openOperationalView('${shift.id}')" 
        class="w-full mt-4 px-6 py-5 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors uppercase tracking-wider text-lg font-medium ">
        Ir a Vista Operativa
      </button>
    </div>
  `;
}

// Renderizar card de turno cerrado
function renderClosedShiftCard(shift) {
  if (!shift) return '';
  
  const shiftLabel = SHIFTS_VIEW_SHIFTS[shift.shift] || shift.shift;
  const formattedDate = formatDate(shift.date);
  const closedDate = shift.closedAt ? new Date(shift.closedAt).toLocaleString('es-CL') : 'N/A';
  
  return `
    <div class="border-2 border-gray-200  p-6 hover:border-red-600 transition-colors mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-gray-900 mb-1">${formattedDate}</h3>
          <p class="text-lg text-gray-600 mb-1">${shiftLabel}</p>
          <p class="text-base text-gray-500 mb-1">Cajera: ${escapeHtml(shift.cashierName || 'N/A')}</p>
          <p class="text-sm text-gray-400 mt-2">Cerrado: ${closedDate}</p>
        </div>
        <div class="px-4 py-2 bg-gray-600 text-white  text-base font-medium ml-4">
          CERRADO
        </div>
      </div>
      <button onclick="viewShiftDetail('${shift.id}')" 
        class="w-full mt-4 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base font-medium ">
        Ver Detalle
      </button>
    </div>
  `;
}

// Cargar turnos
function loadShifts() {
  logger.debug('Loading shifts');
  const container = document.getElementById('shifts-view');
  if (!container) {
    logger.warn('Shifts view container not found');
    loadShiftsRetryCount = 0; // Reset counter on return
    return;
  }
  
  // Validar que nrd y shifts estén disponibles
  if (!window.nrd || !window.nrd.shifts) {
    loadShiftsRetryCount++;
    
    if (loadShiftsRetryCount >= SHIFTS_MAX_RETRIES) {
      // Maximum retries reached, show error message
      logger.error('Shifts service not available after maximum retries');
      const shiftsView = document.getElementById('shifts-view');
      if (shiftsView) {
        shiftsView.innerHTML = `
          <div class="bg-red-50 border border-red-200 p-4 sm:p-6  text-center">
            <p class="text-red-700 text-sm sm:text-base mb-2">
              ⚠️ Error: Servicio de turnos no disponible
            </p>
            <p class="text-red-600 text-xs sm:text-sm mb-2">
              El servicio de turnos no está disponible en la librería NRD Data Access.
            </p>
            <p class="text-red-600 text-xs sm:text-sm">
              Verifica que la versión de la librería incluya el servicio "shifts".
              ${window.nrd ? `Servicios disponibles: ${Object.keys(window.nrd).filter(k => typeof window.nrd[k] === 'object' && window.nrd[k] !== null && 'getAll' in window.nrd[k]).join(', ')}` : 'window.nrd no está disponible'}
            </p>
          </div>
        `;
      }
      loadShiftsRetryCount = 0; // Reset counter
      return;
    }
    
    logger.warn('NRD Data Access shifts service not available yet, retrying...', {
      attempt: loadShiftsRetryCount,
      maxRetries: SHIFTS_MAX_RETRIES
    });
    // Retry después de un delay
    setTimeout(loadShifts, 200);
    return;
  }
  
  // Reset counter on success
  loadShiftsRetryCount = 0;
  
  // Limpiar listener anterior
  if (shiftsListener) {
    shiftsListener();
    shiftsListener = null;
  }
  
  // Verificar turno activo primero
  checkActiveShift().then(() => {
    // Verificar nuevamente que shifts esté disponible antes de crear listener
    if (!window.nrd || !window.nrd.shifts) {
      logger.warn('NRD Data Access shifts service not available when creating listener');
      return;
    }
    
    // Escuchar cambios en turnos
    try {
      shiftsListener = window.nrd.shifts.onValue((shifts) => {
        currentShifts = shifts || [];
        renderShifts();
      });
    } catch (error) {
      logger.error('Error setting up shifts listener', error);
    }
  }).catch((error) => {
    logger.error('Error in checkActiveShift promise', error);
  });
}

// Renderizar vista de turnos
function renderShifts() {
  const container = document.getElementById('shifts-view');
  if (!container) return;
  
  // Verificar turno activo nuevamente
  checkActiveShift().then(() => {
    const closedShifts = filterClosedShifts(currentShifts);
    
    // Ordenar turnos cerrados por fecha descendente (más recientes primero)
    closedShifts.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      // Si misma fecha, ordenar por turno (tarde primero)
      if (a.shift === 'tarde' && b.shift === 'mañana') return -1;
      if (a.shift === 'mañana' && b.shift === 'tarde') return 1;
      return 0;
    });
    
    let html = '<div class="space-y-4">';
    
    // Mostrar turno activo si existe
    if (activeShift) {
      html += renderActiveShiftCard(activeShift);
    } else {
      // Mostrar botón "Iniciar Turno" solo si NO hay turno activo
      html += `
        <div class="mb-8">
          <button onclick="initiateNewShift()" 
            class="w-full px-8 py-6 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-2xl font-medium  shadow-lg">
            Iniciar Turno
          </button>
        </div>
      `;
    }
    
    // Mostrar lista de turnos cerrados
    html += '<div class="mt-8">';
    html += '<h2 class="text-2xl font-semibold text-gray-900 mb-6">Turnos Cerrados</h2>';
    
    if (closedShifts.length === 0) {
      html += `
        <div class="text-center py-8 text-gray-500">
          <p>No hay turnos cerrados</p>
        </div>
      `;
    } else {
      html += '<div class="space-y-3">';
      closedShifts.forEach(shift => {
        html += renderClosedShiftCard(shift);
      });
      html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  });
}

// Iniciar nuevo turno (global para onclick)
window.initiateNewShift = function() {
  logger.debug('Initiating new shift');
  if (activeShift) {
    showError('Ya existe un turno activo. Debe cerrarlo antes de iniciar uno nuevo.');
    return;
  }
  switchView('shift-init');
};

// Ver detalle de turno cerrado (global para onclick)
window.viewShiftDetail = function(shiftId) {
  logger.debug('Viewing shift detail', { shiftId });
  switchView('shift-detail', shiftId);
};

// Abrir vista operativa (global para onclick)
window.openOperationalView = function(shiftId) {
  logger.debug('Opening operational view', { shiftId });
  if (!shiftId && activeShift) {
    shiftId = activeShift.id;
  }
  if (!shiftId) {
    showError('No hay turno activo');
    return;
  }
  switchView('shift-operational', shiftId);
};

// Inicializar vista de turnos
function initializeShifts() {
  logger.debug('Initializing shifts view');
  loadShifts();
}

// Limpiar listeners
function cleanupShifts() {
  if (shiftsListener) {
    shiftsListener();
    shiftsListener = null;
  }
  currentShifts = [];
  activeShift = null;
  loadShiftsRetryCount = 0; // Reset retry counter
}
