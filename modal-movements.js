// Modal de movimiento (global)
window.showMovementModal = async function(movement = null, box, shiftId, type = null) {
  return new Promise((resolve) => {
    // Asegurar que el modal esté en el body y disponible
    const modal = document.getElementById('custom-modal');
    
    // Restaurar el modal al body si está en otro lugar
    if (modal && modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
    
    // Restaurar título y clases del modal si fueron modificadas
    const titleEl = document.getElementById('modal-title');
    if (titleEl) {
      titleEl.className = 'text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-black';
    }
    
    // Restaurar clases del contenido del modal
    let modalContent = modal?.querySelector('.bg-white');
    if (modalContent) {
      modalContent.classList.remove('border-green-600', 'border-red-600');
      modalContent.classList.add('border-2', 'border-gray-200');
    }
    
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
      logger.error('Modal elements not found', { modal: !!modal, titleEl: !!titleEl, messageEl: !!messageEl, confirmBtn: !!confirmBtn, cancelBtn: !!cancelBtn });
      resolve(null);
      return;
    }

    const isEdit = !!movement;
    const movementType = type || movement?.type || 'ingreso';
    const movementBox = box || movement?.box || 'mostrador';
    
    // Configurar título y color del cabezal según el tipo
    const titleText = movement ? 'Editar Movimiento' : 'Nuevo Movimiento';
    const headerColor = movementType === 'ingreso' ? 'bg-green-600' : 'bg-red-600';
    const borderColor = movementType === 'ingreso' ? 'border-green-600' : 'border-red-600';
    
    // Actualizar el título (ocultarlo porque usaremos el cabezal)
    titleEl.textContent = '';
    titleEl.className = 'hidden';
    
    // Agregar cabezal con color al modal (reutilizar modalContent si ya existe)
    if (!modalContent) {
      modalContent = modal.querySelector('.bg-white');
    }
    if (modalContent) {
      // Remover clases de color anteriores y agregar la nueva
      modalContent.classList.remove('border-2', 'border-gray-200', 'border-green-600', 'border-red-600');
      modalContent.classList.add('border-2', borderColor);
    }
    
    // HTML con cabezal con color
    let html = `
      <div class="${headerColor} text-white px-5 sm:px-6 py-3 sm:py-4  -m-5 sm:-m-6 mb-4 sm:mb-6 uppercase tracking-wider text-lg sm:text-xl font-semibold">
        ${movementType === 'ingreso' ? 'INGRESO' : 'EGRESO'}
      </div>
      <div class="space-y-5 sm:space-y-6">`;
    
    // Monto
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Monto</label>
        <div class="flex gap-3">
          <input type="number" id="movement-amount" step="0.01" min="0" value="${movement?.amount || ''}" required
            placeholder="0.00"
            class="flex-1 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  min-h-[56px]">
          <button type="button" onclick="showMovementBreakdown()"
            class="px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  min-h-[56px] min-w-[120px]">
            Desglose
          </button>
        </div>
        <div id="movement-breakdown-display" class="mt-2 text-sm sm:text-base text-gray-500"></div>
      </div>
    `;
    
    // Motivo
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Motivo</label>
        <textarea id="movement-reason" rows="4" required
          placeholder="Descripción del movimiento..."
          class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  resize-y min-h-[120px]">${movement?.reason || ''}</textarea>
      </div>
    `;
    
    html += '</div>';
    
    messageEl.innerHTML = html;
    confirmBtn.textContent = isEdit ? 'Actualizar' : 'Guardar';
    cancelBtn.textContent = 'Cancelar';
    
    // Hacer botones más grandes para táctil
    confirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';
    cancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';

    modal.classList.remove('hidden');
    
    // Mover el modal al elemento fullscreen si está activo
    if (typeof window.moveModalsToFullscreen === 'function') {
      window.moveModalsToFullscreen();
    }
    
    // Variable para almacenar breakdown
    let movementBreakdown = movement?.breakdown || null;
    
    // Función para mostrar breakdown
    window.showMovementBreakdown = async function() {
      const amountInput = document.getElementById('movement-amount');
      const amount = parseFloat(amountInput.value) || 0;
      
      if (amount <= 0) {
        await showError('Primero ingrese el monto');
        return;
      }
      
      const breakdown = await showCashBreakdownModal(
        'Desglose de Efectivo',
        movementBreakdown,
        amount
      );
      
      if (breakdown) {
        movementBreakdown = breakdown;
        const displayEl = document.getElementById('movement-breakdown-display');
        if (displayEl) {
          const formatted = window.cashBreakdownUtils?.formatBreakdown(breakdown);
          displayEl.textContent = formatted ? `Desglose: ${formatted}` : '';
        }
      }
    };
    
    // Actualizar display si hay breakdown inicial
    if (movementBreakdown) {
      const displayEl = document.getElementById('movement-breakdown-display');
      if (displayEl) {
        const formatted = window.cashBreakdownUtils?.formatBreakdown(movementBreakdown);
        displayEl.textContent = formatted ? `Desglose: ${formatted}` : '';
      }
    }

    const handleConfirm = async () => {
      const amountInput = document.getElementById('movement-amount');
      const reasonInput = document.getElementById('movement-reason');
      
      if (!amountInput || !reasonInput) {
        await showError('Error al obtener datos del formulario');
        return;
      }
      
      const movementData = {
        shiftId: shiftId,
        box: movementBox,
        type: movementType,
        amount: parseFloat(amountInput.value) || 0,
        reason: reasonInput.value.trim(),
        moment: 'durante', // Valor por defecto
        breakdown: movementBreakdown
      };
      
      // Validar
      const validation = window.shiftValidations?.validateMovement(movementData);
      if (!validation.valid) {
        await showError(validation.errors.join('\n'));
        return;
      }
      
      // Limpiar listeners antes de cerrar
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.showMovementBreakdown;
      
      // Restaurar estilos del modal
      const modalContent = modal.querySelector('.bg-white');
      if (modalContent) {
        modalContent.classList.remove('border-green-600', 'border-red-600');
        modalContent.classList.add('border-2', 'border-gray-200');
      }
      // Restaurar título original
      if (titleEl) {
        titleEl.className = 'text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-black';
        titleEl.textContent = '';
      }
      
      // Restaurar el modal al body para que pueda ser usado nuevamente
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      
      // Guardar movimiento
      try {
        showSpinner(isEdit ? 'Actualizando movimiento...' : 'Guardando movimiento...');
        
        if (isEdit) {
          await window.nrd.shiftMovements.update(movement.id, movementData);
        } else {
          await window.nrd.shiftMovements.create(movementData);
        }
        
        hideSpinner();
        // No mostrar mensaje de éxito, solo cerrar el modal
        resolve(movementData);
      } catch (error) {
        hideSpinner();
        logger.error('Error saving movement', error);
        await showError(error.message || 'Error al guardar movimiento');
        resolve(null);
      }
    };

    const handleCancel = () => {
      // Limpiar listeners
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      
      // Limpiar estilos del modal
      const modalContent = modal.querySelector('.bg-white');
      if (modalContent) {
        modalContent.classList.remove('border-green-600', 'border-red-600');
        modalContent.classList.add('border-2', 'border-gray-200');
      }
      // Restaurar título original
      if (titleEl) {
        titleEl.className = 'text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-black';
        titleEl.textContent = '';
      }
      
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.showMovementBreakdown;
      
      // Restaurar el modal al body para que pueda ser usado nuevamente
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      
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
