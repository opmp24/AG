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

// Si estás en GitHub Pages en una subcarpeta, basename debería ser esa subcarpeta.
// Podríamos usar window.location.pathname para detectarlo dinámicamente si es necesario, 
// pero por ahora mantendremos /AG/ si ese es el nombre del repositorio.
// O simplemente usar basename="/AG/" directamente.

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
