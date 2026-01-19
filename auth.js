// Authentication state management
let currentUser = null;

// Initialize auth when DOM and nrd are ready
function initializeAuth() {
  // Get nrd instance safely (use window.nrd directly as it's set globally in index.html)
  const nrd = window.nrd;
  
  if (!nrd || !nrd.auth) {
    logger.warn('NRD Data Access not initialized, retrying...');
    // Retry after a short delay (max 10 attempts)
    if (typeof initializeAuth.attempts === 'undefined') {
      initializeAuth.attempts = 0;
    }
    initializeAuth.attempts++;
    const maxAttempts = 10;
    
    if (initializeAuth.attempts >= maxAttempts) {
      logger.error('NRD Data Access initialization failed after multiple attempts. Showing login screen.');
      // Fallback: show login screen if nrd never becomes available
      showLoginScreen();
      return;
    }
    
    // Retry after a short delay
    setTimeout(initializeAuth, 200);
    return;
  }
  
  // Reset attempts counter on success
  if (typeof initializeAuth.attempts !== 'undefined') {
    delete initializeAuth.attempts;
  }
  
  // Listen for auth state changes using NRD Data Access
  nrd.auth.onAuthStateChanged((user) => {
    try {
      currentUser = user;
      if (user) {
        logger.info('User authenticated, showing app screen', { uid: user.uid, email: user.email });
        showAppScreen();
      } else {
        logger.info('User not authenticated, showing login screen');
        showLoginScreen();
      }
    } catch (error) {
      logger.error('Error in auth state change', error);
      // Fallback: show login screen
      const loginScreen = document.getElementById('login-screen');
      const appScreen = document.getElementById('app-screen');
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (appScreen) appScreen.classList.add('hidden');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  // DOM already loaded, try immediately
  setTimeout(initializeAuth, 0);
}

// Show login screen
function showLoginScreen() {
  logger.debug('Showing login screen');
  try {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  } catch (error) {
    logger.error('Error showing login screen', error);
  }
}

// Show app screen
function showAppScreen() {
  logger.debug('Showing app screen');
  try {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    
    // Initialize default view after showing app screen
    setTimeout(() => {
      if (typeof switchView === 'function') {
        logger.debug('Switching to default view: shifts');
        switchView('shifts');
      }
    }, 100);
  } catch (error) {
    logger.error('Error showing app screen', error);
  }
}

// Login form handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('login-email')?.value;
      const password = document.getElementById('login-password')?.value;
      const errorDiv = document.getElementById('login-error');

      if (!email || !password) {
        logger.warn('Login attempt with empty fields');
        if (errorDiv) errorDiv.textContent = 'Por favor complete todos los campos';
        return;
      }

      logger.info('Attempting user login', { email });
      if (errorDiv) errorDiv.textContent = '';
      
      const nrd = window.nrd;
      if (!nrd || !nrd.auth) {
        throw new Error('NRD Data Access no está inicializado');
      }
      
      showSpinner('Iniciando sesión...');

      const userCredential = await nrd.auth.signIn(email, password);
      const user = userCredential.user;
      logger.audit('USER_LOGIN', { email, uid: user.uid, timestamp: Date.now() });
      logger.info('User login successful', { uid: user.uid, email });
      hideSpinner();
    } catch (error) {
      hideSpinner();
      logger.error('Login failed', error);
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.textContent = error.message || 'Error al iniciar sesión';
      }
    }
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show profile modal
function showProfileModal() {
  logger.debug('Showing profile modal');
  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-modal-content');
  
  if (!modal || !content) {
    logger.warn('Profile modal elements not found');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    logger.warn('No user found when showing profile modal');
    return;
  }
  
  logger.debug('Displaying user profile data', { uid: user.uid, email: user.email });
  
  // Display user data
  let userDataHtml = `
    <div class="space-y-3 sm:space-y-4">
      <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
        <span class="text-gray-600 font-light text-sm sm:text-base">Email:</span>
        <span class="font-light text-sm sm:text-base">${escapeHtml(user.email || 'N/A')}</span>
      </div>
      ${user.displayName ? `
      <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
        <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
        <span class="font-light text-sm sm:text-base">${escapeHtml(user.displayName)}</span>
      </div>
      ` : ''}
    </div>
  `;
  
  content.innerHTML = userDataHtml;
  modal.classList.remove('hidden');
  logger.debug('Profile modal shown');
}

// Close profile modal
function closeProfileModal() {
  logger.debug('Closing profile modal');
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.add('hidden');
    logger.debug('Profile modal closed');
  }
}

// Profile button handler
const profileBtn = document.getElementById('profile-btn');
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    showProfileModal();
  });
}

// Close profile modal button
const closeProfileModalBtn = document.getElementById('close-profile-modal');
if (closeProfileModalBtn) {
  closeProfileModalBtn.addEventListener('click', () => {
    closeProfileModal();
  });
}

// Logout handler (from profile modal)
const profileLogoutBtn = document.getElementById('profile-logout-btn');
if (profileLogoutBtn) {
  profileLogoutBtn.addEventListener('click', async () => {
    try {
      const user = getCurrentUser();
      logger.info('Attempting user logout', { uid: user?.uid, email: user?.email });
      
      const nrd = window.nrd;
      if (!nrd || !nrd.auth) {
        throw new Error('NRD Data Access no está inicializado');
      }
      
      closeProfileModal();
      showSpinner('Cerrando sesión...');
      await nrd.auth.signOut();
      logger.audit('USER_LOGOUT', { uid: user?.uid, email: user?.email, timestamp: Date.now() });
      logger.info('User logout successful');
      hideSpinner();
    } catch (error) {
      hideSpinner();
      logger.error('Logout failed', error);
    }
  });
}

// Get current user
function getCurrentUser() {
  // Use NRD Data Access to get current user, fallback to local variable
  const nrd = window.nrd;
  if (nrd && nrd.auth) {
    return nrd.auth.getCurrentUser() || currentUser;
  }
  return currentUser;
}
