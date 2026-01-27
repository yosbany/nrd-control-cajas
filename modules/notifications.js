// Utilidades para envío de notificaciones

/**
 * Obtiene el token de GitHub desde Firebase
 * @returns {Promise<string>} Token de GitHub
 */
async function getGitHubToken() {
  try {
    const nrd = window.nrd;
    const logger = window.logger;
    
    if (!nrd) {
      if (logger) logger.error('NRD Data Access not initialized');
      throw new Error('NRD Data Access no está inicializado');
    }
    
    if (!nrd.config) {
      if (logger) logger.error('ConfigService not available');
      throw new Error('Servicio de configuración no disponible. Por favor, asegúrate de usar la última versión de nrd-data-access.');
    }
    
    // Obtener token desde Firebase usando el servicio Config
    const token = await nrd.config.get('githubToken');
    
    if (!token || typeof token !== 'string') {
      if (logger) logger.warn('GitHub token not configured in Firebase');
      throw new Error('Token de GitHub no configurado en Firebase');
    }
    
    return token;
  } catch (error) {
    const logger = window.logger;
    if (logger) logger.error('Error al obtener token de GitHub desde Firebase', error);
    throw error;
  }
}

/**
 * Ejecuta el workflow de GitHub Actions para procesar notificaciones pendientes
 * @returns {Promise<Object>} Resultado de la ejecución
 */
async function triggerGitHubWorkflow() {
  const GITHUB_OWNER = 'yosbany';
  const GITHUB_REPO = 'nrd-notificacion';
  const WORKFLOW_FILE = 'process-notifications.yml';
  const logger = window.logger;
  
  // Obtener token desde Firebase
  let GITHUB_TOKEN;
  try {
    GITHUB_TOKEN = await getGitHubToken();
  } catch (error) {
    if (logger) logger.warn('Token de GitHub no disponible, workflow no se ejecutará manualmente', error);
    throw new Error('Token de GitHub no configurado en Firebase. No se puede ejecutar el workflow al momento. La notificación se enviará en los próximos 5 minutos.');
  }
  
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  
  try {
    if (logger) logger.debug('Ejecutando workflow de GitHub Actions', { url });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }
    
    // GitHub API returns 204 No Content for successful workflow_dispatch
    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      // Success with no content (204 No Content)
      if (logger) logger.info('Workflow de GitHub Actions ejecutado exitosamente');
      return { success: true, message: 'Workflow triggered successfully' };
    }
    
    // Try to parse JSON only if there's content
    const text = await response.text();
    if (!text || text.trim() === '') {
      if (logger) logger.info('Workflow de GitHub Actions ejecutado exitosamente');
      return { success: true, message: 'Workflow triggered successfully' };
    }
    
    try {
      const result = await JSON.parse(text);
      if (logger) logger.info('Workflow de GitHub Actions ejecutado exitosamente', result);
      return result;
    } catch (e) {
      // If JSON parsing fails but status is OK, consider it success
      if (logger) logger.warn('No se pudo parsear la respuesta de GitHub API como JSON, pero el status es OK', { text, status: response.status });
      return { success: true, message: 'Workflow triggered successfully' };
    }
  } catch (error) {
    if (logger) logger.error('Error al ejecutar workflow de GitHub Actions', error);
    throw error;
  }
}

/**
 * Envía una notificación push a todos los dispositivos registrados
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @returns {Promise<string>} ID de la notificación creada
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
          nrdKeys: nrd ? Object.keys(nrd) : [],
          nrdVersion: nrd?.version || 'unknown'
        });
      }
      console.error('NotificationsService not available', {
        nrdAvailable: !!nrd,
        nrdKeys: nrd ? Object.keys(nrd) : []
      });
      
      // Intentar verificar si el servicio existe en la versión anterior
      if (nrd && typeof nrd.config !== 'undefined' && typeof nrd.config.get === 'function') {
        console.warn('Config service disponible, pero NotificationsService no. Por favor, asegúrate de usar la última versión de nrd-data-access (@main)');
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
    if (logger) logger.info('Notificación creada exitosamente', { notificationId, title, message });
    console.log('Notificación creada exitosamente', { notificationId, title, message });
    
    // Ejecutar workflow de GitHub Actions para procesar inmediatamente
    try {
      await triggerGitHubWorkflow();
      if (logger) logger.info('Workflow de GitHub Actions ejecutado exitosamente para notificación', { notificationId });
    } catch (workflowError) {
      // Si falla el workflow, la notificación se procesará automáticamente en los próximos 5 minutos
      if (logger) logger.warn('No se pudo ejecutar el workflow, la notificación se procesará automáticamente en los próximos 5 minutos', workflowError);
      console.warn('No se pudo ejecutar el workflow, la notificación se procesará automáticamente en los próximos 5 minutos', workflowError);
    }
    
    return notificationId;
  } catch (error) {
    const logger = window.logger;
    if (logger) logger.error('Error al crear notificación', error);
    console.error('Error al crear notificación', error);
    // No lanzar el error para no interrumpir el flujo principal
    // Solo loguear el error
    return null;
  }
}

/**
 * Envía notificación de inicio de turno
 * @param {Object} shift - Datos del turno iniciado
 * @returns {Promise<string>} ID de la notificación creada
 */
async function notifyShiftStarted(shift) {
  const shiftName = shift.shift === 'mañana' ? 'Turno Mañana' : 'Turno Tarde';
  const date = new Date(shift.date).toLocaleDateString('es-UY');
  const title = 'Turno Iniciado';
  const message = `${shiftName} iniciado por ${shift.cashierName || 'Cajero'} - ${date}`;
  
  return await sendNotification(title, message);
}

/**
 * Envía notificación de cierre de turno
 * @param {Object} shift - Datos del turno cerrado
 * @returns {Promise<string>} ID de la notificación creada
 */
async function notifyShiftClosed(shift) {
  const shiftName = shift.shift === 'mañana' ? 'Turno Mañana' : 'Turno Tarde';
  const date = new Date(shift.date).toLocaleDateString('es-UY');
  const title = 'Turno Cerrado';
  
  // Calcular total recaudado si está disponible
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
 * Envía notificación de incidente registrado
 * @param {Object} incident - Datos del incidente
 * @param {Object} shift - Datos del turno relacionado
 * @returns {Promise<string>} ID de la notificación creada
 */
async function notifyIncidentRegistered(incident, shift) {
  const shiftName = shift?.shift === 'mañana' ? 'Turno Mañana' : shift?.shift === 'tarde' ? 'Turno Tarde' : 'Turno';
  const date = shift?.date ? new Date(shift.date).toLocaleDateString('es-UY') : '';
  const title = 'Incidente Registrado';
  
  const boxLabel = incident.box === 'mostrador' ? 'Mostrador' : 
                   incident.box === 'banca-juegos' ? 'Banca de Juegos' : 
                   'Otros';
  
  const incidentType = incident.customType || incident.type || 'Incidente';
  const amountInfo = incident.amount ? ` - Monto: $${incident.amount.toLocaleString('es-UY')}` : '';
  const message = `${incidentType} en ${boxLabel} - ${shiftName}${date ? ` - ${date}` : ''}${amountInfo}`;
  
  return await sendNotification(title, message);
}

// Exportar funciones globalmente
window.sendNotification = sendNotification;
window.notifyShiftStarted = notifyShiftStarted;
window.notifyShiftClosed = notifyShiftClosed;
window.notifyIncidentRegistered = notifyIncidentRegistered;
window.getGitHubToken = getGitHubToken;
window.triggerGitHubWorkflow = triggerGitHubWorkflow;
