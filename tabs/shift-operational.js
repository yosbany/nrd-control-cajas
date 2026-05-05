// Vista operativa full page - Solo con turno activo

// Cajas fijas del sistema (namespace para evitar conflictos)
const OPERATIONAL_VIEW_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos',
  'otros': 'Otros'
};

// Turnos disponibles (namespace para evitar conflictos)
const OPERATIONAL_VIEW_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

let currentShift = null;
let currentShiftId = null;
let movementsListener = null;
let incidentsListener = null;
let shiftListener = null;
let movements = [];
let incidents = [];
let loadMovementsRetryCount = 0;
let loadIncidentsRetryCount = 0;
const OPERATIONAL_MAX_RETRIES = 10; // Maximum 10 retries (2 seconds total)

// Estado de secciones visibles
let activeFormSection = null; // 'income', 'expense', 'incident', null
let activeFormParams = {}; // Parámetros para la sección activa (ej: {box: 'mostrador'})

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

// Formatear monto
function formatAmount(amount) {
  if (amount === null || amount === undefined) return '$0';
  return `$${amount.toLocaleString('es-CL')}`;
}

// Calcular totales por caja
function calculateBoxTotals(box) {
  const boxMovements = movements.filter(m => m.box === box);
  
  const ingresos = boxMovements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const egresos = boxMovements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  return { ingresos, egresos };
}

// Cargar vista operativa
async function loadOperationalView(shiftId) {
  logger.debug('Loading operational view', { shiftId });
  
  // Asegurar que no haya ningún elemento en fullscreen antes de cargar la vista
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  if (fullscreenElement) {
    logger.debug('Exiting fullscreen before loading operational view');
    try {
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
    } catch (error) {
      logger.error('Error exiting fullscreen', error);
    }
  }
  
  // Restaurar modales al body
  if (typeof window.moveModalsToFullscreen === 'function') {
    window.moveModalsToFullscreen();
  }
  
  if (!shiftId) {
    logger.warn('No shiftId provided to loadOperationalView');
    await showError('No se proporcionó ID de turno');
    switchView('shifts');
    return;
  }
  
  currentShiftId = shiftId;
  
  try {
    // Validar que nrd y shifts estén disponibles
    // Note: No retry here, as this function is called from switchView which handles retries
    if (!window.nrd || !window.nrd.shifts) {
      logger.error('NRD Data Access shifts service not available');
      await showError('Servicio de turnos no disponible. Por favor, recarga la página.');
      switchView('shifts');
      return;
    }
    
    logger.debug('Fetching shift by ID', { shiftId });
    // Cargar turno
    const shift = await window.nrd.shifts.getById(shiftId);
    logger.debug('Shift fetched', { shift: shift ? 'found' : 'not found', shiftId });
    
    if (!shift) {
      logger.warn('Shift not found', { shiftId });
      await showError('Turno no encontrado');
      switchView('shifts');
      return;
    }
    
    if (shift.closed) {
      logger.info('Shift is closed', { shiftId });
      await showError('Este turno ya está cerrado');
      switchView('shifts');
      return;
    }
    
    logger.debug('Setting currentShift', { shiftId });
    currentShift = { id: shiftId, ...shift };
    
    // Cargar movimientos
    logger.debug('Loading movements', { shiftId });
    loadMovements(shiftId);
    
    // Cargar incidentes
    logger.debug('Loading incidents', { shiftId });
    loadIncidents(shiftId);
    
    // Escuchar cambios en el turno
    if (!window.nrd || !window.nrd.shifts) {
      logger.warn('NRD Data Access shifts service not available yet');
    } else {
      if (shiftListener) {
        shiftListener();
      }
      try {
        shiftListener = window.nrd.shifts.onValueById(shiftId, (updatedShift) => {
          if (updatedShift) {
            currentShift = updatedShift;
            if (updatedShift.closed) {
              showInfo('El turno ha sido cerrado').then(() => {
                switchView('shifts');
              });
            } else {
              renderOperationalView();
            }
          }
        });
        logger.debug('Shift listener set up', { shiftId });
      } catch (error) {
        logger.error('Error setting up shift listener', error);
      }
    }
    
    logger.debug('Calling renderOperationalView', { shiftId, hasCurrentShift: !!currentShift });
    renderOperationalView();
    
    // Entrar automáticamente en fullscreen después de renderizar
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      const container = document.getElementById('shift-operational-view');
      if (container) {
        logger.debug('Entering fullscreen automatically for operational view');
        // Verificar que no esté ya en fullscreen
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!fullscreenElement || fullscreenElement !== container) {
          // Intentar entrar en fullscreen
          if (container.requestFullscreen) {
            container.requestFullscreen().then(() => {
              logger.debug('Auto fullscreen entered successfully');
              updateFullscreenButtons();
              if (typeof window.moveModalsToFullscreen === 'function') {
                window.moveModalsToFullscreen();
              }
            }).catch((error) => {
              logger.warn('Could not enter fullscreen automatically (may require user gesture)', error);
              // No mostrar error al usuario, solo loggear
            });
          } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
            updateFullscreenButtons();
            setTimeout(() => {
              if (typeof window.moveModalsToFullscreen === 'function') {
                window.moveModalsToFullscreen();
              }
            }, 100);
          } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
            updateFullscreenButtons();
            setTimeout(() => {
              if (typeof window.moveModalsToFullscreen === 'function') {
                window.moveModalsToFullscreen();
              }
            }, 100);
          } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
            updateFullscreenButtons();
            setTimeout(() => {
              if (typeof window.moveModalsToFullscreen === 'function') {
                window.moveModalsToFullscreen();
              }
            }, 100);
          }
        }
      }
    }, 300); // Esperar 300ms para que el DOM esté completamente renderizado
    
  } catch (error) {
    logger.error('Error loading operational view', error);
    await showError('Error al cargar la vista operativa: ' + (error.message || error));
    switchView('shifts');
  }
}

// Cargar movimientos
function loadMovements(shiftId) {
  // Validar que nrd y shiftMovements estén disponibles
  if (!window.nrd || !window.nrd.shiftMovements) {
    loadMovementsRetryCount++;
    
    if (loadMovementsRetryCount >= OPERATIONAL_MAX_RETRIES) {
      logger.error('ShiftMovements service not available after maximum retries');
      loadMovementsRetryCount = 0; // Reset counter
      return;
    }
    
    logger.warn('NRD Data Access shiftMovements service not available yet, retrying...', {
      attempt: loadMovementsRetryCount,
      maxRetries: OPERATIONAL_MAX_RETRIES
    });
    setTimeout(() => loadMovements(shiftId), 200);
    return;
  }
  
  // Reset counter on success
  loadMovementsRetryCount = 0;
  
  if (movementsListener) {
    movementsListener();
    movementsListener = null;
  }
  
  try {
    movementsListener = window.nrd.shiftMovements.onValueByShift(shiftId, (movs) => {
      logger.debug('Movements updated via listener', { 
        count: movs?.length || 0, 
        shiftId,
        movements: movs?.map(m => ({ id: m.id, type: m.type, box: m.box, amount: m.amount })) || []
      });
      movements = movs || [];
      // Siempre renderizar si tenemos el turno correcto
      if (currentShift && currentShift.id === shiftId) {
        logger.debug('Rendering operational view after movements update');
        renderOperationalView();
      } else {
        logger.warn('currentShift mismatch, skipping render', { 
          currentShiftId: currentShift?.id, 
          expectedShiftId: shiftId,
          hasCurrentShift: !!currentShift
        });
        // Si no hay currentShift pero tenemos el shiftId, intentar cargar el turno
        if (!currentShift && shiftId) {
          logger.debug('Attempting to reload shift data');
          loadOperationalView(shiftId);
        }
      }
    });
    logger.debug('Movements listener set up successfully', { shiftId });
  } catch (error) {
    logger.error('Error setting up movements listener', error);
  }
}

// Cargar incidentes
function loadIncidents(shiftId) {
  // Validar que nrd y shiftIncidents estén disponibles
  if (!window.nrd || !window.nrd.shiftIncidents) {
    loadIncidentsRetryCount++;
    
    if (loadIncidentsRetryCount >= OPERATIONAL_MAX_RETRIES) {
      logger.error('ShiftIncidents service not available after maximum retries');
      loadIncidentsRetryCount = 0; // Reset counter
      return;
    }
    
    logger.warn('NRD Data Access shiftIncidents service not available yet, retrying...', {
      attempt: loadIncidentsRetryCount,
      maxRetries: OPERATIONAL_MAX_RETRIES
    });
    setTimeout(() => loadIncidents(shiftId), 200);
    return;
  }
  
  // Reset counter on success
  loadIncidentsRetryCount = 0;
  
  if (incidentsListener) {
    incidentsListener();
    incidentsListener = null;
  }
  
  try {
    incidentsListener = window.nrd.shiftIncidents.onValueByShift(shiftId, (incs) => {
      incidents = incs || [];
      renderOperationalView();
    });
  } catch (error) {
    logger.error('Error setting up incidents listener', error);
  }
}

// Renderizar vista operativa
// Mover modales al elemento fullscreen cuando se entra en fullscreen (global para uso compartido)
window.moveModalsToFullscreen = function() {
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

function renderOperationalView() {
  const container = document.getElementById('shift-operational-view');
  if (!container) {
    logger.warn('shift-operational-view container not found');
    return;
  }
  if (!currentShift) {
    logger.warn('currentShift is null, cannot render', { currentShiftId });
    return;
  }
  
  logger.debug('Rendering operational view', { 
    shiftId: currentShift.id, 
    movementsCount: movements.length,
    incidentsCount: incidents.length
  });
  
  const shiftLabel = OPERATIONAL_VIEW_SHIFTS[currentShift.shift] || currentShift.shift;
  const formattedDate = formatDate(currentShift.date);
  
  // Calcular totales basados en los movimientos actuales
  const mostradorTotalsBase = calculateBoxTotals('mostrador');
  const bancaTotalsBase = calculateBoxTotals('banca-juegos');
  
  logger.debug('Box totals calculated', {
    mostrador: mostradorTotalsBase,
    banca: bancaTotalsBase,
    movementsCount: movements.length
  });
  
  // Calcular saldos
  const mostradorFondo = currentShift.boxes?.mostrador?.initialFund || 0;
  const mostradorSaldo = mostradorFondo + mostradorTotalsBase.ingresos - mostradorTotalsBase.egresos;
  const mostradorTotals = { ...mostradorTotalsBase, saldo: mostradorSaldo };
  
  const bancaFondo = currentShift.boxes?.['banca-juegos']?.initialFund || 0;
  const bancaSaldo = bancaFondo + bancaTotalsBase.ingresos - bancaTotalsBase.egresos;
  const bancaTotals = { ...bancaTotalsBase, saldo: bancaSaldo };
  
  const html = `
    <div class="w-full bg-white flex flex-col">
      <!-- Header mínimo - Optimizado para táctil -->
      <div class="bg-red-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 ">
        <div>
          <h2 class="text-base sm:text-lg font-semibold">${shiftLabel}</h2>
          <p class="text-xs text-white/90">${formattedDate}</p>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button id="exit-fullscreen-btn" onclick="if(typeof window.exitFullscreenOperational === 'function') { window.exitFullscreenOperational(); } else { console.error('exitFullscreenOperational not available'); }" 
            class="text-white hover:text-gray-200 text-xl sm:text-2xl font-light w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/20 transition-colors  hidden min-w-[40px] min-h-[40px]"
            title="Salir de pantalla completa">
            ⛶
          </button>
          <button id="enter-fullscreen-btn" onclick="if(typeof window.enterFullscreenOperational === 'function') { window.enterFullscreenOperational(); } else { console.error('enterFullscreenOperational not available'); }" 
            class="text-white hover:text-gray-200 text-xl sm:text-2xl font-light w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/20 transition-colors  min-w-[40px] min-h-[40px]"
            title="Pantalla completa">
            ⛶
          </button>
          <button onclick="backToShiftsFromOperational()" 
            class="text-white hover:text-gray-200 text-xl sm:text-2xl font-light w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/20 transition-colors  min-w-[36px] min-h-[36px]"
            title="Cerrar">
            ×
          </button>
        </div>
      </div>
      
      <div class="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-5 w-full overflow-y-auto">
        <!-- Botones Principales - Arriba del todo -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <button onclick="quickRegisterIncident()"
            class="px-4 py-5 sm:py-6 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-bold  shadow-lg min-h-[64px] flex items-center justify-center">
            🚨<br>Incidencia
          </button>
          <button onclick="showIncomeModal()"
            class="px-4 py-5 sm:py-6 bg-green-600 text-white border-2 border-green-600 hover:bg-green-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-bold  shadow-lg min-h-[64px] flex items-center justify-center">
            +<br>Ingreso
          </button>
          <button onclick="showExpenseModal()"
            class="px-4 py-5 sm:py-6 bg-orange-600 text-white border-2 border-orange-600 hover:bg-orange-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-bold  shadow-lg min-h-[64px] flex items-center justify-center">
            -<br>Egreso
          </button>
        </div>
        
        <!-- Lista de Incidentes Registrados -->
        ${incidents.length > 0 ? `
          <div class="border-2 border-red-200 p-2 sm:p-3 bg-red-50">
            <h3 class="text-sm sm:text-base font-semibold text-gray-900 mb-2">Incidentes Registrados (${incidents.length})</h3>
            <div class="space-y-1 max-h-64 sm:max-h-80 overflow-y-auto">
              ${incidents.slice().reverse().map(incident => `
                <div class="bg-white p-2 border border-red-200">
                  <div class="flex justify-between items-start mb-0.5">
                    <div class="font-semibold text-xs sm:text-sm text-gray-900">${escapeHtml(incident.type)}${incident.customType ? ` - ${escapeHtml(incident.customType)}` : ''}</div>
                    ${incident.amount ? `
                      <div class="text-xs sm:text-sm font-medium text-red-600">${formatAmount(incident.amount)}</div>
                    ` : ''}
                  </div>
                  <div class="text-xs text-gray-600 mb-0.5">Caja: ${OPERATIONAL_VIEW_BOXES[incident.box] || incident.box}</div>
                  <div class="text-xs text-gray-700 line-clamp-2">${escapeHtml(incident.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="border-2 border-gray-200 p-2 sm:p-3 text-center">
            <p class="text-xs sm:text-sm text-gray-500">No hay incidentes registrados</p>
          </div>
        `}
        
        <!-- Lista de Ingresos y Egresos -->
        ${movements.length > 0 ? `
          <div class="border-2 border-gray-200 p-2 sm:p-3">
            <h3 class="text-sm sm:text-base font-semibold text-gray-900 mb-2">Movimientos (${movements.length})</h3>
            <div class="space-y-1 max-h-64 sm:max-h-80 overflow-y-auto">
              ${movements.slice().reverse().map(movement => `
                <div class="bg-gray-50 p-2 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors" 
                     onclick="deleteMovementHandler('${movement.id}')"
                     title="Click para eliminar">
                  <div class="flex justify-between items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="text-xs sm:text-sm font-medium text-gray-700 mb-0.5">${OPERATIONAL_VIEW_BOXES[movement.box] || movement.box}</div>
                      <div class="text-xs text-gray-600 line-clamp-2">${escapeHtml(movement.reason)}</div>
                    </div>
                    <div class="flex-shrink-0">
                      <span class="font-semibold text-xs sm:text-sm ${movement.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}">
                        ${movement.type === 'ingreso' ? '+' : '-'} ${formatAmount(movement.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="border-2 border-gray-200 p-2 sm:p-3 text-center">
            <p class="text-xs sm:text-sm text-gray-500">No hay movimientos registrados</p>
          </div>
        `}
        
        <!-- Resumen por Cajas -->
        <div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <!-- Caja Mostrador -->
            <div class="border-2 border-gray-300 bg-white p-2 sm:p-3 shadow-sm">
              <h4 class="text-sm sm:text-base font-bold text-gray-900 mb-2 pb-1.5 border-b-2 border-gray-200">${OPERATIONAL_VIEW_BOXES.mostrador}</h4>
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Fondo:</span>
                  <span class="text-sm sm:text-base font-bold text-gray-900">${formatAmount(currentShift.boxes?.mostrador?.initialFund || 0)}</span>
                </div>
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Ingresos:</span>
                  <span class="text-sm sm:text-base font-bold text-green-600">${formatAmount(mostradorTotals.ingresos)}</span>
                </div>
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Egresos:</span>
                  <span class="text-sm sm:text-base font-bold text-red-600">${formatAmount(mostradorTotals.egresos)}</span>
                </div>
                <div class="flex justify-between items-center pt-1 sm:pt-1.5 border-t-2 border-gray-300 bg-gray-50 -mx-2 sm:-mx-3 px-2 sm:px-3 py-1 sm:py-1.5">
                  <span class="text-sm sm:text-base font-bold text-gray-900">Saldo:</span>
                  <span class="text-base sm:text-lg font-bold text-blue-600">${formatAmount(mostradorTotals.saldo)}</span>
                </div>
              </div>
            </div>
            
            <!-- Caja Banca de Juegos -->
            <div class="border-2 border-gray-300 bg-white p-2 sm:p-3 shadow-sm">
              <h4 class="text-sm sm:text-base font-bold text-gray-900 mb-2 pb-1.5 border-b-2 border-gray-200">${OPERATIONAL_VIEW_BOXES['banca-juegos']}</h4>
              <div class="space-y-1 sm:space-y-1.5">
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Fondo:</span>
                  <span class="text-sm sm:text-base font-bold text-gray-900">${formatAmount(currentShift.boxes?.['banca-juegos']?.initialFund || 0)}</span>
                </div>
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Ingresos:</span>
                  <span class="text-sm sm:text-base font-bold text-green-600">${formatAmount(bancaTotals.ingresos)}</span>
                </div>
                <div class="flex justify-between items-center py-1 sm:py-1.5 border-b border-gray-100">
                  <span class="text-xs sm:text-sm font-medium text-gray-700">Egresos:</span>
                  <span class="text-sm sm:text-base font-bold text-red-600">${formatAmount(bancaTotals.egresos)}</span>
                </div>
                <div class="flex justify-between items-center pt-1 sm:pt-1.5 border-t-2 border-gray-300 bg-gray-50 -mx-2 sm:-mx-3 px-2 sm:px-3 py-1 sm:py-1.5">
                  <span class="text-sm sm:text-base font-bold text-gray-900">Saldo:</span>
                  <span class="text-base sm:text-lg font-bold text-blue-600">${formatAmount(bancaTotals.saldo)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botón Cerrar Turno - Al final -->
        <div class="pt-3 sm:pt-4 border-t-2 border-gray-300">
          <button onclick="closeShiftFromOperational()"
            class="w-full px-4 sm:px-6 py-5 sm:py-6 bg-gray-600 text-white border-2 border-gray-600 hover:bg-gray-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-bold  min-h-[64px]">
            Cerrar Turno
          </button>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  logger.debug('Operational view rendered', { shiftId: currentShift.id });
  
  // Usar setTimeout para asegurar que el DOM esté completamente actualizado
  setTimeout(() => {
    // Configurar event listeners directos para los botones de fullscreen
    const enterBtn = document.getElementById('enter-fullscreen-btn');
    const exitBtn = document.getElementById('exit-fullscreen-btn');
    
    logger.debug('Setting up fullscreen buttons', { 
      hasEnterBtn: !!enterBtn, 
      hasExitBtn: !!exitBtn,
      hasEnterFunction: typeof window.enterFullscreenOperational === 'function',
      hasExitFunction: typeof window.exitFullscreenOperational === 'function'
    });
    
    if (enterBtn) {
      // Remover listener anterior si existe (por si acaso)
      enterBtn.replaceWith(enterBtn.cloneNode(true));
      const newEnterBtn = document.getElementById('enter-fullscreen-btn');
      
      newEnterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        logger.debug('Enter fullscreen button clicked (via addEventListener)');
        if (typeof window.enterFullscreenOperational === 'function') {
          window.enterFullscreenOperational();
        } else {
          logger.error('enterFullscreenOperational function not available');
        }
      });
    } else {
      logger.warn('Enter fullscreen button not found after render');
    }
    
    if (exitBtn) {
      // Remover listener anterior si existe (por si acaso)
      exitBtn.replaceWith(exitBtn.cloneNode(true));
      const newExitBtn = document.getElementById('exit-fullscreen-btn');
      
      newExitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        logger.debug('Exit fullscreen button clicked (via addEventListener)');
        if (typeof window.exitFullscreenOperational === 'function') {
          window.exitFullscreenOperational();
        } else {
          logger.error('exitFullscreenOperational function not available');
        }
      });
    } else {
      logger.warn('Exit fullscreen button not found after render');
    }
    
    // Actualizar botones de fullscreen
    updateFullscreenButtons();
    // Mover modales si ya estamos en fullscreen
    if (typeof window.moveModalsToFullscreen === 'function') {
      window.moveModalsToFullscreen();
    }
  }, 0);
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Mostrar modal de ingreso (global para onclick)
window.showIncomeModal = async function() {
  logger.debug('Showing income modal');
  if (!currentShift || !currentShift.id) {
    await showError('No hay turno activo');
    return;
  }
  // Mostrar selector de caja primero
  const box = await showBoxSelector('Seleccione la caja para el ingreso');
  if (box) {
    if (typeof window.showMovementModal === 'function') {
      await window.showMovementModal(null, box, currentShift.id, 'ingreso');
    } else {
      logger.error('showMovementModal function not available');
      await showError('Función de movimiento no disponible. Por favor, recarga la página.');
    }
  }
};

// Mostrar modal de egreso (global para onclick)
window.showExpenseModal = async function() {
  logger.debug('Showing expense modal');
  if (!currentShift || !currentShift.id) {
    await showError('No hay turno activo');
    return;
  }
  // Mostrar selector de caja primero
  const box = await showBoxSelector('Seleccione la caja para el egreso');
  if (box) {
    if (typeof window.showMovementModal === 'function') {
      await window.showMovementModal(null, box, currentShift.id, 'egreso');
    } else {
      logger.error('showMovementModal function not available');
      await showError('Función de movimiento no disponible. Por favor, recarga la página.');
    }
  }
};

// Selector de caja (función auxiliar)
function showBoxSelector(title) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    if (!modal || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
      logger.error('Modal elements not found', { modal: !!modal, titleEl: !!titleEl, messageEl: !!messageEl, confirmBtn: !!confirmBtn, cancelBtn: !!cancelBtn });
      resolve(null);
      return;
    }
    
    // Asegurar que el modal esté en el body y disponible
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
    
    // Restaurar título y clases del modal si fueron modificadas
    titleEl.className = 'text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-black';
    
    // Restaurar clases del contenido del modal
    let modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
      modalContent.classList.remove('border-green-600', 'border-red-600');
      modalContent.classList.add('border-2', 'border-gray-200');
    }
    
    titleEl.textContent = title;
    
    let html = '<div class="space-y-4">';
    html += `
      <div class="grid grid-cols-2 gap-4">
        <button type="button" onclick="selectBoxForMovement('mostrador')"
          class="px-6 py-5 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base font-semibold  text-center min-h-[80px] flex items-center justify-center">
          ${OPERATIONAL_VIEW_BOXES.mostrador}
        </button>
        <button type="button" onclick="selectBoxForMovement('banca-juegos')"
          class="px-6 py-5 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base font-semibold  text-center min-h-[80px] flex items-center justify-center">
          ${OPERATIONAL_VIEW_BOXES['banca-juegos']}
        </button>
      </div>
    `;
    html += '</div>';
    
    messageEl.innerHTML = html;
    confirmBtn.textContent = 'Cancelar';
    cancelBtn.textContent = 'Cancelar';
    
    // Hacer botones más grandes para táctil
    confirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px] hidden';
    cancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';
    
    modal.classList.remove('hidden');
    
    // Mover el modal al elemento fullscreen si está activo
    if (typeof window.moveModalsToFullscreen === 'function') {
      window.moveModalsToFullscreen();
    }
    
    let selectedBox = null;
    
    window.selectBoxForMovement = function(box) {
      selectedBox = box;
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.selectBoxForMovement;
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve(box);
    };
    
    const handleCancel = () => {
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.selectBoxForMovement;
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve(null);
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    
    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Agregar ingreso (global para onclick) - Mantener para compatibilidad
window.addIncome = async function(box) {
  logger.debug('Showing income form', { box });
  if (!currentShift || !currentShift.id) {
    await showError('No hay turno activo');
    return;
  }
  if (typeof window.showMovementModal === 'function') {
    await window.showMovementModal(null, box, currentShift.id, 'ingreso');
  } else {
    logger.error('showMovementModal function not available');
    await showError('Función de movimiento no disponible. Por favor, recarga la página.');
  }
};

// Agregar egreso (global para onclick) - Mantener para compatibilidad
window.addExpense = async function(box) {
  logger.debug('Showing expense form', { box });
  if (!currentShift || !currentShift.id) {
    await showError('No hay turno activo');
    return;
  }
  if (typeof window.showMovementModal === 'function') {
    await window.showMovementModal(null, box, currentShift.id, 'egreso');
  } else {
    logger.error('showMovementModal function not available');
    await showError('Función de movimiento no disponible. Por favor, recarga la página.');
  }
};

// Registrar incidente rápido (global para onclick)
window.quickRegisterIncident = async function() {
  logger.debug('Showing incident form');
  if (!currentShift || !currentShift.id) {
    await showError('No hay turno activo');
    return;
  }
  await showQuickIncidentModal(currentShift.id);
};

// Cerrar turno desde vista operativa (global para onclick)
window.closeShiftFromOperational = async function() {
  if (!currentShift) {
    await showError('No hay turno activo');
    return;
  }
  
  if (typeof window.closeShift === 'function') {
    await window.closeShift(currentShift);
  } else {
    await showError('Función de cierre no disponible');
  }
};

// Volver a vista principal (global para onclick)
window.backToShiftsFromOperational = function() {
  // Salir del fullscreen antes de cambiar de vista
  const container = document.getElementById('shift-operational-view');
  if (container) {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (fullscreenElement === container) {
      exitFullscreenOperational();
    }
  }
  cleanupOperational();
  switchView('shifts');
};

// Entrar en fullscreen (global para onclick)
window.enterFullscreenOperational = function() {
  logger.debug('enterFullscreenOperational called');
  const container = document.getElementById('shift-operational-view');
  if (!container) {
    logger.warn('shift-operational-view container not found for fullscreen');
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
        updateFullscreenButtons();
        window.moveModalsToFullscreen();
      }).catch((error) => {
        logger.error('Error entering fullscreen (promise rejected)', error);
      });
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    } else {
      logger.warn('Fullscreen API not supported');
    }
  } catch (error) {
    logger.error('Error entering fullscreen', error);
  }
};

// Salir del fullscreen (global para onclick)
window.exitFullscreenOperational = function() {
  logger.debug('exitFullscreenOperational called');
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        logger.debug('Fullscreen exited successfully');
        updateFullscreenButtons();
        window.moveModalsToFullscreen();
      }).catch((error) => {
        logger.error('Error exiting fullscreen (promise rejected)', error);
      });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      updateFullscreenButtons();
      setTimeout(moveModalsToFullscreen, 100);
    }
  } catch (error) {
    logger.error('Error exiting fullscreen', error);
  }
};

// Actualizar botones de fullscreen según el estado
function updateFullscreenButtons() {
  const enterBtn = document.getElementById('enter-fullscreen-btn');
  const exitBtn = document.getElementById('exit-fullscreen-btn');
  const container = document.getElementById('shift-operational-view');
  
  logger.debug('updateFullscreenButtons called', { 
    hasEnterBtn: !!enterBtn, 
    hasExitBtn: !!exitBtn, 
    hasContainer: !!container 
  });
  
  if (!container) {
    logger.warn('shift-operational-view container not found');
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
function setupFullscreenListeners() {
  const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      updateFullscreenButtons();
      if (typeof window.moveModalsToFullscreen === 'function') {
        window.moveModalsToFullscreen();
      }
    });
  });
}

// Inicializar listeners de fullscreen cuando se carga la vista
setupFullscreenListeners();

// Limpiar listeners
function cleanupOperational() {
  // Reset retry counters
  loadMovementsRetryCount = 0;
  loadIncidentsRetryCount = 0;
  activeFormSection = null;
  activeFormParams = {};
  if (shiftListener) {
    shiftListener();
    shiftListener = null;
  }
  if (movementsListener) {
    movementsListener();
    movementsListener = null;
  }
  if (incidentsListener) {
    incidentsListener();
    incidentsListener = null;
  }
  currentShift = null;
  currentShiftId = null;
  movements = [];
  incidents = [];
}

// Mostrar/ocultar sección de formulario
function showFormSection(section, params = {}) {
  activeFormSection = section;
  activeFormParams = params || {};
  renderOperationalView();
  
  // Scroll a la sección después de renderizar
  setTimeout(() => {
    const sectionEl = document.getElementById(`form-section-${section}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// Ocultar sección de formulario
function hideFormSection() {
  activeFormSection = null;
  activeFormParams = {};
  renderOperationalView();
}


// Función para eliminar movimiento con confirmación
window.deleteMovementHandler = async function(movementId) {
  if (!movementId) {
    await showError('ID de movimiento no válido');
    return;
  }
  
  // Buscar el movimiento para mostrar información
  const movement = movements.find(m => m.id === movementId);
  if (!movement) {
    await showError('Movimiento no encontrado');
    return;
  }
  
  // Mostrar confirmación
  const confirmed = await showConfirm(
    'Eliminar Movimiento',
    `¿Está seguro que desea eliminar este movimiento?\n\n${movement.type === 'ingreso' ? 'Ingreso' : 'Egreso'}: ${formatAmount(movement.amount)}\nCaja: ${OPERATIONAL_VIEW_BOXES[movement.box] || movement.box}\nMotivo: ${movement.reason}`,
    'Sí, Eliminar',
    'Cancelar'
  );
  
  if (!confirmed) {
    return; // Usuario canceló
  }
  
  try {
    showSpinner('Eliminando movimiento...');
    await window.nrd.shiftMovements.delete(movementId);
    hideSpinner();
    await showSuccess('Movimiento eliminado exitosamente');
    logger.audit('MOVEMENT_DELETED', { movementId, shiftId: currentShiftId });
  } catch (error) {
    hideSpinner();
    logger.error('Error deleting movement', error);
    await showError(error.message || 'Error al eliminar movimiento');
  }
};

// Inicializar vista operativa
function initializeShiftOperational(shiftId) {
  logger.debug('Initializing shift operational view', { shiftId });
  if (!shiftId) {
    logger.warn('No shiftId provided to initializeShiftOperational');
    showError('No se proporcionó ID de turno').then(() => {
      switchView('shifts');
    });
    return;
  }
  // LoadOperationalView is async, but we don't need to wait for it
  // It will handle errors internally and call renderOperationalView when ready
  loadOperationalView(shiftId).catch((error) => {
    logger.error('Error in loadOperationalView', error);
    showError('Error al cargar la vista operativa').then(() => {
      switchView('shifts');
    });
  });
}
