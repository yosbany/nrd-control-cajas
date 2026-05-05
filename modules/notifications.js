// Utilidades para registro de notificaciones (Firebase /notifications)

/**
 * Crea un registro de notificación; el envío push automático no está en uso.
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @returns {Promise<string|null>} ID de la notificación creada o null si falla
 */
async function sendNotification(title, message) {
  try {
    const nrd = window.nrd;
    const logger = window.logger;
    
    if (!nrd) {
      if (logger) logger.error('NRD Data Access not initialized');
      console.error('NRD Data Access not initialized');
      throw new Error('NRD Data Access no está inicializado');
    }
    
    if (!nrd.notifications) {
      if (logger) {
        logger.error('NotificationsService not available', {
          nrdAvailable: !!nrd,
          nrdKeys: nrd ? Object.keys(nrd) : []
        });
      }
      throw new Error('Servicio de notificaciones no disponible. Por favor, asegúrate de usar la última versión de nrd-data-access (@main)');
    }
    
    const notification = {
      title: title,
      message: message,
      sent: false,
      createdAt: Date.now()
    };
    
    const notificationId = await nrd.notifications.create(notification);
    if (logger) logger.info('Notificación creada', { notificationId, title, message });
    console.log('Notificación creada', { notificationId, title, message });
    return notificationId;
  } catch (error) {
    const logger = window.logger;
    if (logger) logger.error('Error al crear notificación', error);
    console.error('Error al crear notificación', error);
    return null;
  }
}

/**
 * Notificación de inicio de turno
 * @param {Object} shift - Datos del turno iniciado
 * @returns {Promise<string|null>} ID o null
 */
async function notifyShiftStarted(shift) {
  const shiftName = shift.shift === 'mañana' ? 'Turno Mañana' : 'Turno Tarde';
  const date = new Date(shift.date).toLocaleDateString('es-UY');
  const title = 'Turno Iniciado';
  const message = `${shiftName} iniciado por ${shift.cashierName || 'Cajero'} - ${date}`;
  return await sendNotification(title, message);
}

/**
 * Notificación de cierre de turno
 * @param {Object} shift - Datos del turno cerrado
 * @returns {Promise<string|null>} ID o null
 */
async function notifyShiftClosed(shift) {
  const shiftName = shift.shift === 'mañana' ? 'Turno Mañana' : 'Turno Tarde';
  const date = new Date(shift.date).toLocaleDateString('es-UY');
  const title = 'Turno Cerrado';
  let totalCash = 0;
  if (shift.boxes) {
    if (shift.boxes.mostrador?.collectedCash) {
      totalCash += shift.boxes.mostrador.collectedCash;
    }
    if (shift.boxes['banca-juegos']?.collectedCash) {
      totalCash += shift.boxes['banca-juegos'].collectedCash;
    }
  }
  const cashInfo = totalCash > 0 ? ` - Recaudado: $${totalCash.toLocaleString('es-UY')}` : '';
  const message = `${shiftName} cerrado por ${shift.cashierName || 'Cajero'} - ${date}${cashInfo}`;
  return await sendNotification(title, message);
}

/**
 * Notificación de incidente
 * @param {Object} incident
 * @param {Object} shift
 * @returns {Promise<string|null>} ID o null
 */
async function notifyIncidentRegistered(incident, shift) {
  const shiftName = shift?.shift === 'mañana' ? 'Turno Mañana' : shift?.shift === 'tarde' ? 'Turno Tarde' : 'Turno';
  const date = shift?.date ? new Date(shift.date).toLocaleDateString('es-UY') : '';
  const title = 'Incidente Registrado';
  const boxLabel = incident.box === 'mostrador' ? 'Mostrador' : 
    incident.box === 'banca-juegos' ? 'Banca de Juegos' : 'Otros';
  const incidentType = incident.customType || incident.type || 'Incidente';
  const amountInfo = incident.amount ? ` - Monto: $${incident.amount.toLocaleString('es-UY')}` : '';
  const message = `${incidentType} en ${boxLabel} - ${shiftName}${date ? ` - ${date}` : ''}${amountInfo}`;
  return await sendNotification(title, message);
}

window.sendNotification = sendNotification;
window.notifyShiftStarted = notifyShiftStarted;
window.notifyShiftClosed = notifyShiftClosed;
window.notifyIncidentRegistered = notifyIncidentRegistered;
