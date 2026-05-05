// Custom Modal and Alert System

// Show confirmation modal
function showConfirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
      console.error('Modal elements not found');
      resolve(false);
      return;
    }

    // Limpiar cualquier listener previo clonando los botones
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Actualizar referencias
    const cleanConfirmBtn = document.getElementById('modal-confirm');
    const cleanCancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    messageEl.textContent = message;
    cleanConfirmBtn.textContent = confirmText;
    cleanCancelBtn.textContent = cancelText;

    // Restaurar clases por defecto de los botones
    cleanConfirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold min-h-[56px]';
    cleanCancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold min-h-[56px]';

    modal.classList.remove('hidden');

    const handleConfirm = () => {
      modal.classList.add('hidden');
      cleanConfirmBtn.removeEventListener('click', handleConfirm);
      cleanCancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      cleanConfirmBtn.removeEventListener('click', handleConfirm);
      cleanCancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve(false);
    };

    cleanConfirmBtn.addEventListener('click', handleConfirm);
    cleanCancelBtn.addEventListener('click', handleCancel);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Show confirmation modal with two options (returns 'option1', 'option2', or null)
function showConfirmWithOptions(title, message, option1Text, option2Text) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = option1Text;
    cancelBtn.textContent = option2Text;

    modal.classList.remove('hidden');

    const handleOption1 = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleOption1);
      cancelBtn.removeEventListener('click', handleOption2);
      resolve('option1');
    };

    const handleOption2 = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleOption1);
      cancelBtn.removeEventListener('click', handleOption2);
      resolve('option2');
    };

    confirmBtn.addEventListener('click', handleOption1);
    cancelBtn.addEventListener('click', handleOption2);

    // Close on background click - cancels
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleOption1);
        cancelBtn.removeEventListener('click', handleOption2);
        modal.removeEventListener('click', handleBackgroundClick);
        resolve(null);
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Show alert
function showAlert(title, message) {
  return new Promise((resolve) => {
    // Asegurar que los modales estén en el lugar correcto antes de mostrarlos
    // Esto es crítico cuando estamos en fullscreen
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    const alert = document.getElementById('custom-alert');
    
    // Si hay fullscreen activo, mover el modal DENTRO del elemento fullscreen
    // Esto es necesario para que aparezca por encima del contenido fullscreen
    if (alert && fullscreenElement) {
      // Mover al elemento fullscreen si no está ahí
      if (alert.parentElement !== fullscreenElement) {
        fullscreenElement.appendChild(alert);
      }
    } else if (alert) {
      // Si no hay fullscreen, asegurar que esté en el body
      if (alert.parentElement !== document.body) {
        document.body.appendChild(alert);
      }
    }
    
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const okBtn = document.getElementById('alert-ok');

    if (!alert || !titleEl || !messageEl || !okBtn) {
      logger.error('Alert modal elements not found', { 
        alert: !!alert, 
        titleEl: !!titleEl, 
        messageEl: !!messageEl, 
        okBtn: !!okBtn 
      });
      // Fallback: usar console.error si no hay modal disponible
      console.error(`${title}: ${message}`);
      resolve();
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    alert.classList.remove('hidden');
    
    // Asegurar que el modal aparezca por encima del fullscreen
    // Usar setTimeout para asegurar que el DOM esté actualizado
    setTimeout(() => {
      const currentFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (currentFullscreen && alert.parentElement !== currentFullscreen) {
        currentFullscreen.appendChild(alert);
      } else if (!currentFullscreen && alert.parentElement !== document.body) {
        document.body.appendChild(alert);
      }
      // También llamar a la función global si existe
      if (typeof window.moveModalsToFullscreen === 'function') {
        window.moveModalsToFullscreen();
      }
    }, 10);

    const handleOk = () => {
      alert.classList.add('hidden');
      okBtn.removeEventListener('click', handleOk);
      alert.removeEventListener('click', handleBackgroundClick);
      // Restaurar el modal al body después de cerrar
      if (alert.parentElement !== document.body) {
        document.body.appendChild(alert);
      }
      resolve();
    };

    okBtn.addEventListener('click', handleOk);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === alert) {
        handleOk();
      }
    };
    alert.addEventListener('click', handleBackgroundClick);
  });
}

// Show success alert
function showSuccess(message) {
  return showAlert('Éxito', message);
}

// Show error alert
function showError(message) {
  // showAlert ya maneja correctamente el fullscreen, solo llamarlo
  return showAlert('Error', message);
}

// Show info alert
function showInfo(message) {
  return showAlert('Información', message);
}

// Loading spinner functions
function showSpinner(message = 'Cargando...') {
  const spinner = document.getElementById('loading-spinner');
  if (!spinner) {
    logger.warn('Loading spinner element not found');
    return;
  }
  const messageEl = spinner.querySelector('p');
  if (messageEl) {
    messageEl.textContent = message;
  }
  spinner.classList.remove('hidden');
}

function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.add('hidden');
  }
}

// Modal de desglose de efectivo
async function showCashBreakdownModal(title, initialBreakdown = null, expectedAmount = null) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    titleEl.textContent = title;
    
    // Crear breakdown inicial si no existe
    const breakdown = initialBreakdown || window.cashBreakdownUtils?.createEmptyBreakdown() || {};
    
    // Crear contenido del modal
    const denominations = window.cashBreakdownUtils?.getDenominations() || [];
    
    // Separar billetes y monedas
    const bills = denominations.filter(d => d.type === 'bill');
    const coins = denominations.filter(d => d.type === 'coin');
    
    let html = '<div class="space-y-5 sm:space-y-6">';
    
    // Billetes
    if (bills.length > 0) {
      html += `
        <div>
          <h4 class="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 pb-2 border-b-2 border-gray-300">Billetes</h4>
          <div class="space-y-3 sm:space-y-4">
      `;
      
      bills.forEach(denom => {
        const value = breakdown[denom.key] || 0;
        html += `
          <div class="flex items-center justify-between">
            <label class="text-base sm:text-lg font-semibold text-gray-700 w-32 sm:w-40">${denom.label}:</label>
            <input type="number" 
              id="breakdown-${denom.key}" 
              value="${value}" 
              min="0" 
              step="1"
              class="flex-1 ml-4 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg font-semibold min-h-[56px]"
              onchange="updateBreakdownTotal()">
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    // Monedas
    if (coins.length > 0) {
      html += `
        <div>
          <h4 class="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 pb-2 border-b-2 border-gray-300">Monedas</h4>
          <div class="space-y-3 sm:space-y-4">
      `;
      
      coins.forEach(denom => {
        const value = breakdown[denom.key] || 0;
        html += `
          <div class="flex items-center justify-between">
            <label class="text-base sm:text-lg font-semibold text-gray-700 w-32 sm:w-40">${denom.label}:</label>
            <input type="number" 
              id="breakdown-${denom.key}" 
              value="${value}" 
              min="0" 
              step="1"
              class="flex-1 ml-4 px-4 py-4 border-2 border-gray-300 focus:outline-none focus:border-red-600 bg-white text-base sm:text-lg font-semibold min-h-[56px]"
              onchange="updateBreakdownTotal()">
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    // Total calculado
    html += `
      <div class="pt-4 sm:pt-5 border-t-2 border-gray-300">
        <div class="flex items-center justify-between py-2 sm:py-3">
          <span class="text-base sm:text-lg font-bold text-gray-900">Total:</span>
          <span id="breakdown-total" class="text-lg sm:text-xl font-bold text-red-600">$0</span>
        </div>
      </div>
    `;
    
    // Mostrar monto esperado si se proporciona
    if (expectedAmount !== null) {
      html += `
        <div class="pt-2 sm:pt-3">
          <div class="flex items-center justify-between py-2 sm:py-3">
            <span class="text-base sm:text-lg font-semibold text-gray-700">Monto esperado:</span>
            <span class="text-base sm:text-lg font-bold text-gray-900">$${expectedAmount.toLocaleString('es-CL')}</span>
          </div>
          <div id="breakdown-difference" class="text-sm sm:text-base mt-2 text-right font-semibold"></div>
        </div>
      `;
    }
    
    html += '</div>';
    
    messageEl.innerHTML = html;
    confirmBtn.textContent = 'Confirmar';
    cancelBtn.textContent = 'Cancelar';
    
    // Hacer botones más grandes para táctil
    confirmBtn.className = 'flex-1 px-6 py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold min-h-[56px]';
    cancelBtn.className = 'flex-1 px-6 py-4 border-2 border-gray-300 hover:border-red-600 hover:text-red-600 transition-colors uppercase tracking-wider text-base sm:text-lg font-semibold min-h-[56px]';

    modal.classList.remove('hidden');
    
    // Actualizar total inicial
    updateBreakdownTotal();
    
    // Función para actualizar total
    window.updateBreakdownTotal = function() {
      const breakdown = {};
      let total = 0;
      
      denominations.forEach(denom => {
        const input = document.getElementById(`breakdown-${denom.key}`);
        const count = parseInt(input.value) || 0;
        breakdown[denom.key] = count;
        total += denom.value * count;
      });
      
      breakdown.total = total;
      
      // Actualizar display
      const totalEl = document.getElementById('breakdown-total');
      if (totalEl) {
        totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
      }
      
      // Actualizar diferencia si hay monto esperado
      if (expectedAmount !== null) {
        const diffEl = document.getElementById('breakdown-difference');
        if (diffEl) {
          const difference = total - expectedAmount;
          if (Math.abs(difference) < 0.01) {
            diffEl.textContent = '✓ Coincide';
            diffEl.className = 'text-xs mt-1 text-right text-green-600';
          } else {
            diffEl.textContent = `Diferencia: $${difference.toLocaleString('es-CL')}`;
            diffEl.className = difference > 0 
              ? 'text-xs mt-1 text-right text-orange-600' 
              : 'text-xs mt-1 text-right text-red-600';
          }
        }
      }
      
      return breakdown;
    };

    const handleConfirm = async () => {
      const breakdown = window.updateBreakdownTotal();
      
      // Validar que el total sea mayor a 0
      if (breakdown.total <= 0) {
        await showError('El total debe ser mayor a cero');
        return;
      }
      
      // Validar que coincida con monto esperado si se proporciona
      if (expectedAmount !== null) {
        const difference = Math.abs(breakdown.total - expectedAmount);
        if (difference > 0.01) {
          // Guardar el estado actual del modal de desglose
          const savedMessageHTML = messageEl.innerHTML;
          const savedTitle = titleEl.textContent;
          const savedConfirmText = confirmBtn.textContent;
          const savedCancelText = cancelBtn.textContent;
          const savedConfirmClass = confirmBtn.className;
          const savedCancelClass = cancelBtn.className;
          
          // Remover listeners temporalmente
          confirmBtn.removeEventListener('click', handleConfirm);
          cancelBtn.removeEventListener('click', handleCancel);
          modal.removeEventListener('click', handleBackgroundClick);
          
          // Cerrar el modal de desglose
          modal.classList.add('hidden');
          
          // Esperar un momento para que el modal se cierre
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Mostrar el modal de confirmación
          const confirmed = await showConfirm(
            'Confirmar Desglose',
            `El total ($${breakdown.total.toLocaleString('es-CL')}) no coincide con el monto esperado ($${expectedAmount.toLocaleString('es-CL')}). ¿Desea continuar?`,
            'Sí, Continuar',
            'Cancelar'
          );
          
          if (!confirmed) {
            // Si no confirma, restaurar el modal de desglose completamente
            // Esperar un momento para que showConfirm termine completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            messageEl.innerHTML = savedMessageHTML;
            titleEl.textContent = savedTitle;
            confirmBtn.textContent = savedConfirmText;
            cancelBtn.textContent = savedCancelText;
            confirmBtn.className = savedConfirmClass;
            cancelBtn.className = savedCancelClass;
            
            // Restaurar listeners
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', handleBackgroundClick);
            
            // Restaurar función de actualización antes de mostrar
            window.updateBreakdownTotal = function() {
              const breakdown = {};
              let total = 0;
              
              denominations.forEach(denom => {
                const input = document.getElementById(`breakdown-${denom.key}`);
                const count = parseInt(input ? input.value : 0) || 0;
                breakdown[denom.key] = count;
                total += denom.value * count;
              });
              
              breakdown.total = total;
              
              // Actualizar display
              const totalEl = document.getElementById('breakdown-total');
              if (totalEl) {
                totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
              }
              
              // Actualizar diferencia si hay monto esperado
              if (expectedAmount !== null) {
                const diffEl = document.getElementById('breakdown-difference');
                if (diffEl) {
                  const difference = total - expectedAmount;
                  if (Math.abs(difference) < 0.01) {
                    diffEl.textContent = '✓ Coincide';
                    diffEl.className = 'text-sm sm:text-base mt-2 text-right font-semibold text-green-600';
                  } else {
                    diffEl.textContent = `Diferencia: $${difference.toLocaleString('es-CL')}`;
                    diffEl.className = difference > 0 
                      ? 'text-sm sm:text-base mt-2 text-right font-semibold text-orange-600' 
                      : 'text-sm sm:text-base mt-2 text-right font-semibold text-red-600';
                  }
                }
              }
              
              return breakdown;
            };
            
            // Mostrar el modal nuevamente
            modal.classList.remove('hidden');
            
            // Actualizar total después de restaurar
            setTimeout(() => {
              if (window.updateBreakdownTotal) {
                window.updateBreakdownTotal();
              }
            }, 50);
            
            return;
          }
          
          // Si confirma, continuar con el cierre después de un breve delay
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Limpiar listeners antes de cerrar
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.updateBreakdownTotal;
      
      // Resolver inmediatamente
      resolve(breakdown);
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      messageEl.innerHTML = '';
      delete window.updateBreakdownTotal;
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
