import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router'

import App from './App.tsx'
import WholesaleOrder from './pages/WholesaleOrder'
import Register from './pages/Register'
import ProductInformation from './pages/ProductInformation'
import OurPasteis from './pages/OurPasteis'
import OrderFresh from './pages/OrderFresh'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

import { LanguageProvider } from './LanguageContext'
import './App.css'

import PaymentSuccess from './pages/PaymentSuccess'

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<App />}
          />

          <Route
            path="/wholesale-order"
            element={<WholesaleOrder />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/product-information"
            element={<ProductInformation />}
          />

          <Route
            path="/our-pasteis"
            element={<OurPasteis />}
          />

          <Route
            path="/order-fresh"
            element={<OrderFresh />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="*"
            element={<App />}           
          />
          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)