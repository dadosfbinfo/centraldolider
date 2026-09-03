import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure dark mode is completely removed from document
document.documentElement.classList.remove('dark');
document.body.classList.remove('dark');
try {
  localStorage.removeItem('cdl_theme_mode');
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
