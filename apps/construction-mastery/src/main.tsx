import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Claim /construction-mastery/ with our own SW so this path is a separate
// installable app from Jamo Sports Hub (root /sw.js, formerly scope "/").
if ('serviceWorker' in navigator && window.isSecureContext) {
  const register = () => {
    navigator.serviceWorker
      .register('/construction-mastery/sw.js', {
        scope: '/construction-mastery/',
        updateViaCache: 'none',
      })
      .catch(() => {});
  };
  if (document.readyState === 'complete') setTimeout(register, 400);
  else window.addEventListener('load', () => setTimeout(register, 400));
}
