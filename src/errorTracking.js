import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

export const initErrorTracking = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance
      
      // Session replay (captures what user did before error)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Environment
      environment: process.env.NODE_ENV || 'development',
      
      // Filter out noisy errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Network errors that aren't actionable
        'Network Error',
        'Failed to fetch',
        'Load failed',
        // User aborted
        'AbortError',
      ],
      
      // Before sending, you can modify or filter events
      beforeSend(event, hint) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry would capture:', event);
          return null;
        }
        return event;
      },
    });
    
    console.log('🛡️ Sentry error tracking initialized');
  }
};

// Capture custom errors
export const captureError = (error, context = {}) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  console.error('Error captured:', error, context);
};

// Capture messages (non-error events)
export const captureMessage = (message, level = 'info') => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

// Set user context (call after login)
export const setUser = (user) => {
  if (SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }
};

// Clear user context (call after logout)
export const clearUser = () => {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

// Add breadcrumb (for debugging complex issues)
export const addBreadcrumb = (message, category = 'action', data = {}) => {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};

// Wrap async functions with error boundary
export const withErrorTracking = (fn, context = '') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, { context, args });
      throw error;
    }
  };
};

// Export Sentry for ErrorBoundary usage
export { Sentry };
