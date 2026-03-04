import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Registro del Service Worker para PWA gestionado por vite-plugin-pwa
if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
