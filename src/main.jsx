import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LicenceProvider } from './hooks/useLicence'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LicenceProvider>
      <App />
    </LicenceProvider>
  </React.StrictMode>
)
