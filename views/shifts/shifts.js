// Gestión de turnos - Vista principal

const logger = window.logger || console;

// Cajas fijas del sistema
const SHIFTS_VIEW_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos'
};

// Turnos disponibles
const SHIFTS_VIEW_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

let shiftsListener = null;
let currentShifts = [];
let activeShift = null;
let loadShiftsRetryCount = 0;
const SHIFTS_MAX_RETRIES = 10;

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
    const nrd = window.nrd;
    if (!nrd || !nrd.shifts) {
      logger.warn('NRD Data Access shifts service not available yet');
      activeShift = null;
      return null;
    }
    
    const today = getTodayDate();
    let shift = await nrd.shifts.getActiveShift(today, 'mañana');
    if (shift) {
      activeShift = shift;
      return shift;
    }
    shift = await nrd.shifts.getActiveShift(today, 'tarde');
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
  const formattedDate = window.formatDate ? window.formatDate(shift.date) : shift.date;
  
  return `
    <div class="bg-blue-50 border-2 border-blue-600  p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-2xl font-semibold text-blue-900 mb-2">Turno Activo</h3>
          <p class="text-lg text-blue-700 mb-1">${formattedDate} - ${shiftLabel}</p>
          <p class="text-base text-blue-600">Cajera: ${window.escapeHtml ? window.escapeHtml(shift.cashierName || 'N/A') : (shift.cashierName || 'N/A')}</p>
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
  const formattedDate = window.formatDate ? window.formatDate(shift.date) : shift.date;
  const closedDate = shift.closedAt ? new Date(shift.closedAt).toLocaleString('es-CL') : 'N/A';
  
  return `
    <div class="border-2 border-gray-200  p-6 hover:border-red-600 transition-colors mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-gray-900 mb-1">${formattedDate}</h3>
          <p class="text-lg text-gray-600 mb-1">${shiftLabel}</p>
          <p class="text-base text-gray-500 mb-1">Cajera: ${window.escapeHtml ? window.escapeHtml(shift.cashierName || 'N/A') : (shift.cashierName || 'N/A')}</p>
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
    loadShiftsRetryCount = 0;
    return;
  }
  
  const nrd = window.nrd;
  if (!nrd || !nrd.shifts) {
    loadShiftsRetryCount++;
    
    if (loadShiftsRetryCount >= SHIFTS_MAX_RETRIES) {
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
              ${nrd ? `Servicios disponibles: ${Object.keys(nrd).filter(k => typeof nrd[k] === 'object' && nrd[k] !== null && 'getAll' in nrd[k]).join(', ')}` : 'window.nrd no está disponible'}
            </p>
          </div>
        `;
      }
      loadShiftsRetryCount = 0;
      return;
    }
    
    logger.warn('NRD Data Access shifts service not available yet, retrying...', {
      attempt: loadShiftsRetryCount,
      maxRetries: SHIFTS_MAX_RETRIES
    });
    setTimeout(loadShifts, 200);
    return;
  }
  
  loadShiftsRetryCount = 0;
  
  if (shiftsListener) {
    shiftsListener();
    shiftsListener = null;
  }
  
  checkActiveShift().then(() => {
    if (!nrd || !nrd.shifts) {
      logger.warn('NRD Data Access shifts service not available when creating listener');
      return;
    }
    
    try {
      shiftsListener = nrd.shifts.onValue((shifts) => {
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
  
  checkActiveShift().then(() => {
    const closedShifts = filterClosedShifts(currentShifts);
    
    closedShifts.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      if (a.shift === 'tarde' && b.shift === 'mañana') return -1;
      if (a.shift === 'mañana' && b.shift === 'tarde') return 1;
      return 0;
    });
    
    let html = '<div class="space-y-4">';
    
    if (activeShift) {
      html += renderActiveShiftCard(activeShift);
    } else {
      html += `
        <div class="mb-8">
          <button onclick="initiateNewShift()" 
            class="w-full px-8 py-6 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-2xl font-medium  shadow-lg">
            Iniciar Turno
          </button>
        </div>
      `;
    }
    
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
    window.showError('Ya existe un turno activo. Debe cerrarlo antes de iniciar uno nuevo.');
    return;
  }
  if (window.navigationService) {
    window.navigationService.switchView('shift-init');
  }
};

// Ver detalle de turno cerrado (global para onclick)
window.viewShiftDetail = function(shiftId) {
  logger.debug('Viewing shift detail', { shiftId });
  if (window.navigationService) {
    window.navigationService.switchView('shift-detail', shiftId);
  }
};

// Abrir vista operativa (global para onclick)
window.openOperationalView = function(shiftId) {
  logger.debug('Opening operational view', { shiftId });
  if (!shiftId && activeShift) {
    shiftId = activeShift.id;
  }
  if (!shiftId) {
    window.showError('No hay turno activo');
    return;
  }
  if (window.navigationService) {
    window.navigationService.switchView('shift-operational', shiftId);
  }
};

/**
 * Initialize shifts view
 */
export function initializeShifts() {
  logger.debug('Initializing shifts view');
  loadShifts();
}

/**
 * Cleanup shifts view
 */
export function cleanupShifts() {
  if (shiftsListener) {
    shiftsListener();
    shiftsListener = null;
  }
  currentShifts = [];
  activeShift = null;
  loadShiftsRetryCount = 0;
}
