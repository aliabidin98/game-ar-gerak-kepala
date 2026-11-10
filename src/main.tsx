import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
} catch (err) {
  console.error('Fatal initialization error:', err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#020617;color:#fff;font-family:sans-serif;padding:24px;text-align:center;">
        <h2 style="color:#f87171;">Terjadi Kesalahan Memulai Aplikasi</h2>
        <pre style="background:rgba(0,0,0,0.5);padding:12px;border-radius:8px;max-width:90%;">${err}</pre>
        <button onclick="localStorage.clear();location.reload();" style="margin-top:16px;padding:10px 20px;background:#0284c7;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Reset Data &amp; Muat Ulang</button>
      </div>
    `;
  }
}
