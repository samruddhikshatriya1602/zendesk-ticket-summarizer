import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@zendeskgarden/react-theming';
import { ToastProvider } from '@zendeskgarden/react-notifications';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider zIndex={2000}>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
