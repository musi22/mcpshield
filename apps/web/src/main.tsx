import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
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
        baseTheme: dark,
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0b0e14',
          colorInputBackground: '#131823',
          colorInputText: '#ffffff',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
