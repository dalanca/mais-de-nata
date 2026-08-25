import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router'
import Wholesale from './pages/Wholesale'
import App from './App.tsx'
import WholesaleOrder from './pages/WholesaleOrder'
import Register from './pages/Register'
import ProductInformation from './pages/ProductInformation'
import OurPasteis from './pages/OurPasteis'
import OrderFresh from './pages/OrderFresh'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import WholesaleAccount from './pages/WholesaleAccount'
import { LanguageProvider } from './LanguageContext'
import './App.css'

import PaymentSuccess from './pages/PaymentSuccess'
import Contact from './pages/Contact'
import WholesaleAccountSetup from './pages/WholesaleAccountSetup'
import WholesaleSignIn from './pages/WholesaleSignIn'
import WholesaleForgotPassword from './pages/WholesaleForgotPassword'
import WholesaleResetPassword from './pages/WholesaleResetPassword'
import ProtectedWholesaleRoute from './components/ProtectedWholesaleRoute'
import WholesaleOrderSuccess from './pages/WholesaleOrderSuccess'

import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import AdminOrders from './pages/AdminOrders'
import AdminProduction from './pages/AdminProduction'
import AdminSignIn from './pages/AdminSignIn'
import AdminForgotPassword from './pages/AdminForgotPassword'
import AdminResetPassword from './pages/AdminResetPassword'
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
            path="/wholesale"
            element={<Wholesale />}
          />
          <Route
            path="/product-information"
            element={<ProductInformation />}
          />
          <Route
            path="/wholesale-order"
            element={
              <ProtectedWholesaleRoute>
                <WholesaleOrder />
              </ProtectedWholesaleRoute>
            }
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/wholesale-sign-in"
            element={<WholesaleSignIn />}
          />

          <Route
            path="/wholesale-forgot-password"
            element={<WholesaleForgotPassword />}
          />

          <Route
            path="/wholesale-reset-password"
            element={<WholesaleResetPassword />}
          />

          <Route
            path="/wholesale-account-setup"
            element={<WholesaleAccountSetup />}
          />

          <Route
            path="/contact"
            element={<Contact />}
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
            path="/payment-success"
            element={<PaymentSuccess />}
          />
          <Route
            path="/wholesale-account-setup"
            element={<WholesaleAccountSetup />}
          />

          <Route
            path="/wholesale-order-success"
            element={
              <ProtectedWholesaleRoute>
                <WholesaleOrderSuccess />
              </ProtectedWholesaleRoute>
            }
          />

          <Route
            path="/wholesale-account"
            element={
              <ProtectedWholesaleRoute>
                <WholesaleAccount />
              </ProtectedWholesaleRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedAdminRoute>
                <AdminOrders />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/production"
            element={
              <ProtectedAdminRoute>
                <AdminProduction />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/sign-in"
            element={<AdminSignIn />}
          />

          <Route
            path="/admin/forgot-password"
            element={<AdminForgotPassword />}
          />

          <Route
            path="/admin/reset-password"
            element={<AdminResetPassword />}
          />

          <Route
            path="*"
            element={<App />}
          />

        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)