// Utilidades para desglose de efectivo (billetes y monedas)

// Denominaciones de billetes y monedas (CLP)
const DENOMINATIONS = [
  // Billetes
  { value: 2000, label: '$2.000', type: 'bill', key: '2000' },
  { value: 1000, label: '$1.000', type: 'bill', key: '1000' },
  { value: 500, label: '$500', type: 'bill', key: '500' },
  { value: 200, label: '$200', type: 'bill', key: '200' },
  { value: 100, label: '$100', type: 'bill', key: '100' },
  { value: 50, label: '$50', type: 'bill', key: '50' },
  { value: 20, label: '$20', type: 'bill', key: '20' },
  // Monedas
  { value: 50, label: '$50', type: 'coin', key: 'coin_50' },
  { value: 10, label: '$10', type: 'coin', key: 'coin_10' },
  { value: 5, label: '$5', type: 'coin', key: 'coin_5' },
  { value: 2, label: '$2', type: 'coin', key: 'coin_2' },
  { value: 1, label: '$1', type: 'coin', key: 'coin_1' }
];

// Crear breakdown vacío
function createEmptyBreakdown() {
  const breakdown = {
    total: 0
  };
  DENOMINATIONS.forEach(denom => {
    breakdown[denom.key] = 0;
  });
  return breakdown;
}

// Calcular total desde breakdown
function calculateTotal(breakdown) {
  if (!breakdown) return 0;
  
  let total = 0;
  DENOMINATIONS.forEach(denom => {
    const count = breakdown[denom.key] || 0;
    total += denom.value * count;
  });
  
  return total;
}

// Validar que total coincida con monto
function validateBreakdown(breakdown, amount) {
  if (!breakdown) return false;
  
  const calculatedTotal = calculateTotal(breakdown);
  const tolerance = 0.01; // Tolerancia para errores de redondeo
  
  return Math.abs(calculatedTotal - amount) < tolerance;
}

// Actualizar total en breakdown
function updateBreakdownTotal(breakdown) {
  if (!breakdown) return breakdown;
  
  breakdown.total = calculateTotal(breakdown);
  return breakdown;
}

// Formatear breakdown para mostrar
function formatBreakdown(breakdown) {
  if (!breakdown) return '';
  
  const parts = [];
  DENOMINATIONS.forEach(denom => {
    const count = breakdown[denom.key] || 0;
    if (count > 0) {
      parts.push(`${denom.label}: ${count}`);
    }
  });
  
  return parts.length > 0 ? parts.join(', ') : 'Sin desglose';
}

// Obtener denominaciones
function getDenominations() {
  return DENOMINATIONS;
}

// Exportar funciones
window.cashBreakdownUtils = {
  createEmptyBreakdown,
  calculateTotal,
  validateBreakdown,
  updateBreakdownTotal,
  formatBreakdown,
  getDenominations,
  DENOMINATIONS
};
