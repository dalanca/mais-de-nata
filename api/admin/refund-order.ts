import Stripe from 'stripe'

import {
    supabaseAdmin,
} from '../../server/database/supabase.js'

import {
    OrderPaymentStatus,
} from '../../server/orders/order-types.js'

import {
    cancelWoltDelivery,
} from '../../server/wolt/cancel-delivery.js'

const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
    throw new Error(
        'STRIPE_SECRET_KEY is not configured',
    )
}

const stripe = new Stripe(
    stripeSecretKey,
)

export default async function handler(
    req: any,
    res: any,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        })
    }

    try {
        const authorization =
            req.headers.authorization

        if (
            !authorization ||
            !authorization.startsWith('Bearer ')
        ) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            })
        }

        const accessToken =
            authorization.slice(
                'Bearer '.length,
            )

        const {
            data: { user },
            error: authError,
        } =
            await supabaseAdmin.auth.getUser(
                accessToken,
            )

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid session',
            })
        }

        const {
            data: adminUser,
            error: adminError,
        } = await supabaseAdmin
            .from('admin_users')
            .select('role, is_active')
            .eq('id', user.id)
            .single()

        if (
            adminError ||
            !adminUser ||
            adminUser.role !== 'admin' ||
            adminUser.is_active !== true
        ) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required',
            })
        }

        const {
            orderId,
            reason,
        } = req.body ?? {}

        if (
            !orderId ||
            typeof orderId !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required',
            })
        }

        const refundReason =
            typeof reason === 'string'
                ? reason.trim()
                : ''

        if (!refundReason) {
            return res.status(400).json({
                success: false,
                error: 'Refund reason is required',
            })
        }

        const {
            data: order,
            error: orderError,
        } = await supabaseAdmin
            .from('orders')
            .select(
                `
      id,
      order_number,
      payment_status,
      stripe_session_id,
      production_status,
      wolt_order_reference_id,
      wolt_delivery_id
        `,
            )
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            })
        }

        if (
            order.payment_status ===
            OrderPaymentStatus.Refunded
        ) {
            return res.status(200).json({
                success: true,
                alreadyRefunded: true,
            })
        }

        if (
            order.payment_status !==
            OrderPaymentStatus.Paid
        ) {
            return res.status(409).json({
                success: false,
                error:
                    'Only paid orders can be refunded',
            })
        }

        if (!order.stripe_session_id) {
            return res.status(409).json({
                success: false,
                error:
                    'Stripe checkout session is missing',
            })
        }

        if (
            order.production_status === 'collected' ||
            order.production_status === 'delivered'
        ) {
            return res.status(409).json({
                success: false,
                error:
                    'This order has already been collected or delivered and cannot be automatically cancelled.',
            })
        }

        if (
            order.production_status === 'ready' &&
            order.wolt_delivery_id
        ) {
            if (!order.wolt_order_reference_id) {
                throw new Error(
                    'Wolt order reference is missing',
                )
            }

            await cancelWoltDelivery(
                order.wolt_order_reference_id,
                refundReason,
            )
        }

        const session =
            await stripe.checkout.sessions.retrieve(
                order.stripe_session_id,
            )

        const paymentIntent =
            session.payment_intent

        const paymentIntentId =
            typeof paymentIntent === 'string'
                ? paymentIntent
                : paymentIntent?.id

        if (!paymentIntentId) {
            return res.status(409).json({
                success: false,
                error:
                    'Stripe payment intent is missing',
            })
        }

        const refund =
            await stripe.refunds.create(
                {
                    payment_intent:
                        paymentIntentId,

                    metadata: {
                        order_id: order.id,
                        order_number:
                            order.order_number,
                        refund_reason:
                            refundReason,
                        refunded_by:
                            user.id,
                    },
                },
                {
                    idempotencyKey:
                        `refund-order-${order.id}`,
                },
            )

        if (refund.status !== 'succeeded') {
            throw new Error(
                `Stripe refund failed with status: ${refund.status}`,
            )
        }

        const {
            error: updateError,
        } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status:
                    OrderPaymentStatus.Refunded,

                production_status:
                    'cancelled',

                fulfilment_status:
                    'Cancelled',
            })
            .eq('id', order.id)

        if (updateError) {
            throw updateError
        }

        return res.status(200).json({
            success: true,
            refundId: refund.id,
            refundStatus: refund.status,
        })
    } catch (error) {
        console.error(
            'Unable to refund order:',
            error,
        )

        return res.status(500).json({
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Unable to refund order',
        })
    }
}