import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { EventConfigProvider } from './context/EventConfigContext.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <EventConfigProvider>
            <App />
        </EventConfigProvider>
    </StrictMode>
);
