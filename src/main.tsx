import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import WholesaleOrder from './pages/WholesaleOrder'
import './App.css'
import Register from './pages/Register'
import ProductInformation from './pages/ProductInformation'
import { LanguageProvider } from "./LanguageContext"

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      {path === '/wholesale-order' ? (
        <WholesaleOrder />
      ) : path === '/register' ? (
        <Register />
      ) : path === '/product-information' ? (
        <ProductInformation />
      ) : (
        <App />
      )}
    </LanguageProvider>
  </React.StrictMode>,
)