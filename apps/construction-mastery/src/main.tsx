import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Claim /construction-mastery/ with our own SW so this path is a separate
// installable app from Jamo Sports Hub (root /sw.js still registers at "/").
if ('serviceWorker' in navigator && window.isSecureContext) {
  const register = () => {
    navigator.serviceWorker
      .register('/construction-mastery/sw.js?v=20261124-scope', {
        scope: '/construction-mastery/',
        updateViaCache: 'none',
      })
      .then((reg) => {
        try {
          reg.update();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  };
  // Register ASAP so this path's SW outranks the root Sports Hub worker.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register, { once: true });
  } else {
    register();
  }
}
