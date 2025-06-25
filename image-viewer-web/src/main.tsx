// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import ViewerContainer from './components/viewer/ViewerContainer';
import LoginMenu from './components/login/LoginMenu';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useViewerStore } from './store/useViewerStore'

const queryClient = new QueryClient();

function Main() {

  const { isLogged } = useViewerStore();

  return (
      <QueryClientProvider client={queryClient}>
        {isLogged? (
          <ViewerContainer/>
        ) : (
          <LoginMenu/>
        )}
      </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

