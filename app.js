// Main app controller

// Get nrd instance safely (always use window.nrd as it's set globally in index.html)
// Initialize safely - wait for window.nrd to be available
var nrd = window.nrd || (typeof NRDDataAccess !== 'undefined' ? new NRDDataAccess() : null);

// Ensure nrd is available before using it
function ensureNrd() {
  if (!window.nrd) {
    logger.warn('window.nrd not available yet, retrying...');
    setTimeout(() => {
      if (window.nrd) {
        nrd = window.nrd;
      }
    }, 100);
  }
}
ensureNrd();

// Navigation
let currentView = null;
let currentViewParam = null; // Para pasar parámetros a las vistas (ej: shiftId)

function switchView(viewName, param = null) {
  // Prevent duplicate loading
  if (currentView === viewName && currentViewParam === param) {
    logger.debug('View already active, skipping', { viewName, param });
    return;
  }
  
  logger.info('Switching view', { from: currentView, to: viewName, param });
  currentView = viewName;
  currentViewParam = param;

  // Hide all views
  const views = ['shifts', 'shift-init', 'shift-operational', 'shift-detail'];
  views.forEach(view => {
    const viewElement = document.getElementById(`${view}-view`);
    if (viewElement) {
      viewElement.classList.add('hidden');
    }
  });

  // Show selected view
  const selectedView = document.getElementById(`${viewName}-view`);
  if (selectedView) {
    selectedView.classList.remove('hidden');
    logger.debug('View shown', { viewName });
  } else {
    logger.warn('View element not found', { viewName });
  }

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
    btn.classList.add('border-transparent', 'text-gray-600');
  });
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-600');
    activeBtn.classList.add('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
  } else {
    logger.warn('Active nav button not found', { viewName });
  }

  // Load data for the view
  logger.debug('Loading view data', { viewName, param });
  
  if (viewName === 'shifts') {
    if (typeof initializeShifts === 'function') {
      initializeShifts();
    }
  } else if (viewName === 'shift-init') {
    if (typeof initializeShiftInit === 'function') {
      initializeShiftInit();
    }
  } else if (viewName === 'shift-operational') {
    logger.debug('Checking for initializeShiftOperational function', { 
      exists: typeof initializeShiftOperational !== 'undefined',
      isFunction: typeof initializeShiftOperational === 'function'
    });
    if (typeof initializeShiftOperational === 'function') {
      logger.debug('Calling initializeShiftOperational', { param });
      initializeShiftOperational(param);
    } else {
      logger.warn('initializeShiftOperational is not a function', { 
        type: typeof initializeShiftOperational 
      });
    }
  } else if (viewName === 'shift-detail') {
    if (typeof initializeShiftDetail === 'function') {
      initializeShiftDetail(param);
    }
  }
  
  logger.debug('View switched successfully', { viewName });
}

// Nav button handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    logger.debug('Nav button clicked', { view });
    switchView(view);
  });
});
logger.debug('Nav button handlers attached');

// Note: View switching is now handled by auth.js when showing app screen
// This file only defines the switchView function and navigation handlers
