// Vista de detalle de turno cerrado (solo lectura)

// Cajas fijas del sistema (namespace para evitar conflictos)
const DETAIL_VIEW_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos',
  'otros': 'Otros'
};

// Turnos disponibles (namespace para evitar conflictos)
const DETAIL_VIEW_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

let detailCurrentShift = null;
let detailMovements = [];
let detailIncidents = [];

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

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Calcular totales por caja
function calculateBoxTotals(box) {
  const boxMovements = detailMovements.filter(m => m.box === box);
  
  const ingresos = boxMovements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const egresos = boxMovements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const fondo = detailCurrentShift?.boxes?.[box]?.initialFund || 0;
  const efectivoFacturado = detailCurrentShift?.boxes?.[box]?.collectedCash || 0;
  
  const saldo = fondo + efectivoFacturado + ingresos - egresos;
  
  return { ingresos, egresos, fondo, efectivoFacturado, saldo };
}

// Cargar detalle de turno
async function loadShiftDetail(shiftId) {
  logger.debug('Loading shift detail', { shiftId });
  
  if (!shiftId) {
    await showError('No se proporcionó ID de turno');
    switchView('shifts');
    return;
  }
  
  try {
    // Validar que nrd y servicios estén disponibles
    if (!window.nrd || !window.nrd.shifts || !window.nrd.shiftMovements || !window.nrd.shiftIncidents) {
      await showError('Servicios no disponibles. Por favor, recarga la página.');
      switchView('shifts');
      return;
    }
    
    showSpinner('Cargando detalle del turno...');
    
    // Cargar turno
    const shift = await window.nrd.shifts.getById(shiftId);
    if (!shift) {
      hideSpinner();
      await showError('Turno no encontrado');
      switchView('shifts');
      return;
    }
    
    // Validar que esté cerrado
    if (!shift.closed) {
      hideSpinner();
      await showInfo('Este turno está abierto. Redirigiendo a vista operativa...');
      switchView('shift-operational', shiftId);
      return;
    }
    
    detailCurrentShift = { id: shiftId, ...shift };
    
    // Cargar movimientos
    detailMovements = await window.nrd.shiftMovements.queryByShift(shiftId);
    
    // Cargar incidentes
    detailIncidents = await window.nrd.shiftIncidents.queryByShift(shiftId);
    
    hideSpinner();
    renderReadOnlyDetail();
    
  } catch (error) {
    hideSpinner();
    logger.error('Error loading shift detail', error);
    await showError('Error al cargar el detalle del turno');
    switchView('shifts');
  }
}

// Renderizar vista de solo lectura
function renderReadOnlyDetail() {
  const container = document.getElementById('shift-detail-view');
  if (!container || !detailCurrentShift) return;
  
  const shiftLabel = DETAIL_VIEW_SHIFTS[detailCurrentShift.shift] || detailCurrentShift.shift;
  const formattedDate = formatDate(detailCurrentShift.date);
  const closedDate = detailCurrentShift.closedAt ? new Date(detailCurrentShift.closedAt).toLocaleString('es-CL') : 'N/A';
  
  const mostradorTotals = calculateBoxTotals('mostrador');
  const bancaTotals = calculateBoxTotals('banca-juegos');
  
  const mostradorMovements = detailMovements.filter(m => m.box === 'mostrador');
  const bancaMovements = detailMovements.filter(m => m.box === 'banca-juegos');
  
  const html = `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-gray-600 px-6 py-5 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold tracking-tight text-white">Detalle del Turno</h2>
            <p class="text-sm text-white/90 mt-1">${formattedDate} - ${shiftLabel}</p>
            <p class="text-xs text-white/80 mt-1">Cajera: ${escapeHtml(detailCurrentShift.cashierName || 'N/A')}</p>
            <p class="text-xs text-white/80 mt-1">Cerrado: ${closedDate}</p>
          </div>
          <button onclick="backToShiftsFromDetail()" 
            class="text-white hover:text-gray-200 text-2xl font-light w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-colors ">
            ×
          </button>
        </div>
      </div>
      
      <!-- Caja Mostrador -->
      <div class="border border-gray-200  p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${DETAIL_VIEW_BOXES.mostrador}</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Fondo Recibido:</span>
            <span class="font-medium">${formatAmount(mostradorTotals.fondo)}</span>
          </div>
          ${detailCurrentShift.boxes?.mostrador?.initialFundBreakdown ? `
            <div class="text-xs text-gray-500 pl-4">
              Desglose: ${window.cashBreakdownUtils?.formatBreakdown(detailCurrentShift.boxes.mostrador.initialFundBreakdown) || ''}
            </div>
          ` : ''}
          <div class="flex justify-between">
            <span class="text-gray-600">Efectivo Facturado:</span>
            <span class="font-medium">${formatAmount(mostradorTotals.efectivoFacturado)}</span>
          </div>
          ${detailCurrentShift.boxes?.mostrador?.collectedCashBreakdown ? `
            <div class="text-xs text-gray-500 pl-4">
              Desglose: ${window.cashBreakdownUtils?.formatBreakdown(detailCurrentShift.boxes.mostrador.collectedCashBreakdown) || ''}
            </div>
          ` : ''}
          <div class="flex justify-between text-green-600">
            <span>Total Ingresos:</span>
            <span class="font-medium">${formatAmount(mostradorTotals.ingresos)}</span>
          </div>
          <div class="flex justify-between text-red-600">
            <span>Total Egresos:</span>
            <span class="font-medium">${formatAmount(mostradorTotals.egresos)}</span>
          </div>
          <div class="pt-2 border-t border-gray-200 flex justify-between">
            <span class="font-semibold text-gray-900">Saldo:</span>
            <span class="font-bold text-lg">${formatAmount(mostradorTotals.saldo)}</span>
          </div>
        </div>
        
        ${mostradorMovements.length > 0 ? `
          <div class="mt-4 pt-4 border-t border-gray-200">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Movimientos (${mostradorMovements.length})</h4>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              ${mostradorMovements.map(m => `
                <div class="bg-gray-50  p-2 text-xs">
                  <div class="flex justify-between">
                    <span class="font-medium">${m.type === 'ingreso' ? 'Ingreso' : 'Egreso'}</span>
                    <span class="${m.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}">${formatAmount(m.amount)}</span>
                  </div>
                  <div class="text-gray-600 mt-1">${escapeHtml(m.reason)}</div>
                  <div class="text-gray-400 text-xs mt-1">${m.moment}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Caja Banca de Juegos -->
      <div class="border border-gray-200  p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${DETAIL_VIEW_BOXES['banca-juegos']}</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Fondo Recibido:</span>
            <span class="font-medium">${formatAmount(bancaTotals.fondo)}</span>
          </div>
          ${detailCurrentShift.boxes?.['banca-juegos']?.initialFundBreakdown ? `
            <div class="text-xs text-gray-500 pl-4">
              Desglose: ${window.cashBreakdownUtils?.formatBreakdown(detailCurrentShift.boxes['banca-juegos'].initialFundBreakdown) || ''}
            </div>
          ` : ''}
          <div class="flex justify-between">
            <span class="text-gray-600">Efectivo Facturado:</span>
            <span class="font-medium">${formatAmount(bancaTotals.efectivoFacturado)}</span>
          </div>
          ${detailCurrentShift.boxes?.['banca-juegos']?.collectedCashBreakdown ? `
            <div class="text-xs text-gray-500 pl-4">
              Desglose: ${window.cashBreakdownUtils?.formatBreakdown(detailCurrentShift.boxes['banca-juegos'].collectedCashBreakdown) || ''}
            </div>
          ` : ''}
          <div class="flex justify-between text-green-600">
            <span>Total Ingresos:</span>
            <span class="font-medium">${formatAmount(bancaTotals.ingresos)}</span>
          </div>
          <div class="flex justify-between text-red-600">
            <span>Total Egresos:</span>
            <span class="font-medium">${formatAmount(bancaTotals.egresos)}</span>
          </div>
          <div class="pt-2 border-t border-gray-200 flex justify-between">
            <span class="font-semibold text-gray-900">Saldo:</span>
            <span class="font-bold text-lg">${formatAmount(bancaTotals.saldo)}</span>
          </div>
        </div>
        
        ${bancaMovements.length > 0 ? `
          <div class="mt-4 pt-4 border-t border-gray-200">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Movimientos (${bancaMovements.length})</h4>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              ${bancaMovements.map(m => `
                <div class="bg-gray-50  p-2 text-xs">
                  <div class="flex justify-between">
                    <span class="font-medium">${m.type === 'ingreso' ? 'Ingreso' : 'Egreso'}</span>
                    <span class="${m.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}">${formatAmount(m.amount)}</span>
                  </div>
                  <div class="text-gray-600 mt-1">${escapeHtml(m.reason)}</div>
                  <div class="text-gray-400 text-xs mt-1">${m.moment}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Conteo de Productos -->
      ${detailCurrentShift.productCounts ? `
        <div class="border border-gray-200 p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Conteo de Productos</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Café Senior -->
            <div class="bg-gray-50 p-3">
              <div class="font-medium text-sm text-gray-700 mb-2">Café Senior</div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Apertura:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.opening?.['cafe-senior'] ?? 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-600">Cierre:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.closing?.['cafe-senior'] ?? 'N/A'}</span>
              </div>
              ${detailCurrentShift.productCounts?.opening?.['cafe-senior'] !== undefined && detailCurrentShift.productCounts?.closing?.['cafe-senior'] !== undefined ? `
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span class="text-xs font-medium text-gray-700">Diferencia:</span>
                  <span class="font-semibold ${(detailCurrentShift.productCounts.closing['cafe-senior'] - detailCurrentShift.productCounts.opening['cafe-senior']) >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${detailCurrentShift.productCounts.closing['cafe-senior'] - detailCurrentShift.productCounts.opening['cafe-senior']}
                  </span>
                </div>
              ` : ''}
            </div>
            
            <!-- Cigarros Grandes -->
            <div class="bg-gray-50 p-3">
              <div class="font-medium text-sm text-gray-700 mb-2">Cigarros Grandes</div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Apertura:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.opening?.['cigarros-grandes'] ?? 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-600">Cierre:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.closing?.['cigarros-grandes'] ?? 'N/A'}</span>
              </div>
              ${detailCurrentShift.productCounts?.opening?.['cigarros-grandes'] !== undefined && detailCurrentShift.productCounts?.closing?.['cigarros-grandes'] !== undefined ? `
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span class="text-xs font-medium text-gray-700">Diferencia:</span>
                  <span class="font-semibold ${(detailCurrentShift.productCounts.closing['cigarros-grandes'] - detailCurrentShift.productCounts.opening['cigarros-grandes']) >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${detailCurrentShift.productCounts.closing['cigarros-grandes'] - detailCurrentShift.productCounts.opening['cigarros-grandes']}
                  </span>
                </div>
              ` : ''}
            </div>
            
            <!-- Cigarros Chicos -->
            <div class="bg-gray-50 p-3">
              <div class="font-medium text-sm text-gray-700 mb-2">Cigarros Chicos</div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Apertura:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.opening?.['cigarros-chicos'] ?? 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-600">Cierre:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.closing?.['cigarros-chicos'] ?? 'N/A'}</span>
              </div>
              ${detailCurrentShift.productCounts?.opening?.['cigarros-chicos'] !== undefined && detailCurrentShift.productCounts?.closing?.['cigarros-chicos'] !== undefined ? `
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span class="text-xs font-medium text-gray-700">Diferencia:</span>
                  <span class="font-semibold ${(detailCurrentShift.productCounts.closing['cigarros-chicos'] - detailCurrentShift.productCounts.opening['cigarros-chicos']) >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${detailCurrentShift.productCounts.closing['cigarros-chicos'] - detailCurrentShift.productCounts.opening['cigarros-chicos']}
                  </span>
                </div>
              ` : ''}
            </div>
            
            <!-- Tabaco -->
            <div class="bg-gray-50 p-3">
              <div class="font-medium text-sm text-gray-700 mb-2">Tabaco</div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">Apertura:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.opening?.['tabaco'] ?? 'N/A'}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-600">Cierre:</span>
                <span class="font-medium">${detailCurrentShift.productCounts?.closing?.['tabaco'] ?? 'N/A'}</span>
              </div>
              ${detailCurrentShift.productCounts?.opening?.['tabaco'] !== undefined && detailCurrentShift.productCounts?.closing?.['tabaco'] !== undefined ? `
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span class="text-xs font-medium text-gray-700">Diferencia:</span>
                  <span class="font-semibold ${(detailCurrentShift.productCounts.closing['tabaco'] - detailCurrentShift.productCounts.opening['tabaco']) >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${detailCurrentShift.productCounts.closing['tabaco'] - detailCurrentShift.productCounts.opening['tabaco']}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Incidentes -->
      ${detailIncidents.length > 0 ? `
        <div class="border border-gray-200  p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Incidentes (${detailIncidents.length})</h3>
          <div class="space-y-3">
            ${detailIncidents.map((incident, index) => `
              <div class="bg-gray-50  p-3">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="font-medium text-sm">${index + 1}. ${escapeHtml(incident.type)}${incident.customType ? ` - ${escapeHtml(incident.customType)}` : ''}</div>
                    <div class="text-xs text-gray-500 mt-1">Caja: ${DETAIL_VIEW_BOXES[incident.box] || incident.box}</div>
                  </div>
                  ${incident.amount ? `
                    <div class="text-sm font-medium text-red-600">${formatAmount(incident.amount)}</div>
                  ` : ''}
                </div>
                <div class="text-sm text-gray-700 mt-2">${escapeHtml(incident.description)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="border border-gray-200  p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Incidentes</h3>
          <p class="text-gray-500 text-sm">No se registraron incidentes en este turno</p>
        </div>
      `}
      
      <!-- Observaciones -->
      ${detailCurrentShift.observations ? `
        <div class="border border-gray-200  p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Observaciones</h3>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(detailCurrentShift.observations)}</p>
        </div>
      ` : ''}
      
      <!-- Firma -->
      <div class="border border-gray-200  p-4">
        <div class="text-sm text-gray-600">Firma:</div>
        <div class="text-base font-medium text-gray-900 mt-1">${escapeHtml(detailCurrentShift.cashierName || 'N/A')}</div>
      </div>
      
      <!-- Botones -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <button onclick="reprintReport('${detailCurrentShift.id}')"
          class="flex-1 px-6 py-3 bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-sm font-light ">
          Reimprimir Reporte
        </button>
        <button onclick="backToShiftsFromDetail()"
          class="flex-1 px-6 py-3 border border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm font-light ">
          Volver
        </button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Reimprimir reporte (global para onclick)
window.reprintReport = async function(shiftId) {
  if (typeof window.generateAndPrintReport === 'function') {
    await window.generateAndPrintReport(shiftId);
  } else {
    await showError('Función de generación de reporte no disponible');
  }
};

// Volver a vista principal (global para onclick)
window.backToShiftsFromDetail = function() {
  detailCurrentShift = null;
  detailMovements = [];
  detailIncidents = [];
  switchView('shifts');
};

// Inicializar vista de detalle
function initializeShiftDetail(shiftId) {
  logger.debug('Initializing shift detail view', { shiftId });
  if (!shiftId) {
    showError('No se proporcionó ID de turno').then(() => {
      switchView('shifts');
    });
    return;
  }
  loadShiftDetail(shiftId);
}
