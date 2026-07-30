import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
import './WholesaleAccount.css'

type WholesaleCustomer = {
  id: string
  company_name: string | null
  company_id: string | null
  vat_number: string | null
  contact_name: string | null
  email: string | null
  phone: string | null

  company_street: string | null
  company_house_number: string | null
  company_postcode: string | null
  company_city: string | null
  company_country: string | null

  delivery_same_as_company: boolean | null

  delivery_street: string | null
  delivery_house_number: string | null
  delivery_postcode: string | null
  delivery_city: string | null
  delivery_country: string | null
}
type WholesaleOrder = {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  currency: string
  payment_status: string
  fulfilment_status: string
}
type WholesaleOrderItem = {
  order_id: string
  quantity: number
}

const WholesaleAccount = () => {
  const { t, language } = useLanguage()

  function formatPaymentStatus(status: string) {
  switch (status) {
    case 'pending':
      return t.wholesaleAccountPaymentPending

    case 'paid':
  return t.wholesaleAccountPaymentPaid

    default:
      return status
  }
}

function formatFulfilmentStatus(status: string) {
  switch (status) {
    case 'pending':
      return t.wholesaleAccountOrderReceived

    case 'confirmed':
      return t.wholesaleAccountOrderConfirmed

    case 'fulfilled':
      return t.wholesaleAccountOrderDelivered

    default:
      return status
  }
}

  const [customers, setCustomers] =
    useState<WholesaleCustomer[]>([])

  const [selectedCustomerId, setSelectedCustomerId] =
  useState('')
  
  const customer =
  customers.find(
    (item) => item.id === selectedCustomerId,
  ) ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [orders, setOrders] = useState<WholesaleOrder[]>([])
  
  const [cartonsByOrder, setCartonsByOrder] =
  useState<Record<string, number>>({})
  useEffect(() => {
  let isMounted = true

  async function loadWholesaleCustomers() {
    try {
      setLoadError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Unable to load your wholesale account.',
        )
      }

      const {
        data,
        error: customerError,
      } = await supabase
        .from('wholesale_customers')
        .select(
          `
            id,
            company_name,
            company_id,
            vat_number,
            contact_name,
            email,
            phone,
            company_street,
            company_house_number,
            company_postcode,
            company_city,
            company_country,
            delivery_same_as_company,
            delivery_street,
            delivery_house_number,
            delivery_postcode,
            delivery_city,
            delivery_country
          `,
        )
        .eq('auth_user_id', user.id)
        .eq('account_status', 'active')
        .order('created_at', {
          ascending: true,
        })

      if (customerError) {
        throw customerError
      }

      const activeCustomers =
        (data ?? []) as WholesaleCustomer[]

      if (activeCustomers.length === 0) {
        throw new Error(
          'No active wholesale company was found.',
        )
      }

      if (isMounted) {
        setCustomers(activeCustomers)
        setSelectedCustomerId(
          activeCustomers[0].id,
        )
      }
    } catch (error) {
      console.error(
        'Unable to load wholesale account:',
        error,
      )

      if (isMounted) {
        setLoadError(
          t.wholesaleAccountLoadError,
        )
      }
    } finally {
      if (isMounted) {
        setIsLoading(false)
      }
    }
  }

  loadWholesaleCustomers()

  return () => {
    isMounted = false
  }
}, [t.wholesaleAccountLoadError])

useEffect(() => {
  let isMounted = true

  async function loadWholesaleOrders() {
    if (!selectedCustomerId) {
      return
    }

    try {
      const {
        data: orderData,
        error: ordersError,
      } = await supabase
        .from('orders')
        .select(
          `
            id,
            order_number,
            created_at,
            total_amount,
            currency,
            payment_status,
            fulfilment_status
          `,
        )
        .eq(
          'wholesale_customer_id',
          selectedCustomerId,
        )
        .order('created_at', {
          ascending: false,
        })

          if (ordersError) {
            throw ordersError
        }

      const orderIds =
        (orderData ?? []).map(
          (order) => order.id,
        )

      let orderItems: WholesaleOrderItem[] = []

      if (orderIds.length > 0) {
        const {
          data: orderItemData,
          error: orderItemsError,
        } = await supabase
          .from('order_items')
          .select(
            `
              order_id,
              quantity
            `,
          )
          .in('order_id', orderIds)

        if (orderItemsError) {
          throw orderItemsError
        }

        orderItems =
          (orderItemData ??
            []) as WholesaleOrderItem[]
      }

      const cartonLookup:
        Record<string, number> = {}

      for (const item of orderItems) {
        cartonLookup[item.order_id] =
          (cartonLookup[item.order_id] ?? 0) +
          item.quantity
      }

      if (isMounted) {
        setOrders(orderData ?? [])
        setCartonsByOrder(cartonLookup)
      }
    } catch (error) {
      console.error(
        'Unable to load wholesale orders:',
        error,
      )

      if (isMounted) {
        setLoadError(
          t.wholesaleAccountLoadError,
        )
      }
    }
  }

  loadWholesaleOrders()

  return () => {
    isMounted = false
  }
}, [
  selectedCustomerId,
  t.wholesaleAccountLoadError,
])

if (isLoading) {
  return (
    <>
      <SiteHeader />

    <main className="wholesaleAccountLoading">
      {t.wholesaleAccountLoading}
    </main>
    </>
  )
}

if (loadError || !customer) {
  return (
    <>
      <SiteHeader />

      <main className="wholesaleAccountError">
        <p>{loadError}</p>
      </main>
    </>
  )
}

  const companyAddress = [
    [
      customer.company_street,
      customer.company_house_number,
    ]
      .filter(Boolean)
      .join(' '),
    [
      customer.company_postcode,
      customer.company_city,
    ]
      .filter(Boolean)
      .join(' '),
    customer.company_country,
  ]
    .filter(Boolean)
    .join(', ')

  const deliveryAddress =
    customer.delivery_same_as_company
      ? companyAddress
      : [
          [
            customer.delivery_street,
            customer.delivery_house_number,
          ]
            .filter(Boolean)
            .join(' '),
          [
            customer.delivery_postcode,
            customer.delivery_city,
          ]
            .filter(Boolean)
            .join(' '),
          customer.delivery_country,
        ]
          .filter(Boolean)
          .join(', ')

  return (
  <>
    <SiteHeader />

    <main className="wholesaleAccountPage">
      <section className="wholesaleAccountContainer">
<div className="wholesaleAccountHeader">
  <div>
    <p className="wholesaleAccountEyebrow">
      {t.wholesaleAccountEyebrow}
    </p>

    <h1>{t.wholesaleAccountTitle}</h1>
  </div>

  <div className="wholesaleAccountHeaderActions">
    {customers.length > 1 && (
      <label className="wholesaleAccountCompanySelector">
        <span>{t.wholesaleAccountCompanySelector}</span>

        <select
          value={selectedCustomerId}
          onChange={(event) =>
            setSelectedCustomerId(event.target.value)
          }
        >
          {customers.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.company_name}
            </option>
          ))}
        </select>
      </label>
    )}

<a
  href={`/wholesale-order?company=${selectedCustomerId}`}
  className="wholesaleAccountNewOrder"
>
  {t.wholesaleAccountPlaceOrder}
</a>

<a
  href="/register"
  className="wholesaleAccountNewOrder"
>
  {t.wholesaleAccountRegisterCompany}
</a>

  </div>
</div>

        <section className="wholesaleAccountSection">
          <h2 className="wholesaleAccountSectionTitle">
            {t.wholesaleAccountDetailsTitle}
          </h2>

          <div className="wholesaleAccountDetailsCard">
<div className="wholesaleAccountDetailsGrid">
  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountCompany}</span>
    <strong>{customer.company_name}</strong>
  </p>

  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountCompanyId}</span>
    <strong>{customer.company_id}</strong>
  </p>

  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountVatNumber}</span>
    <strong>
      {customer.vat_number || '—'}
    </strong>
  </p>

  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountContact}</span>
    <strong>{customer.contact_name}</strong>
  </p>

  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountEmail}</span>
    <strong>{customer.email}</strong>
  </p>

  <p className="wholesaleAccountDetail">
    <span>{t.wholesaleAccountPhone}</span>
    <strong>
      {customer.phone || '—'}
    </strong>
  </p>

  <p className="wholesaleAccountDetail wholesaleAccountDetailWide">
    <span>{t.wholesaleAccountCompanyAddress}</span>
    <strong>{companyAddress}</strong>
  </p>

  <p className="wholesaleAccountDetail wholesaleAccountDetailWide">
    <span>{t.wholesaleAccountDeliveryAddress}</span>
    <strong>{deliveryAddress}</strong>
  </p>
</div>
          </div>
        </section>

        <section className="wholesaleAccountSection">
          <h2 className="wholesaleAccountSectionTitle">
            {t.wholesaleAccountOrderHistory}
          </h2>

          {orders.length === 0 ? (
            <div className="wholesaleAccountEmpty">
              <p>{t.wholesaleAccountNoOrders}</p>
            </div>
          ) : (
            <div className="wholesaleAccountOrders">
              {orders.map((order) => {
                const orderDate =
                new Intl.DateTimeFormat(
                  language === 'cs' ? 'cs-CZ' : 'en-GB',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    },
                  ).format(
                    new Date(order.created_at),
                  )

                const orderTotal =
                  order.total_amount / 100

                const cartons =
                  cartonsByOrder[order.id] ?? 0

                return (
                  <article
                    key={order.id}
                    className="wholesaleAccountOrderCard"
                  >
                    <div className="wholesaleAccountOrderTop">
                      <div>
                        <p className="wholesaleAccountOrderNumber">
                          {order.order_number}
                        </p>

                        <p className="wholesaleAccountOrderDate">
                          {orderDate}
                        </p>
                      </div>

                      <p className="wholesaleAccountOrderTotal">
                        {order.currency === 'EUR'
                          ? `€${orderTotal.toFixed(2)}`
                          : `${orderTotal.toFixed(2)} ${order.currency}`}
                      </p>
                    </div>

<div className="wholesaleAccountOrderDetails">
  <p className="wholesaleAccountOrderDetail">
    <span>{t.wholesaleAccountCartons}</span>
        <strong>{cartons}</strong>
  </p>

  <p className="wholesaleAccountOrderDetail">
    <span>{t.wholesaleAccountPayment}</span>

    <strong
      className={`wholesaleAccountStatus wholesaleAccountStatus--${order.payment_status}`}
    >
      {formatPaymentStatus(order.payment_status)}
    </strong>
  </p>

  <p className="wholesaleAccountOrderDetail">
    <span>{t.wholesaleAccountOrderStatus}</span>
    <strong
      className={`wholesaleAccountStatus wholesaleAccountStatus--${order.fulfilment_status}`}
    >
      {formatFulfilmentStatus(order.fulfilment_status)}
    </strong>
  </p>
</div>                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  </>
)
}
export default WholesaleAccount