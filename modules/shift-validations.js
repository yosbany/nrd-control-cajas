// Validaciones de turnos

// Validar monto positivo
function validatePositiveAmount(amount) {
  if (amount === null || amount === undefined) {
    return { valid: false, message: 'El monto es requerido' };
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { valid: false, message: 'El monto debe ser un número válido' };
  }
  
  if (numAmount < 0) {
    return { valid: false, message: 'El monto no puede ser negativo' };
  }
  
  return { valid: true };
}

// Validar que turno puede cerrarse
function canCloseShift(shift) {
  const errors = [];
  
  if (!shift) {
    return { canClose: false, errors: ['El turno no existe'] };
  }
  
  // Validar que fondo de ambas cajas esté presente
  if (!shift.boxes || !shift.boxes.mostrador || !shift.boxes.mostrador.initialFund) {
    errors.push('Falta el fondo de Caja Mostrador');
  }
  
  if (!shift.boxes || !shift.boxes['banca-juegos'] || !shift.boxes['banca-juegos'].initialFund) {
    errors.push('Falta el fondo de Caja Banca de Juegos');
  }
  
  // Validar que los fondos sean positivos
  if (shift.boxes?.mostrador?.initialFund !== undefined) {
    const validation = validatePositiveAmount(shift.boxes.mostrador.initialFund);
    if (!validation.valid) {
      errors.push(`Caja Mostrador: ${validation.message}`);
    }
  }
  
  if (shift.boxes?.['banca-juegos']?.initialFund !== undefined) {
    const validation = validatePositiveAmount(shift.boxes['banca-juegos'].initialFund);
    if (!validation.valid) {
      errors.push(`Caja Banca de Juegos: ${validation.message}`);
    }
  }
  
  // Validar que efectivo facturado esté presente (se registra al cerrar)
  // Esta validación se hace en el modal de cierre
  
  return {
    canClose: errors.length === 0,
    errors
  };
}

// Validar datos de inicio de turno
function validateInitShiftData(shiftData) {
  const errors = [];
  
  if (!shiftData.date) {
    errors.push('La fecha es requerida');
  }
  
  if (!shiftData.shift || !['mañana', 'tarde'].includes(shiftData.shift)) {
    errors.push('El turno es requerido y debe ser "mañana" o "tarde"');
  }
  
  if (!shiftData.cashierName || shiftData.cashierName.trim() === '') {
    errors.push('El nombre de la cajera es requerido');
  }
  
  if (!shiftData.boxes) {
    errors.push('Los datos de las cajas son requeridos');
  } else {
    if (!shiftData.boxes.mostrador || !shiftData.boxes.mostrador.initialFund) {
      errors.push('El fondo de Caja Mostrador es requerido');
    } else {
      const validation = validatePositiveAmount(shiftData.boxes.mostrador.initialFund);
      if (!validation.valid) {
        errors.push(`Caja Mostrador: ${validation.message}`);
      }
    }
    
    if (!shiftData.boxes['banca-juegos'] || !shiftData.boxes['banca-juegos'].initialFund) {
      errors.push('El fondo de Caja Banca de Juegos es requerido');
    } else {
      const validation = validatePositiveAmount(shiftData.boxes['banca-juegos'].initialFund);
      if (!validation.valid) {
        errors.push(`Caja Banca de Juegos: ${validation.message}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validar datos de cierre de turno
function validateCloseShiftData(shift, collectedCashData) {
  const errors = [];
  
  if (!collectedCashData) {
    errors.push('Los datos de efectivo facturado son requeridos');
    return { valid: false, errors };
  }
  
  // Validar efectivo facturado de Caja Mostrador
  if (collectedCashData.mostrador === undefined || collectedCashData.mostrador === null) {
    errors.push('El efectivo facturado de Caja Mostrador es requerido');
  } else {
    const validation = validatePositiveAmount(collectedCashData.mostrador);
    if (!validation.valid) {
      errors.push(`Caja Mostrador: ${validation.message}`);
    }
  }
  
  // Validar efectivo facturado de Caja Banca de Juegos
  if (collectedCashData['banca-juegos'] === undefined || collectedCashData['banca-juegos'] === null) {
    errors.push('El efectivo facturado de Caja Banca de Juegos es requerido');
  } else {
    const validation = validatePositiveAmount(collectedCashData['banca-juegos']);
    if (!validation.valid) {
      errors.push(`Caja Banca de Juegos: ${validation.message}`);
    }
  }
  
  // Validar que el turno no esté ya cerrado
  if (shift && shift.closed) {
    errors.push('El turno ya está cerrado');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validar movimiento
function validateMovement(movement) {
  const errors = [];
  
  if (!movement.shiftId) {
    errors.push('El ID del turno es requerido');
  }
  
  if (!movement.box || !['mostrador', 'banca-juegos'].includes(movement.box)) {
    errors.push('La caja es requerida y debe ser "mostrador" o "banca-juegos"');
  }
  
  if (!movement.type || !['ingreso', 'egreso'].includes(movement.type)) {
    errors.push('El tipo de movimiento es requerido y debe ser "ingreso" o "egreso"');
  }
  
  const amountValidation = validatePositiveAmount(movement.amount);
  if (!amountValidation.valid) {
    errors.push(amountValidation.message);
  }
  
  if (!movement.reason || movement.reason.trim() === '') {
    errors.push('El motivo es requerido');
  }
  
  // Validar breakdown si existe
  if (movement.breakdown) {
    const breakdownValidation = window.cashBreakdownUtils?.validateBreakdown(
      movement.breakdown,
      movement.amount
    );
    if (breakdownValidation !== undefined && !breakdownValidation) {
      errors.push('El desglose no coincide con el monto');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validar incidente
function validateIncident(incident) {
  const errors = [];
  
  if (!incident.shiftId) {
    errors.push('El ID del turno es requerido');
  }
  
  if (!incident.type || incident.type.trim() === '') {
    errors.push('El tipo de incidente es requerido');
  }
  
  if (!incident.box || !['mostrador', 'banca-juegos', 'otros'].includes(incident.box)) {
    errors.push('La caja afectada es requerida');
  }
  
  if (!incident.description || incident.description.trim() === '') {
    errors.push('La descripción es requerida');
  }
  
  // Validar monto si está presente
  if (incident.amount !== undefined && incident.amount !== null) {
    const amountValidation = validatePositiveAmount(incident.amount);
    if (!amountValidation.valid) {
      errors.push(amountValidation.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Exportar funciones
window.shiftValidations = {
  validatePositiveAmount,
  canCloseShift,
  validateInitShiftData,
  validateCloseShiftData,
  validateMovement,
  validateIncident
};
