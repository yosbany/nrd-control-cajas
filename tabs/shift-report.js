// Generación de reporte 80mm

// Cajas fijas del sistema (namespace para evitar conflictos)
const REPORT_VIEW_BOXES = {
  'mostrador': 'Caja Mostrador',
  'banca-juegos': 'Caja Banca de Juegos',
  'otros': 'Otros'
};

// Turnos disponibles (namespace para evitar conflictos)
const REPORT_VIEW_SHIFTS = {
  'mañana': 'Turno Mañana',
  'tarde': 'Turno Tarde'
};

// Nombres de productos para reporte
const PRODUCT_NAMES = {
  'cafe-senior': 'Café Senior',
  'cigarros-grandes': 'Cigarros Grandes',
  'cigarros-chicos': 'Cigarros Chicos',
  'tabaco': 'Tabaco'
};

// Formatear fecha
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-CL', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Formatear monto para reporte
function formatAmountReport(amount) {
  if (amount === null || amount === undefined) return '$0';
  return `$${amount.toLocaleString('es-CL')}`;
}

// Calcular totales por caja
function calculateTotals(shift, movements) {
  const mostradorMovements = movements.filter(m => m.box === 'mostrador');
  const bancaMovements = movements.filter(m => m.box === 'banca-juegos');
  
  const mostradorIngresos = mostradorMovements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const mostradorEgresos = mostradorMovements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const bancaIngresos = bancaMovements
    .filter(m => m.type === 'ingreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const bancaEgresos = bancaMovements
    .filter(m => m.type === 'egreso')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  
  const mostradorFondo = shift.boxes?.mostrador?.initialFund || 0;
  const mostradorEfectivo = shift.boxes?.mostrador?.collectedCash || 0;
  const mostradorSaldo = mostradorFondo + mostradorEfectivo + mostradorIngresos - mostradorEgresos;
  
  const bancaFondo = shift.boxes?.['banca-juegos']?.initialFund || 0;
  const bancaEfectivo = shift.boxes?.['banca-juegos']?.collectedCash || 0;
  const bancaSaldo = bancaFondo + bancaEfectivo + bancaIngresos - bancaEgresos;
  
  return {
    mostrador: {
      fondo: mostradorFondo,
      efectivo: mostradorEfectivo,
      ingresos: mostradorIngresos,
      egresos: mostradorEgresos,
      saldo: mostradorSaldo
    },
    banca: {
      fondo: bancaFondo,
      efectivo: bancaEfectivo,
      ingresos: bancaIngresos,
      egresos: bancaEgresos,
      saldo: bancaSaldo
    }
  };
}

// Generar contenido del reporte 80mm
function generate80mmReport(shift, movements, incidents) {
  const totals = calculateTotals(shift, movements);
  const shiftLabel = REPORT_VIEW_SHIFTS[shift.shift] || shift.shift;
  const formattedDate = formatDate(shift.date);
  const closedDate = shift.closedAt ? new Date(shift.closedAt).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';
  
  let report = '';
  
  // Header - Asegurar que todas las líneas tengan el mismo ancho y estén alineadas
  const separatorLine = '═══════════════════════════════════';
  // Primera línea sin espacios ni saltos previos
  report = separatorLine + '\n';
  report += 'REPORTE DE TURNO\n';
  report += separatorLine + '\n';
  report += `Fecha: ${formattedDate}\n`;
  report += `Turno: ${shiftLabel}\n`;
  report += `Cajera: ${shift.cashierName || 'N/A'}\n`;
  report += `Cerrado: ${closedDate}\n`;
  report += separatorLine + '\n';
  report += '\n';
  
  // Conteo de Productos al Inicio del Turno
  const openingCounts = shift.productCounts?.opening || {};
  report += 'CONTEO DE PRODUCTOS - INICIO\n';
  report += '─────────────────────────────\n';
  report += `Café Senior:          ${(openingCounts['cafe-senior'] || 0).toString().padStart(10)}\n`;
  report += `Cigarros Grandes:     ${(openingCounts['cigarros-grandes'] || 0).toString().padStart(10)}\n`;
  report += `Cigarros Chicos:      ${(openingCounts['cigarros-chicos'] || 0).toString().padStart(10)}\n`;
  report += `Tabaco:               ${(openingCounts['tabaco'] || 0).toString().padStart(10)}\n`;
  report += '─────────────────────────────\n';
  report += '\n';
  
  // Caja Mostrador
  report += 'CAJA MOSTRADOR\n';
  report += '─────────────────────────────\n';
  report += `Fondo recibido:      ${formatAmountReport(totals.mostrador.fondo).padStart(15)}\n`;
  report += `Efectivo facturado:  ${formatAmountReport(totals.mostrador.efectivo).padStart(15)}\n`;
  report += `Ingresos:            ${formatAmountReport(totals.mostrador.ingresos).padStart(15)}\n`;
  report += `Egresos:             ${formatAmountReport(totals.mostrador.egresos).padStart(15)}\n`;
  report += '─────────────────────────────\n';
  report += `Saldo:               ${formatAmountReport(totals.mostrador.saldo).padStart(15)}\n`;
  report += '\n';
  
  // Caja Banca de Juegos
  report += 'CAJA BANCA DE JUEGOS\n';
  report += '─────────────────────────────\n';
  report += `Fondo recibido:      ${formatAmountReport(totals.banca.fondo).padStart(15)}\n`;
  report += `Efectivo facturado:  ${formatAmountReport(totals.banca.efectivo).padStart(15)}\n`;
  report += `Ingresos:            ${formatAmountReport(totals.banca.ingresos).padStart(15)}\n`;
  report += `Egresos:             ${formatAmountReport(totals.banca.egresos).padStart(15)}\n`;
  report += '─────────────────────────────\n';
  report += `Saldo:               ${formatAmountReport(totals.banca.saldo).padStart(15)}\n`;
  report += '\n';
  
  // Conteo de Productos al Final del Turno
  const closingCounts = shift.productCounts?.closing || {};
  report += 'CONTEO DE PRODUCTOS - FINAL\n';
  report += '─────────────────────────────\n';
  report += `Café Senior:          ${(closingCounts['cafe-senior'] || 0).toString().padStart(10)}\n`;
  report += `Cigarros Grandes:     ${(closingCounts['cigarros-grandes'] || 0).toString().padStart(10)}\n`;
  report += `Cigarros Chicos:      ${(closingCounts['cigarros-chicos'] || 0).toString().padStart(10)}\n`;
  report += `Tabaco:               ${(closingCounts['tabaco'] || 0).toString().padStart(10)}\n`;
  report += '─────────────────────────────\n';
  report += '\n';
  
  // Incidentes
  report += 'INCIDENTES\n';
  report += '─────────────────────────────\n';
  if (incidents && incidents.length > 0) {
    incidents.forEach((incident, index) => {
      report += `${index + 1}. ${incident.type || 'Sin tipo'}\n`;
      if (incident.box) {
        report += `   Caja: ${REPORT_VIEW_BOXES[incident.box] || incident.box}\n`;
      }
      if (incident.description) {
        const desc = incident.description.trim();
        if (desc) {
          report += `   Desc: ${desc.substring(0, 50)}${desc.length > 50 ? '...' : ''}\n`;
        }
      }
      report += '\n';
    });
  } else {
    report += 'Sin incidentes\n';
  }
  report += '\n';
  
  // Observaciones
  report += '═══════════════════════════════════\n';
  report += 'Observaciones:\n';
  const observations = shift.finalObservations || shift.observations || 'Sin observaciones';
  report += observations + '\n';
  report += '\n';
  report += `Firma: ${shift.cashierName || 'N/A'}\n`;
  report += '═══════════════════════════════════\n';
  
  return report;
}

// Imprimir reporte 80mm
async function print80mmReport(reportContent) {
  try {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=80mm,height=auto');
    
    if (!printWindow) {
      await showError('No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén permitidos.');
      return;
    }
    
    // Crear contenido HTML para impresión
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Turno</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10mm;
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              line-height: 1.2;
              font-weight: bold;
              text-align: left;
            }
          }
          body {
            margin: 0;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            line-height: 1.2;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-weight: bold;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <pre style="text-align: left; margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 10pt; line-height: 1.2; font-weight: bold; white-space: pre-wrap; word-wrap: break-word;">${reportContent}</pre>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que cargue y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Cerrar ventana después de un momento
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 250);
    };
    
  } catch (error) {
    logger.error('Error printing report', error);
    // Fallback: mostrar en alerta
    await showInfo('Reporte:\n\n' + reportContent);
  }
}

// Generar e imprimir reporte (función global)
window.generateAndPrintReport = async function(shiftId) {
  try {
    showSpinner('Generando reporte...');
    
    // Cargar datos
    const shift = await window.nrd.shifts.getById(shiftId);
    if (!shift) {
      hideSpinner();
      await showError('Turno no encontrado');
      return;
    }
    
    const movements = await window.nrd.shiftMovements.queryByShift(shiftId);
    const incidents = await window.nrd.shiftIncidents.queryByShift(shiftId);
    
    // Generar reporte
    const reportContent = generate80mmReport(shift, movements, incidents);
    
    hideSpinner();
    
    // Imprimir
    await print80mmReport(reportContent);
    
    logger.audit('REPORT_PRINTED', { shiftId, date: shift.date, shift: shift.shift });
    
  } catch (error) {
    hideSpinner();
    logger.error('Error generating report', error);
    await showError('Error al generar el reporte');
  }
};
