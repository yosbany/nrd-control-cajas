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

// Initialize app using NRD Data Access
// Note: AuthService handles showing/hiding app-screen, we just setup navigation
logger.info('app.js loaded, waiting for NRD to be available');

// Wait for window.nrd and NRDCommon to be available (they're initialized in index.html)
function waitForNRDAndInitialize() {
  const maxWait = 10000; // 10 seconds
  const startTime = Date.now();
  const checkInterval = 100; // Check every 100ms
  
  const checkNRD = setInterval(() => {
    const nrd = window.nrd;
    const NRDCommon = window.NRDCommon;
    
    if (nrd && nrd.auth && NRDCommon) {
      clearInterval(checkNRD);
      logger.info('NRD, auth, and NRDCommon available, setting up onAuthStateChanged');
      
      // Create navigation service now that NRDCommon is available
      createNavigationService();
      
      // Also listen to the current auth state immediately
      const currentUser = nrd.auth.getCurrentUser();
      if (currentUser) {
        logger.info('Current user found, initializing immediately', { uid: currentUser.uid, email: currentUser.email });
        initializeAppForUser(currentUser);
      }
      
      nrd.auth.onAuthStateChanged((user) => {
        logger.info('Auth state changed', { hasUser: !!user, uid: user?.uid, email: user?.email });
        if (user) {
          initializeAppForUser(user);
        } else {
          logger.debug('User not authenticated, app initialization skipped');
        }
      });
    } else if (Date.now() - startTime >= maxWait) {
      clearInterval(checkNRD);
      logger.error('NRD, auth, or NRDCommon not available after timeout', { 
        hasNrd: !!nrd, 
        hasAuth: !!(nrd && nrd.auth),
        hasNRDCommon: !!NRDCommon
      });
    }
  }, checkInterval);
}

// Start waiting for NRD and NRDCommon
waitForNRDAndInitialize();

function initializeAppForUser(user) {
  logger.info('Initializing app for user', { uid: user.uid, email: user.email });
  
  // Ensure app-screen is visible (AuthService should have done this, but double-check)
  const appScreen = document.getElementById('app-screen');
  const loginScreen = document.getElementById('login-screen');
  const redirectingScreen = document.getElementById('redirecting-screen');
  
  if (appScreen) {
    appScreen.classList.remove('hidden');
    logger.info('App screen shown');
  }
  if (loginScreen) {
    loginScreen.classList.add('hidden');
  }
  if (redirectingScreen) {
    redirectingScreen.classList.add('hidden');
  }
  
  // Wait a bit for DOM to be ready, then setup navigation
  setTimeout(() => {
    // Create navigation service if not already created
    const navService = createNavigationService();
    if (!navService) {
      logger.error('Could not create NavigationService');
      return;
    }
    
    logger.info('Setting up navigation and switching to shifts');
    setupNavigationButtons();
    navService.setupNavButtons();
    navService.switchView('shifts');
    
    // Double-check that app-screen is visible
    const appScreenCheck = document.getElementById('app-screen');
    if (appScreenCheck && appScreenCheck.classList.contains('hidden')) {
      logger.warn('App screen was hidden, showing it now');
      appScreenCheck.classList.remove('hidden');
    }
    
    // Also check that shifts view is visible
    const shiftsView = document.getElementById('shifts-view');
    if (shiftsView) {
      if (shiftsView.classList.contains('hidden')) {
        logger.warn('Shifts view was hidden, showing it now');
        shiftsView.classList.remove('hidden');
      } else {
        logger.info('Shifts view is visible');
      }
    } else {
      logger.error('Shifts view element not found');
    }
  }, 300);
}

// AuthService is now initialized in index.html after NRDCommon loads
// This ensures it handles the redirecting screen immediately
// We don't need to initialize it here since it's already done in index.html
