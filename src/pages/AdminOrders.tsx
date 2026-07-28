import { useEffect, useState } from 'react'

import AdminHeader from '../components/AdminHeader'
import { supabase } from '../lib/supabaseClient'
import './AdminOrders.css'

type AdminWholesaleOrder = {
  id: string
  order_number: string
  created_at: string
  wholesale_customer_id: string | null
  company_name: string | null
  company_id: string | null
  vat_number: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  delivery_street: string | null
  delivery_house_number: string | null
  delivery_city: string | null
  delivery_postcode: string | null
  currency: string
  total_amount: number
  payment_status: string
  fulfilment_status: string
  notes: string | null
  cartons: number
}

function formatPaymentStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'Payment Pending'
    case 'paid':
      return 'Paid'
    case 'failed':
      return 'Payment Failed'
    case 'refunded':
      return 'Refunded'
    default:
      return status
  }
}

function formatFulfilmentStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'Order Pending'
    case 'confirmed':
      return 'Confirmed'
    case 'processing':
      return 'Preparing'
    case 'fulfilled':
      return 'Fulfilled'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function AdminOrders() {
  const [orders, setOrders] =
    useState<AdminWholesaleOrder[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [updatingOrderId, setUpdatingOrderId] =
  useState<string | null>(null)

  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          throw new Error(
            'Your admin session has expired.',
          )
        }

        const response = await fetch(
          '/api/admin/wholesale-orders',
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          },
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              'Unable to load wholesale orders.',
          )
        }

        if (isMounted) {
          setOrders(result.orders ?? [])
        }
      } catch (error) {
        console.error(
          'Admin wholesale orders load failed:',
          error,
        )

        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load wholesale orders.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [])
async function handleConfirmOrder(orderId: string) {
  setUpdatingOrderId(orderId)
  setActionError('')

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error(
        'Your admin session has expired.',
      )
    }

    const response = await fetch(
      '/api/admin/update-wholesale-order-status',
      {
        method: 'PATCH',
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          fulfilmentStatus: 'confirmed',
        }),
      },
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ?? 'Unable to confirm order.',
      )
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              fulfilment_status: 'confirmed',
            }
          : order,
      ),
    )
  } catch (error) {
    console.error(
      'Admin order confirmation failed:',
      error,
    )

    setActionError(
      error instanceof Error
        ? error.message
        : 'Unable to confirm order.',
    )
  } finally {
    setUpdatingOrderId(null)
  }
}
  return (
    <>
      <AdminHeader />

      <main className="adminOrdersPage">
        <div className="adminOrdersContainer">
          <header className="adminOrdersHeader">
            <p className="adminOrdersEyebrow">
              ORDER MANAGEMENT
            </p>

            <h1>Wholesale Orders</h1>
          </header>

          {isLoading && (
            <div className="adminOrdersLoading">
              Loading wholesale orders...
            </div>
          )}

          {loadError && (
            <div className="adminOrdersError">
              {loadError}
            </div>
          )}

          {actionError && (
            <div className="adminOrdersError">
              {actionError}
            </div>
        )}

          {!isLoading &&
            !loadError &&
            orders.length === 0 && (
              <div className="adminOrdersEmpty">
                No wholesale orders found.
              </div>
            )}

          {!isLoading &&
            !loadError &&
            orders.length > 0 && (
              <div className="adminOrdersList">
                {orders.map((order) => {
                  const orderDate =
                    new Intl.DateTimeFormat(
                      'en-GB',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    ).format(
                      new Date(order.created_at),
                    )

                  const orderTotal =
                    order.total_amount / 100

                  const deliveryAddress = [
                    [
                      order.delivery_street,
                      order.delivery_house_number,
                    ]
                      .filter(Boolean)
                      .join(' '),
                    [
                      order.delivery_postcode,
                      order.delivery_city,
                    ]
                      .filter(Boolean)
                      .join(' '),
                  ]
                    .filter(Boolean)
                    .join(', ')

                  return (
                    <article
                      key={order.id}
                      className="adminOrderCard"
                    >
                      <div className="adminOrderTop">
                        <div>
                          <p className="adminOrderNumber">
                            {order.order_number}
                          </p>

                          <p className="adminOrderDate">
                            {orderDate}
                          </p>
                        </div>

                        <p className="adminOrderTotal">
                          {order.currency === 'EUR'
                            ? `€${orderTotal.toFixed(2)}`
                            : `${orderTotal.toFixed(2)} ${order.currency}`}
                        </p>
                      </div>

                      <div className="adminOrderContent">
                        <div className="adminOrderDetailsGrid">
                          <section className="adminOrderSection">
                            <h2>Company</h2>

                            <p className="adminOrderDetail">
                              <span>Company name</span>
                              <strong>
                                {order.company_name || '—'}
                              </strong>
                            </p>

                            <p className="adminOrderDetail">
                              <span>Company ID / IČO</span>
                              <strong>
                                {order.company_id || '—'}
                              </strong>
                            </p>

                            <p className="adminOrderDetail">
                              <span>VAT number</span>
                              <strong>
                                {order.vat_number || '—'}
                              </strong>
                            </p>
                          </section>

                          <section className="adminOrderSection">
                            <h2>Contact</h2>

                            <p className="adminOrderDetail">
                              <span>Name</span>
                              <strong>
                                {order.customer_name || '—'}
                              </strong>
                            </p>

                            <p className="adminOrderDetail">
                              <span>Email</span>
                              <strong>
                                {order.customer_email || '—'}
                              </strong>
                            </p>

                            <p className="adminOrderDetail">
                              <span>Phone</span>
                              <strong>
                                {order.customer_phone || '—'}
                              </strong>
                            </p>
                          </section>

                          <section className="adminOrderSection">
                            <h2>Order & Delivery</h2>

                            <p className="adminOrderDetail">
                              <span>Cartons</span>
                              <strong>
                                {order.cartons}
                              </strong>
                            </p>

                            <p className="adminOrderDetail">
                              <span>Delivery address</span>
                              <strong>
                                {deliveryAddress || '—'}
                              </strong>
                            </p>
                          </section>
                        </div>

                        {order.notes && (
                          <section className="adminOrderNotes">
                            <h2>Customer notes</h2>
                            <p>{order.notes}</p>
                          </section>
                        )}

                        <div className="adminOrderStatusRow">
                          <p className="adminOrderStatus">
                            <span>Payment</span>
                            <strong>
                              {formatPaymentStatus(
                                order.payment_status,
                              )}
                            </strong>
                          </p>

                          <p className="adminOrderStatus">
                            <span>Order status</span>
                            <strong>
                              {formatFulfilmentStatus(
                                order.fulfilment_status,
                              )}
                            </strong>
                          </p>
                        </div>
                        {order.fulfilment_status === 'pending' && (
                          <div className="adminOrderActions">
                            <button
                              type="button"
                              className="adminOrderConfirmButton"
                              disabled={updatingOrderId === order.id}
                              onClick={() =>
                                handleConfirmOrder(order.id)
                              }
                          >
                              {updatingOrderId === order.id
                                ? 'Confirming...'
                                : 'Confirm Order'}
                            </button>
                          </div>
                )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
        </div>
      </main>
    </>
  )
}

export default AdminOrders