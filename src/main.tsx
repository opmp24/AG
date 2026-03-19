import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Registro del Service Worker para PWA gestionado por vite-plugin-pwa
if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
}

import { BrowserRouter } from 'react-router-dom';

const basename = import.meta.env.MODE === 'production' ? '/AG/' : '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
