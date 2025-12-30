import posthog from 'posthog-js';

// Initialize PostHog
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://app.posthog.com';

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Automatic tracking
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      // Privacy-friendly
      respect_dnt: true,
      // Session recording (optional)
      disable_session_recording: false,
      // Persistence
      persistence: 'localStorage',
    });
    console.log('📊 PostHog analytics initialized');
  }
  return posthog;
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
};

// Track page views manually if needed
export const trackPageView = (pageName, properties = {}) => {
  trackEvent('$pageview', { page: pageName, ...properties });
};

// Identify user (call after login)
export const identifyUser = (userId, userProperties = {}) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, userProperties);
  }
};

// Reset user (call after logout)
export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
};

// Pre-defined events for your heritage app
export const HeritageEvents = {
  // Site interactions
  SITE_VIEWED: 'site_viewed',
  SITE_ADDED_TO_ROUTE: 'site_added_to_route',
  SITE_REMOVED_FROM_ROUTE: 'site_removed_from_route',
  SITE_SHARED: 'site_shared',
  
  // Map interactions
  MAP_FILTER_USED: 'map_filter_used',
  MAP_ERA_CHANGED: 'map_era_changed',
  COUNTRY_SELECTED: 'country_selected',
  
  // Route interactions
  ROUTE_CREATED: 'route_created',
  ROUTE_EXPORTED: 'route_exported',
  DIRECTIONS_OPENED: 'directions_opened',
  
  // Search
  SEARCH_PERFORMED: 'search_performed',
  
  // Language
  LANGUAGE_CHANGED: 'language_changed',
  
  // Auth
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
};

export default posthog;
