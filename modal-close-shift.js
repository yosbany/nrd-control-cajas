// Modal de cierre de turno
async function showCloseShiftModal(shift) {
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

    titleEl.textContent = 'Cerrar Turno';
    
    // Obtener conteos de apertura si existen
    const openingCounts = shift.productCounts?.opening || {};
    const cafeSeniorOpening = openingCounts['cafe-senior'] || 0;
    const cigarrosGrandesOpening = openingCounts['cigarros-grandes'] || 0;
    const cigarrosChicosOpening = openingCounts['cigarros-chicos'] || 0;
    const tabacoOpening = openingCounts['tabaco'] || 0;
    
    // Obtener conteos de cierre si existen (para edición)
    const closingCounts = shift.productCounts?.closing || {};
    const cafeSeniorClosing = closingCounts['cafe-senior'] || '';
    const cigarrosGrandesClosing = closingCounts['cigarros-grandes'] || '';
    const cigarrosChicosClosing = closingCounts['cigarros-chicos'] || '';
    const tabacoClosing = closingCounts['tabaco'] || '';
    
    let html = '<div class="space-y-5 sm:space-y-6">';
    html += '<p class="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Ingrese el efectivo facturado por cada caja:</p>';
    
    // Efectivo facturado Caja Mostrador
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Efectivo Facturado - Caja Mostrador</label>
        <div class="flex gap-3">
          <input type="number" id="collected-cash-mostrador" step="0.01" min="0" required
            placeholder="0.00"
            class="flex-1 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          <button type="button" onclick="showCollectedCashBreakdown('mostrador')"
            class="px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  min-h-[56px] min-w-[120px]">
            Desglose
          </button>
        </div>
        <div id="collected-cash-mostrador-breakdown" class="mt-2 text-sm sm:text-base text-gray-500"></div>
      </div>
    `;
    
    // Efectivo facturado Caja Banca de Juegos
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Efectivo Facturado - Caja Banca de Juegos</label>
        <div class="flex gap-3">
          <input type="number" id="collected-cash-banca-juegos" step="0.01" min="0" required
            placeholder="0.00"
            class="flex-1 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          <button type="button" onclick="showCollectedCashBreakdown('banca-juegos')"
            class="px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  min-h-[56px] min-w-[120px]">
            Desglose
          </button>
        </div>
        <div id="collected-cash-banca-juegos-breakdown" class="mt-2 text-sm sm:text-base text-gray-500"></div>
      </div>
    `;
    
    // Conteo de Productos
    html += `
      <div class="border-2 border-gray-200  p-4 sm:p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Conteo de Productos</h3>
        <p class="text-sm text-gray-600 mb-3 sm:mb-4">Registre el conteo final de productos controlados en este turno</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label class="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              Café Senior
              <span class="text-xs text-gray-500 block font-normal">Apertura: ${cafeSeniorOpening}</span>
            </label>
            <input type="number" id="close-product-cafe-senior" step="1" min="0" value="${cafeSeniorClosing}" required
              placeholder="0"
              class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          </div>
          <div>
            <label class="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              Cigarros Grandes
              <span class="text-xs text-gray-500 block font-normal">Apertura: ${cigarrosGrandesOpening}</span>
            </label>
            <input type="number" id="close-product-cigarros-grandes" step="1" min="0" value="${cigarrosGrandesClosing}" required
              placeholder="0"
              class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          </div>
          <div>
            <label class="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              Cigarros Chicos
              <span class="text-xs text-gray-500 block font-normal">Apertura: ${cigarrosChicosOpening}</span>
            </label>
            <input type="number" id="close-product-cigarros-chicos" step="1" min="0" value="${cigarrosChicosClosing}" required
              placeholder="0"
              class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          </div>
          <div>
            <label class="block mb-2 text-sm sm:text-base font-semibold text-gray-700">
              Tabaco
              <span class="text-xs text-gray-500 block font-normal">Apertura: ${tabacoOpening}</span>
            </label>
            <input type="number" id="close-product-tabaco" step="1" min="0" value="${tabacoClosing}" required
              placeholder="0"
              class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          </div>
        </div>
      </div>
    `;
    
    // Observaciones finales
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Observaciones Finales (Opcional)</label>
        <textarea id="close-observations" rows="4"
          placeholder="Observaciones adicionales sobre el turno..."
          class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  resize-y min-h-[120px]">${shift.observations || ''}</textarea>
      </div>
    `;
    
    html += '</div>';
    
    // Guardar el HTML antes de asignarlo (para poder restaurarlo después del desglose)
    const initialHTML = html;
    
    messageEl.innerHTML = html;
    confirmBtn.textContent = 'Cerrar Turno';
    cancelBtn.textContent = 'Cancelar';
    
    // Hacer botones más grandes para táctil
    confirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';
    cancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';

    modal.classList.remove('hidden');
    
    // Variables para almacenar breakdowns
    let mostradorBreakdown = null;
    let bancaBreakdown = null;
    
    // Guardar el HTML original del modal de cierre para restaurarlo después del desglose
    const savedCloseShiftHTML = html;
    const savedCloseShiftTitle = titleEl.textContent;
    const savedCloseShiftConfirmText = confirmBtn.textContent;
    const savedCloseShiftCancelText = cancelBtn.textContent;
    const savedCloseShiftConfirmClass = confirmBtn.className;
    const savedCloseShiftCancelClass = cancelBtn.className;
    
    // Función para mostrar breakdown
    window.showCollectedCashBreakdown = async function(box) {
      const inputId = `collected-cash-${box}`;
      
      // Guardar valores actuales antes de abrir el desglose
      const input = document.getElementById(inputId);
      if (!input) {
        await showError('Error: No se pudo encontrar el campo de entrada');
        return;
      }
      
      const inputValue = input.value;
      const amount = parseFloat(inputValue) || 0;
      
      if (amount <= 0) {
        await showError('Primero ingrese el monto de efectivo facturado');
        return;
      }
      
      // Remover listeners temporalmente antes de mostrar el desglose
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      
      // Guardar valores de todos los inputs antes de abrir el desglose
      const mostradorInputValue = document.getElementById('collected-cash-mostrador')?.value || '';
      const bancaInputValue = document.getElementById('collected-cash-banca-juegos')?.value || '';
      const observationsValue = document.getElementById('close-observations')?.value || '';
      const cafeSeniorValue = document.getElementById('close-product-cafe-senior')?.value || '';
      const cigarrosGrandesValue = document.getElementById('close-product-cigarros-grandes')?.value || '';
      const cigarrosChicosValue = document.getElementById('close-product-cigarros-chicos')?.value || '';
      const tabacoValue = document.getElementById('close-product-tabaco')?.value || '';
      
      const currentBreakdown = box === 'mostrador' ? mostradorBreakdown : bancaBreakdown;
      const breakdown = await showCashBreakdownModal(
        `Desglose de Efectivo Facturado - ${box === 'mostrador' ? 'Caja Mostrador' : 'Caja Banca de Juegos'}`,
        currentBreakdown,
        amount
      );
      
      // Restaurar el modal de cierre después del desglose
      messageEl.innerHTML = savedCloseShiftHTML;
      titleEl.textContent = savedCloseShiftTitle;
      
      // Esperar un momento para que el DOM se actualice completamente
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // IMPORTANTE: Re-obtener referencias a los botones después de restaurar HTML
      // porque showConfirm puede haberlos reemplazado
      const restoredConfirmBtn = document.getElementById('modal-confirm');
      const restoredCancelBtn = document.getElementById('modal-cancel');
      
      if (!restoredConfirmBtn || !restoredCancelBtn) {
        logger.error('Error restoring modal buttons', {
          confirmBtn: !!restoredConfirmBtn,
          cancelBtn: !!restoredCancelBtn
        });
        await showError('Error: No se pudieron restaurar los controles del modal');
        return;
      }
      
      // Restaurar propiedades de botones
      restoredConfirmBtn.textContent = savedCloseShiftConfirmText;
      restoredCancelBtn.textContent = savedCloseShiftCancelText;
      restoredConfirmBtn.className = savedCloseShiftConfirmClass;
      restoredCancelBtn.className = savedCloseShiftCancelClass;
      
      // Esperar un poco más y verificar que los inputs estén disponibles
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Restaurar valores de inputs
      const restoredMostradorInput = document.getElementById('collected-cash-mostrador');
      const restoredBancaInput = document.getElementById('collected-cash-banca-juegos');
      const restoredObservationsInput = document.getElementById('close-observations');
      const restoredCafeSeniorInput = document.getElementById('close-product-cafe-senior');
      const restoredCigarrosGrandesInput = document.getElementById('close-product-cigarros-grandes');
      const restoredCigarrosChicosInput = document.getElementById('close-product-cigarros-chicos');
      const restoredTabacoInput = document.getElementById('close-product-tabaco');
      
      if (!restoredMostradorInput || !restoredBancaInput) {
        logger.error('Error restoring modal inputs', {
          mostradorInput: !!restoredMostradorInput,
          bancaInput: !!restoredBancaInput,
          observationsInput: !!restoredObservationsInput
        });
        await showError('Error: No se pudieron restaurar los campos del formulario');
        return;
      }
      
      restoredMostradorInput.value = mostradorInputValue;
      restoredBancaInput.value = bancaInputValue;
      if (restoredObservationsInput) restoredObservationsInput.value = observationsValue;
      if (restoredCafeSeniorInput) restoredCafeSeniorInput.value = cafeSeniorValue;
      if (restoredCigarrosGrandesInput) restoredCigarrosGrandesInput.value = cigarrosGrandesValue;
      if (restoredCigarrosChicosInput) restoredCigarrosChicosInput.value = cigarrosChicosValue;
      if (restoredTabacoInput) restoredTabacoInput.value = tabacoValue;
      
      // Restaurar listeners con las nuevas referencias
      restoredConfirmBtn.addEventListener('click', handleConfirm);
      restoredCancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleBackgroundClick);
      
      if (breakdown) {
        if (box === 'mostrador') {
          mostradorBreakdown = breakdown;
        } else {
          bancaBreakdown = breakdown;
        }
        
        const displayEl = document.getElementById(`${inputId}-breakdown`);
        if (displayEl) {
          const formatted = window.cashBreakdownUtils?.formatBreakdown(breakdown);
          displayEl.textContent = formatted ? `Desglose: ${formatted}` : '';
        }
      }
      
      // Mostrar el modal de cierre nuevamente
      modal.classList.remove('hidden');
    };

    const handleConfirm = async () => {
      // Re-obtener referencias a los inputs cada vez por si el DOM cambió
      const mostradorInput = document.getElementById('collected-cash-mostrador');
      const bancaInput = document.getElementById('collected-cash-banca-juegos');
      const observationsInput = document.getElementById('close-observations');
      const cafeSeniorInput = document.getElementById('close-product-cafe-senior');
      const cigarrosGrandesInput = document.getElementById('close-product-cigarros-grandes');
      const cigarrosChicosInput = document.getElementById('close-product-cigarros-chicos');
      const tabacoInput = document.getElementById('close-product-tabaco');
      
      if (!mostradorInput || !bancaInput || !cafeSeniorInput || !cigarrosGrandesInput || 
          !cigarrosChicosInput || !tabacoInput) {
        logger.error('Error al obtener datos del formulario', {
          mostradorInput: !!mostradorInput,
          bancaInput: !!bancaInput,
          modalVisible: !modal.classList.contains('hidden')
        });
        await showError('Error al obtener datos del formulario. Por favor, intente nuevamente.');
        return;
      }
      
      const collectedCashData = {
        'mostrador': parseFloat(mostradorInput.value) || 0,
        'banca-juegos': parseFloat(bancaInput.value) || 0
      };
      
      const productCountsData = {
        'cafe-senior': parseInt(cafeSeniorInput.value) || 0,
        'cigarros-grandes': parseInt(cigarrosGrandesInput.value) || 0,
        'cigarros-chicos': parseInt(cigarrosChicosInput.value) || 0,
        'tabaco': parseInt(tabacoInput.value) || 0
      };
      
      // Validar
      const validation = window.shiftValidations?.validateCloseShiftData(shift, collectedCashData);
      if (!validation.valid) {
        await showError(validation.errors.join('\n'));
        return;
      }
      
      // Confirmación final
      const confirmed = await showConfirm(
        'Cerrar Turno',
        '¿Está seguro que desea cerrar el turno? Esta acción no se puede deshacer.',
        'Sí, Cerrar',
        'Cancelar'
      );
      
      if (!confirmed) {
        return;
      }
      
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.showCollectedCashBreakdown;
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      
      // Preparar datos para cerrar
      const closeData = {
        collectedCash: collectedCashData,
        collectedCashBreakdown: {
          'mostrador': mostradorBreakdown,
          'banca-juegos': bancaBreakdown
        },
        productCounts: {
          closing: productCountsData
        },
        observations: observationsInput ? observationsInput.value.trim() : null
      };
      
      resolve(closeData);
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.showCollectedCashBreakdown;
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      resolve(null);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleCancel();
        modal.removeEventListener('click', handleBackgroundClick);
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Función para cerrar turno (global)
window.closeShift = async function(shift) {
  try {
    if (!shift) {
      await showError('No se proporcionó el turno');
      return;
    }
    
    if (shift.closed) {
      await showError('El turno ya está cerrado');
      return;
    }
    
    // Validar que puede cerrarse
    const canClose = window.shiftValidations?.canCloseShift(shift);
    if (!canClose.canClose) {
      await showError(canClose.errors.join('\n'));
      return;
    }
    
    // Mostrar modal de cierre
    const closeData = await showCloseShiftModal(shift);
    if (!closeData) {
      return; // Usuario canceló
    }
    
    showSpinner('Cerrando turno...');
    
    // Actualizar turno con efectivo facturado y conteos de productos
    const updates = {
      closed: true,
      closedAt: Date.now(),
      observations: closeData.observations || null,
      boxes: {
        'mostrador': {
          ...shift.boxes.mostrador,
          collectedCash: closeData.collectedCash.mostrador,
          collectedCashBreakdown: closeData.collectedCashBreakdown.mostrador || null
        },
        'banca-juegos': {
          ...shift.boxes['banca-juegos'],
          collectedCash: closeData.collectedCash['banca-juegos'],
          collectedCashBreakdown: closeData.collectedCashBreakdown['banca-juegos'] || null
        }
      },
      productCounts: {
        ...(shift.productCounts || {}),
        closing: closeData.productCounts.closing
      }
    };
    
    await window.nrd.shifts.update(shift.id, updates);
    
    logger.audit('SHIFT_CLOSED', { shiftId: shift.id, date: shift.date, shift: shift.shift });
    
    // Enviar notificación de cierre de turno
    if (typeof window.notifyShiftClosed === 'function') {
      try {
        const closedShift = { ...shift, ...updates };
        await window.notifyShiftClosed(closedShift);
      } catch (error) {
        // No interrumpir el flujo si falla la notificación
        logger.warn('Error al enviar notificación de cierre de turno', error);
      }
    }
    
    hideSpinner();
    
    // Generar e imprimir reporte (función definida en shift-report.js)
    if (typeof window.generateAndPrintReport === 'function') {
      await window.generateAndPrintReport(shift.id);
    } else {
      logger.warn('generateAndPrintReport function not found');
    }
    
    await showSuccess('Turno cerrado exitosamente');
    
    // Regresar a vista principal
    switchView('shifts');
    
  } catch (error) {
    hideSpinner();
    logger.error('Error closing shift', error);
    await showError(error.message || 'Error al cerrar turno');
  }
};
