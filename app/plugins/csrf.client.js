/**
 * CSRF protection enhancement plugin
 * Provides additional CSRF error handling for better UX
 */

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return;

  // Handle CSRF errors globally
  const handleCSRFError = (error) => {
    if (error?.status === 419 || error?.statusCode === 419) {
      console.warn('CSRF token mismatch detected');
      
      // Show user-friendly message
      const { $toast } = useNuxtApp();
      if ($toast) {
        $toast.warning('Session expirée. La page va être rechargée.');
      }
      
      // Reload page to get fresh CSRF token
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return true; // Indicate error was handled
    }
    return false; // Let other error handlers process
  };

  // Add global error handler
  window.addEventListener('unhandledrejection', (event) => {
    if (handleCSRFError(event.reason)) {
      event.preventDefault(); // Prevent default error logging
    }
  });

  // Log successful CSRF initialization
  console.info('✅ CSRF protection enabled');
});