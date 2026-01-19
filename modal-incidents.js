// Modal rápido de incidente (versión táctil)
async function showQuickIncidentModal(shiftId) {
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

    titleEl.textContent = 'Registrar Incidente';
    
    const INCIDENT_TYPES = [
      'Medio de Pago Incorrecto',
      'Cliente Rechaza la Compra',
      'Cliente Pago Incompleto',
      'Venta Externa Contingencia',
      'Otros'
    ];
    
    let html = '<div class="space-y-5 sm:space-y-6">';
    
    // Grid de botones grandes para tipos comunes
    html += `
      <div>
        <label class="block mb-4 text-base sm:text-lg font-semibold text-gray-700">Tipo de Incidente</label>
        <div class="grid grid-cols-3 gap-3">
    `;
    
    INCIDENT_TYPES.forEach((type, index) => {
      // Primer tipo (Medio de Pago Incorrecto) por defecto seleccionado
      const isSelected = index === 0;
      const buttonClasses = isSelected 
        ? 'px-4 py-4 border-2 border-red-600 bg-red-50 text-red-600 transition-colors uppercase tracking-wider text-xs sm:text-sm font-semibold text-center min-h-[64px] flex items-center justify-center'
        : 'px-4 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-xs sm:text-sm font-semibold text-center min-h-[64px] flex items-center justify-center';
      
      html += `
        <button type="button" onclick="selectIncidentType('${type}')"
          class="${buttonClasses}">
          ${type}
        </button>
      `;
    });
    
    html += '</div></div>';
    
    // Campo para tipo personalizado (si se selecciona "Otros")
    html += `
      <div id="custom-type-container" class="hidden">
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Especificar Tipo</label>
        <input type="text" id="incident-custom-type" 
          placeholder="Ingrese el tipo de incidente"
          class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg min-h-[56px]">
      </div>
    `;
    
    // Caja afectada
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Caja Afectada</label>
        <div class="flex gap-3">
          <button type="button" onclick="selectIncidentBox('mostrador')"
            class="flex-1 px-4 py-4 border-2 border-red-600 bg-red-50 text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  text-center min-h-[64px] flex items-center justify-center">
            Mostrador
          </button>
          <button type="button" onclick="selectIncidentBox('banca-juegos')"
            class="flex-1 px-4 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  text-center min-h-[64px] flex items-center justify-center">
            Banda de Juegos
          </button>
          <button type="button" onclick="selectIncidentBox('otros')"
            class="flex-1 px-4 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base font-semibold  text-center min-h-[64px] flex items-center justify-center">
            Otros
          </button>
        </div>
      </div>
    `;
    
    // Descripción
    html += `
      <div>
        <label class="block mb-3 text-base sm:text-lg font-semibold text-gray-700">Descripción</label>
        <textarea id="incident-description" rows="4" required
          placeholder="Describa el incidente..."
          class="w-full px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg  resize-y min-h-[140px]"></textarea>
      </div>
    `;
    
    html += '</div>';
    
    messageEl.innerHTML = html;
    confirmBtn.textContent = 'Guardar';
    cancelBtn.textContent = 'Cancelar';
    
    // Hacer botones más grandes para táctil
    confirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';
    cancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold  min-h-[56px]';

    modal.classList.remove('hidden');
    
    // Variables de estado
    let selectedType = 'Medio de Pago Incorrecto'; // Valor por defecto
    let selectedBox = 'mostrador'; // Valor por defecto
    
    // Seleccionar "Medio de Pago Incorrecto" y "mostrador" por defecto visualmente
    setTimeout(() => {
      if (window.selectIncidentType) {
        window.selectIncidentType('Medio de Pago Incorrecto');
      }
      if (window.selectIncidentBox) {
        window.selectIncidentBox('mostrador');
      }
    }, 0);
    
    // Funciones para seleccionar
    window.selectIncidentType = function(type) {
      selectedType = type;
      
      // Actualizar botones
      document.querySelectorAll('[onclick^="selectIncidentType"]').forEach(btn => {
        if (btn.textContent.trim() === type) {
          btn.classList.add('border-red-600', 'bg-red-50', 'text-red-600');
          btn.classList.remove('border-gray-300');
        } else {
          btn.classList.remove('border-red-600', 'bg-red-50', 'text-red-600');
          btn.classList.add('border-gray-300');
        }
      });
      
      // Mostrar campo personalizado si es "Otros"
      const customContainer = document.getElementById('custom-type-container');
      if (customContainer) {
        if (type === 'Otros') {
          customContainer.classList.remove('hidden');
        } else {
          customContainer.classList.add('hidden');
        }
      }
    };
    
    window.selectIncidentBox = function(box) {
      selectedBox = box;
      
      // Actualizar botones
      const boxLabels = {
        'mostrador': 'Mostrador',
        'banca-juegos': 'Banda de Juegos',
        'otros': 'Otros'
      };
      
      document.querySelectorAll('[onclick^="selectIncidentBox"]').forEach(btn => {
        if (btn.textContent.trim() === boxLabels[box]) {
          btn.classList.add('border-red-600', 'bg-red-50', 'text-red-600');
          btn.classList.remove('border-gray-300');
        } else {
          btn.classList.remove('border-red-600', 'bg-red-50', 'text-red-600');
          btn.classList.add('border-gray-300');
        }
      });
    };

    const handleConfirm = async () => {
      if (!selectedType) {
        await showError('Seleccione un tipo de incidente');
        return;
      }
      
      // selectedBox ya tiene valor por defecto 'mostrador', pero validamos por si acaso
      if (!selectedBox) {
        await showError('Seleccione la caja afectada');
        return;
      }
      
      const descriptionInput = document.getElementById('incident-description');
      const customTypeInput = document.getElementById('incident-custom-type');
      
      if (!descriptionInput) {
        await showError('Error al obtener datos del formulario');
        return;
      }
      
      const incidentData = {
        shiftId: shiftId,
        type: selectedType,
        customType: selectedType === 'Otros' && customTypeInput ? customTypeInput.value.trim() : null,
        box: selectedBox,
        description: descriptionInput.value.trim()
      };
      
      // Validar
      const validation = window.shiftValidations?.validateIncident(incidentData);
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
      delete window.selectIncidentType;
      delete window.selectIncidentBox;
      
      // Restaurar el modal al body para que otros modales puedan usarlo
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      
      // Restaurar título y clases del modal
      const restoredTitleEl = document.getElementById('modal-title');
      if (restoredTitleEl) {
        restoredTitleEl.className = 'text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-black';
      }
      
      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Asegurar que los modales de alerta estén en el body antes de usarlos
      const alertModal = document.getElementById('custom-alert');
      if (alertModal && alertModal.parentElement !== document.body) {
        document.body.appendChild(alertModal);
      }
      
      // Guardar incidente
      try {
        showSpinner('Guardando incidente...');
        await window.nrd.shiftIncidents.create(incidentData);
        
        // Enviar notificación de incidente registrado
        if (typeof window.notifyIncidentRegistered === 'function') {
          try {
            // Obtener información del turno
            const shift = await window.nrd.shifts.getById(shiftId);
            await window.notifyIncidentRegistered(incidentData, shift);
          } catch (error) {
            // No interrumpir el flujo si falla la notificación
            logger.warn('Error al enviar notificación de incidente', error);
          }
        }
        
        hideSpinner();
        // No mostrar mensaje de éxito, solo cerrar el modal
        resolve(incidentData);
      } catch (error) {
        hideSpinner();
        logger.error('Error saving incident', error);
        await showError(error.message || 'Error al guardar incidente');
        resolve(null);
      }
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.selectIncidentType;
      delete window.selectIncidentBox;
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
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
