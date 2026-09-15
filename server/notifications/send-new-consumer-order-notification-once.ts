import {
  supabaseAdmin,
} from '../database/supabase.js'

import {
  sendNewConsumerOrderNotification,
} from './send-new-consumer-order-notification.js'

type Props = {
  orderId: string
  orderNumber: string
  customerName: string
  totalAmount: number
  currency: string

  items: Array<{
    productName: string
    quantity: number
  }>

  deliveryAddress: string
  deliveryDate?: string
  deliveryTime?: string
  trackingUrl?: string
}

export async function sendNewConsumerOrderNotificationOnce(
  props: Props,
) {
  const {
    data: order,
    error: loadError,
  } = await supabaseAdmin
    .from('orders')
    .select(
      `
        id,
        telegram_notification_sent_at
      `,
    )
    .eq('id', props.orderId)
    .single()

  if (loadError || !order) {
    throw (
      loadError ??
      new Error(
        'Unable to load Telegram notification state',
      )
    )
  }

  if (
    order.telegram_notification_sent_at
  ) {
    return {
      alreadySent: true,
    }
  }

  try {
    await sendNewConsumerOrderNotification(
      props,
    )

    const {
      error: updateError,
    } = await supabaseAdmin
      .from('orders')
      .update({
        telegram_notification_sent_at:
          new Date().toISOString(),

        telegram_notification_error:
          null,
      })
      .eq('id', props.orderId)

    if (updateError) {
      throw updateError
    }

    return {
      alreadySent: false,
    }
  } catch (error) {
    await supabaseAdmin
      .from('orders')
      .update({
        telegram_notification_error:
          error instanceof Error
            ? error.message
            : 'Unable to send Telegram notification',
      })
      .eq('id', props.orderId)

    throw error
  }
}