// Main app controller (ES Module)
// Using NRDCommon from CDN (loaded in index.html)
const logger = window.logger || console;

import { initializeShifts } from './views/shifts/shifts.js';
import { initializeShiftInit } from './views/shift-init/shift-init.js';
import { initializeShiftOperational } from './views/shift-operational/shift-operational.js';
import { initializeShiftDetail } from './views/shift-detail/shift-detail.js';

// Setup navigation buttons
function setupNavigationButtons() {
  const navContainer = document.getElementById('app-nav-container');
  if (!navContainer) {
    logger.warn('Navigation container not found');
    return;
  }
  
  navContainer.className = 'bg-white border-b border-gray-200 flex overflow-x-auto';
  
  navContainer.innerHTML = `
    <button class="nav-btn flex-1 px-3 sm:px-4 py-3 sm:py-3.5 border-b-2 border-red-600 text-red-600 bg-red-50 font-medium transition-colors uppercase tracking-wider text-xs sm:text-sm font-light" data-view="shifts">Turnos</button>
  `;
}

// Navigation service will be created when NRDCommon is available
let navigationService = null;

// Function to create and setup navigation service
function createNavigationService() {
  if (navigationService) {
    return navigationService; // Already created
  }
  
  const NavigationService = window.NRDCommon?.NavigationService;
  if (!NavigationService) {
    logger.warn('NavigationService not available in NRDCommon');
    return null;
  }
  
  // Pass views explicitly to NavigationService
  navigationService = new NavigationService(['shifts', 'shift-init', 'shift-operational', 'shift-detail']);
  window.navigationService = navigationService;
  
  // Register view handlers
  navigationService.registerView('shifts', () => {
    initializeShifts();
  });

  navigationService.registerView('shift-init', () => {
    initializeShiftInit();
  });

  navigationService.registerView('shift-operational', (param) => {
    initializeShiftOperational(param);
  });

  navigationService.registerView('shift-detail', (param) => {
    initializeShiftDetail(param);
  });
  
  logger.info('NavigationService created and views registered');
  return navigationService;
}

logger.info('app.js loaded');

function initializeAppForUser(user) {
  logger.info('Initializing app for user', { uid: user.uid, email: user.email });

  const navService = createNavigationService();
  if (!navService) {
    logger.error('Could not create NavigationService');
    return;
  }

  setupNavigationButtons();
  navService.setupNavButtons();
  navService.switchView('shifts');
}

(window.NRDCommon?.startApp || function(fn, opts) {
  window.__nrdStartQueue = window.__nrdStartQueue || [];
  window.__nrdStartQueue.push({ onReady: fn, options: opts || {} });
})(initializeAppForUser, { initDelay: 300 });
