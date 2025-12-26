
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n.ts'; // Initialize i18n before rendering
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);