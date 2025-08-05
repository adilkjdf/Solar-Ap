import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'leaflet-rotate/dist/leaflet-rotate.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);