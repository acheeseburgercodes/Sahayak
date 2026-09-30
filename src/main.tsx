import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';
import { AnnouncerProvider } from './context/AnnouncerContext';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <SettingsProvider>
      <AnnouncerProvider>
        <App />
      </AnnouncerProvider>
    </SettingsProvider>
  </StrictMode>,
);
