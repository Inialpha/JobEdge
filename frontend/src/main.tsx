import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import store, { persistor } from './store/store';
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient()}>
    <StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </StrictMode>
  </QueryClientProvider>
)
