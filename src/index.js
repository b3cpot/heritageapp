import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initAnalytics } from './analytics';
import { initErrorTracking, Sentry } from './errorTracking';

// Initialize tracking services
initErrorTracking();
initAnalytics();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Error fallback component
function ErrorFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1c1917',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        textAlign: 'center',
        color: '#fafaf9',
        maxWidth: 400
      }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>😵</div>
        <h1 style={{ fontFamily: 'Cinzel, serif', color: '#c9a45c', marginBottom: 16 }}>
          Something went wrong
        </h1>
        <p style={{ color: '#a8a29e', marginBottom: 24 }}>
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#b45309',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
