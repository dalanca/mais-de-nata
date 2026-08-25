import {
    supabaseAdmin,
} from '../database/supabase.js'

import {
    sendConsumerOrderConfirmationEmail,
} from './send-consumer-order-confirmation-email.js'

type Props = {
    orderId: string
    to: string
    customerName: string
    orderNumber: string
    language: 'en' | 'cs'

    totalAmount: number
    currency: string

    items: Array<{
        productName: string
        quantity: number
        totalPrice: number
    }>

    deliveryFee: number

    deliveryAddress: string
    deliveryDate?: string
    deliveryTime?: string

    trackingUrl?: string
}

export async function sendConsumerOrderConfirmationOnce(
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
        customer_confirmation_email_sent_at
      `,
        )
        .eq('id', props.orderId)
        .single()

    if (loadError || !order) {
        throw (
            loadError ??
            new Error(
                'Unable to load order email state',
            )
        )
    }

    if (
        order.customer_confirmation_email_sent_at
    ) {
        return {
            alreadySent: true,
        }
    }

    try {
        await sendConsumerOrderConfirmationEmail(
            props,
        )

        const {
            error: updateError,
        } = await supabaseAdmin
            .from('orders')
            .update({
                customer_confirmation_email_sent_at:
                    new Date().toISOString(),

                customer_confirmation_email_error:
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
                customer_confirmation_email_error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to send confirmation email',
            })
            .eq('id', props.orderId)

        throw error
    }
}