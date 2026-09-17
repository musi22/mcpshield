import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const CLERK_KEY =
  (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Z2VudWluZS1waG9lbml4LTM0NjguY2xlcmsuYWNjb3VudHMuZGV2JA';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_KEY}
      appearance={{
        variables: {
          colorPrimary: '#f43f5e',
          colorBackground: '#ffffff',
          colorInputBackground: '#fff5f5',
          colorInputText: '#1e293b',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b'
        },
        elements: {
          card: 'rounded-3xl border border-rose-100 shadow-2xl shadow-rose-100/60',
          formButtonPrimary: 'bg-gradient-to-r from-rose-500 to-orange-400 hover:opacity-95 text-white font-bold rounded-xl'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
