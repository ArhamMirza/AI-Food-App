import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './redux/store';
import { OnboardingProvider } from './context/OnboardingContext'
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);