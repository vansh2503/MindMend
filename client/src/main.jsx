import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { MoodProvider } from './context/MoodContext';
import { UserProvider } from './context/UserContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <UserProvider>
        <MoodProvider>
          <App />
        </MoodProvider>
      </UserProvider>
    </AuthProvider>
  </BrowserRouter>
);
