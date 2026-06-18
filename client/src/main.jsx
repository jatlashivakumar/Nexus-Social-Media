import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import App from './App';
import './index.css';
import ErrorBoundary from './ErrorBoundary';

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 3*60*1000, gcTime: 10*60*1000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});

const saved = localStorage.getItem('nexus-theme') || 'light';
document.documentElement.classList.toggle('dark', saved === 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={qc}>
          <BrowserRouter>
          <ErrorBoundary>
            <App />
            </ErrorBoundary>
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius:'14px',
                  fontFamily:'Inter,system-ui,sans-serif',
                  fontSize:'13.5px',
                  fontWeight:500,
                  padding:'12px 16px',
                  background:'#ffffff',
                  color:'#0d0c14',
                  border:'1px solid #e5e4f2',
                  boxShadow:'0 4px 24px rgba(0,0,0,.08)',
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
