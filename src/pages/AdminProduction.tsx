import {
    useCallback,
    useEffect,
    useState,
} from 'react'

import { supabase } from '../lib/supabaseClient'

import './AdminProduction.css'

type ProductionStatus =
    | 'new'
    | 'accepted'
    | 'baking'
    | 'packing'
    | 'ready'
    | 'collected'
    | 'delivered'
    | 'cancelled'

type ProductionOrder = {
    id: string
    orderNumber: string
    salesChannel: string
    customerName: string | null

    totalAmount: number
    currency: string
    paymentStatus: string

    productionStatus: ProductionStatus

    items: {
        productName: string
        quantity: number
    }[]

    acceptedAt: string | null
    bakingStartedAt: string | null
    packingStartedAt: string | null
    readyAt: string | null
    collectedAt: string | null
    deliveredAt: string | null

    woltDeliveryStatus: string | null
    woltPickupEta: string | null
    woltPickupEtaUpdatedAt: string | null
    woltCourierId: string | null
    woltCourierVehicleType: string | null
    woltTrackingUrl: string | null

    createdAt: string
}

type DeliveryBlackout = {
    id: string
    starts_at: string
    ends_at: string | null
    reason: string | null
    created_at: string
    updated_at: string
}

type StatusDefinition = {
    status: ProductionStatus
    label: string
    emptyMessage: string
}

const statusDefinitions: StatusDefinition[] = [
    {
        status: 'new',
        label: 'New orders',
        emptyMessage: 'No new orders',
    },
    {
        status: 'accepted',
        label: 'Accepted',
        emptyMessage: 'No accepted orders',
    },
    {
        status: 'baking',
        label: 'Baking',
        emptyMessage: 'Nothing is baking',
    },
    {
        status: 'packing',
        label: 'Packing',
        emptyMessage: 'Nothing to pack',
    },
    {
        status: 'ready',
        label: 'Ready',
        emptyMessage: 'No orders waiting',
    },
    {
        status: 'collected',
        label: 'Collected',
        emptyMessage: 'No collected orders',
    },
]

const nextActionByStatus: Partial<
    Record<
        ProductionStatus,
        {
            label: string
            nextStatus: ProductionStatus
        }
    >
> = {
    new: {
        label: 'Accept',
        nextStatus: 'accepted',
    },

    accepted: {
        label: 'Start Baking',
        nextStatus: 'baking',
    },

    baking: {
        label: 'Start Packing',
        nextStatus: 'packing',
    },

    packing: {
        label: 'Ready',
        nextStatus: 'ready',
    },

    ready: {
        label: 'Collected',
        nextStatus: 'collected',
    },
}

function getShortOrderNumber(
    orderNumber: string,
) {
    const finalPart =
        orderNumber
            .split('-')
            .filter(Boolean)
            .at(-1)

    return finalPart
        ? `#${finalPart}`
        : orderNumber
}

function getStatusStartedAt(
    order: ProductionOrder,
) {
    switch (order.productionStatus) {
        case 'accepted':
            return (
                order.acceptedAt ??
                order.createdAt
            )

        case 'baking':
            return (
                order.bakingStartedAt ??
                order.acceptedAt ??
                order.createdAt
            )

        case 'packing':
            return (
                order.packingStartedAt ??
                order.bakingStartedAt ??
                order.createdAt
            )

        case 'ready':
            return (
                order.readyAt ??
                order.packingStartedAt ??
                order.createdAt
            )

        case 'collected':
            return (
                order.collectedAt ??
                order.readyAt ??
                order.createdAt
            )

        default:
            return order.createdAt
    }
}

function formatElapsedTime(
    value: string,
    now: number,
) {
    const elapsedMilliseconds =
        Math.max(
            0,
            now -
            new Date(value).getTime(),
        )

    const elapsedMinutes =
        Math.floor(
            elapsedMilliseconds /
            60_000,
        )

    if (elapsedMinutes < 1) {
        return 'Just now'
    }

    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} min`
    }

    const hours =
        Math.floor(
            elapsedMinutes / 60,
        )

    const minutes =
        elapsedMinutes % 60

    return minutes === 0
        ? `${hours} hr`
        : `${hours} hr ${minutes} min`
}

function getChannelLabel(
    salesChannel: string,
) {
    switch (salesChannel) {
        case 'ConsumerWebsite':
            return '🌐 Website'

        case 'WoltMarketplace':
            return '● Wolt'

        case 'Foodora':
            return '● Foodora'

        case 'BoltFood':
            return '● Bolt'

        default:
            return salesChannel
    }
}

function getChannelClass(
    salesChannel: string,
) {
    switch (salesChannel) {
        case 'ConsumerWebsite':
            return 'productionChannelWebsite'

        case 'WoltMarketplace':
            return 'productionChannelWolt'

        case 'Foodora':
            return 'productionChannelFoodora'

        case 'BoltFood':
            return 'productionChannelBolt'

        default:
            return 'productionChannelDefault'
    }
}

export default function AdminProduction() {
    const [orders, setOrders] =
        useState<ProductionOrder[]>([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    const [blackouts, setBlackouts] =
        useState<DeliveryBlackout[]>([])

    const [blackoutsLoading, setBlackoutsLoading] =
        useState(true)

    const activeOpenEndedBlackout =
        blackouts.find(
            (blackout) =>
                blackout.ends_at === null,
        ) ?? null

    const [showBlackoutForm, setShowBlackoutForm] =
        useState(false)

    const [blackoutDate, setBlackoutDate] =
        useState('')

    const [blackoutStartTime, setBlackoutStartTime] =
        useState('')

    const [blackoutEndTime, setBlackoutEndTime] =
        useState('')

    const [blackoutReason, setBlackoutReason] =
        useState('')

    const [savingBlackout, setSavingBlackout] =
        useState(false)

    const [
        firstSlotStartHour,
        setFirstSlotStartHour,
    ] = useState(12)

    const [
        lastSlotEndHour,
        setLastSlotEndHour,
    ] = useState(20)

    const [
        immediateDeliveryMinutes,
        setImmediateDeliveryMinutes,
    ] = useState(90)

    const [
        deliverySettingsLoading,
        setDeliverySettingsLoading,
    ] = useState(true)

    const [
        savingDeliverySettings,
        setSavingDeliverySettings,
    ] = useState(false)

    const [now, setNow] =
        useState(Date.now())

    const [
        updatingOrderId,
        setUpdatingOrderId,
    ] = useState<string | null>(null)

    const loadOrders =
        useCallback(async () => {
            try {
                setError('')

                const {
                    data: { session },
                } =
                    await supabase.auth.getSession()

                if (!session) {
                    setError(
                        'Your admin session has expired.',
                    )

                    setLoading(false)
                    return
                }

                const response =
                    await fetch(
                        '/api/admin/production-orders',
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        },
                    )

                const json =
                    await response.json()

                if (
                    !response.ok ||
                    !json.success
                ) {
                    throw new Error(
                        json.error ??
                        'Unable to load production orders',
                    )
                }

                setOrders(json.orders ?? [])
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Unable to load production orders',
                )
            } finally {
                setLoading(false)
            }
        }, [])

    const loadBlackouts =
        useCallback(async () => {
            try {
                const {
                    data: { session },
                } =
                    await supabase.auth.getSession()

                if (!session) {
                    setError(
                        'Your admin session has expired.',
                    )

                    setBlackoutsLoading(false)
                    return
                }

                const response =
                    await fetch(
                        '/api/admin/delivery-blackouts',
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        },
                    )

                const json =
                    await response.json()

                if (
                    !response.ok ||
                    !json.success
                ) {
                    throw new Error(
                        json.error ??
                        'Unable to load delivery blackouts',
                    )
                }

                setBlackouts(
                    json.blackouts ?? [],
                )
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Unable to load delivery blackouts',
                )
            } finally {
                setBlackoutsLoading(false)
            }
        }, [])
    const loadDeliverySettings =
        useCallback(async () => {
            try {
                const {
                    data: { session },
                } =
                    await supabase.auth.getSession()

                if (!session) {
                    throw new Error(
                        'Your admin session has expired.',
                    )
                }

                const response =
                    await fetch(
                        '/api/admin/delivery-settings',
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${session.access_token}`,
                            },
                        },
                    )

                const json =
                    await response.json()

                if (
                    !response.ok ||
                    !json.success ||
                    !json.settings
                ) {
                    throw new Error(
                        json.error ??
                        'Unable to load delivery settings',
                    )
                }

                setFirstSlotStartHour(
                    json.settings.first_slot_start_hour,
                )

                setLastSlotEndHour(
                    json.settings.last_slot_end_hour,
                )

                setImmediateDeliveryMinutes(
                    json.settings.immediate_delivery_minutes,
                )
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Unable to load delivery settings',
                )
            } finally {
                setDeliverySettingsLoading(false)
            }
        }, [])

    async function saveDeliverySettings() {
        try {
            setSavingDeliverySettings(true)
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    '/api/admin/delivery-settings',
                    {
                        method: 'PATCH',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body: JSON.stringify({
                            firstSlotStartHour,
                            lastSlotEndHour,
                        }),
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ??
                    'Unable to save delivery settings',
                )
            }

            await loadDeliverySettings()
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Unable to save delivery settings',
            )
        } finally {
            setSavingDeliverySettings(false)
        }
    }
    async function deleteBlackout(
        blackoutId: string,
    ) {
        try {
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    `/api/admin/delivery-blackouts?id=${encodeURIComponent(
                        blackoutId,
                    )}`,
                    {
                        method: 'DELETE',

                        headers: {
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ??
                    'Unable to remove delivery blackout',
                )
            }

            await loadBlackouts()
        } catch (deleteError) {
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : 'Unable to remove delivery blackout',
            )
        }
    }

    async function pauseDeliveriesNow() {
        try {
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    '/api/admin/delivery-blackouts',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body: JSON.stringify({
                            startsAt:
                                new Date().toISOString(),

                            endsAt:
                                null,

                            reason:
                                'Emergency pause',
                        }),
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ??
                    'Unable to pause deliveries',
                )
            }

            await loadBlackouts()
        } catch (pauseError) {
            setError(
                pauseError instanceof Error
                    ? pauseError.message
                    : 'Unable to pause deliveries',
            )
        }
    }

    async function resumeDeliveries() {
        if (!activeOpenEndedBlackout) {
            return
        }

        await deleteBlackout(
            activeOpenEndedBlackout.id,
        )
    }

    async function advanceOrder(
        order: ProductionOrder,
    ) {
        const action =
            nextActionByStatus[
            order.productionStatus
            ]

        if (!action) {
            return
        }

        try {
            setUpdatingOrderId(order.id)
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    '/api/admin/update-production-status',
                    {
                        method: 'PATCH',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body: JSON.stringify({
                            orderId: order.id,
                            nextStatus:
                                action.nextStatus,
                        }),
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ??
                    'Unable to update production status',
                )
            }

            await loadOrders()
        } catch (updateError) {
            setError(
                updateError instanceof Error
                    ? updateError.message
                    : 'Unable to update production status',
            )
        } finally {
            setUpdatingOrderId(null)
        }
    }
    async function cancelOrder(
        order: ProductionOrder,
    ) {
        const reason =
            window.prompt(
                'Please enter the cancellation reason:',
            )

        if (!reason?.trim()) {
            return
        }

        const confirmed =
            window.confirm(
                `Cancel order ${order.orderNumber}?`,
            )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingOrderId(order.id)
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    '/api/admin/cancel-production-order',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body: JSON.stringify({
                            orderId:
                                order.id,

                            reason:
                                reason.trim(),
                        }),
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ??
                    'Unable to cancel order',
                )
            }

            await loadOrders()
        } catch (cancelError) {
            setError(
                cancelError instanceof Error
                    ? cancelError.message
                    : 'Unable to cancel order',
            )
        } finally {
            setUpdatingOrderId(null)
        }
    }
    async function refundOrder(
        order: ProductionOrder,
    ) {
        const reason =
            window.prompt(
                'Please enter the refund reason:',
            )

        if (!reason?.trim()) {
            return
        }

        const confirmed =
            window.confirm(
                `Refund the full payment for order ${order.orderNumber}?`,
            )

        if (!confirmed) {
            return
        }

        try {
            setUpdatingOrderId(order.id)
            setError('')

            const {
                data: { session },
            } =
                await supabase.auth.getSession()

            if (!session) {
                throw new Error(
                    'Your admin session has expired.',
                )
            }

            const response =
                await fetch(
                    '/api/admin/refund-order',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body: JSON.stringify({
                            orderId:
                                order.id,

                            reason:
                                reason.trim(),
                        }),
                    },
                )

            const json =
                await response.json()

            if (
                !response.ok ||
                !json.success
            ) {
                throw new Error(
                    json.error ||
                    'Unable to refund order',
                )
            }

            await loadOrders()
        } catch (refundError) {
            setError(
                refundError instanceof Error
                    ? refundError.message
                    : 'Unable to refund order',
            )
        } finally {
            setUpdatingOrderId(null)
        }
    }
    useEffect(() => {
        void loadOrders()

        const refreshInterval =
            window.setInterval(
                () => {
                    void loadOrders()
                },
                5_000,
            )

        return () => {
            window.clearInterval(
                refreshInterval,
            )
        }
    }, [loadOrders])

    useEffect(() => {
        void loadBlackouts()
    }, [loadBlackouts])

    useEffect(() => {
        void loadDeliverySettings()
    }, [loadDeliverySettings])

    useEffect(() => {
        const timerInterval =
            window.setInterval(
                () => {
                    setNow(Date.now())
                },
                15_000,
            )

        return () => {
            window.clearInterval(
                timerInterval,
            )
        }
    }, [])

    if (loading) {
        return (
            <main className="productionPage">
                <div className="productionLoading">
                    Loading kitchen orders...
                </div>
            </main>
        )
    }

    const activeOrders =
        orders.filter(
            (order) =>
                order.productionStatus !==
                'delivered' &&
                order.productionStatus !==
                'cancelled',
        )

    return (
        <main className="productionPage">
            <header className="productionHeader">
                <div>
                    <p className="productionEyebrow">
                        Mais de Nata Operations
                    </p>

                    <h1>Production Board</h1>

                    <p className="productionSummary">
                        {activeOrders.length}{' '}
                        {activeOrders.length === 1
                            ? 'active order'
                            : 'active orders'}
                    </p>
                </div>
            </header>

            {error && (
                <div className="productionError">
                    {error}
                </div>
            )}

            <section className="deliveryAvailabilityCard">
                <div className="deliveryHoursSection">
                    <div className="deliveryHoursHeader">
                        <div>
                            <p className="productionEyebrow">
                                Delivery Hours
                            </p>

                            <h2>
                                Operating Hours
                            </h2>
                        </div>
                    </div>

                    {deliverySettingsLoading ? (
                        <p>
                            Loading delivery hours...
                        </p>
                    ) : (
                        <>
                            <div className="deliveryHoursControls">
                                <label>
                                    <span>Start</span>

                                    <select
                                        value={firstSlotStartHour}
                                        onChange={(event) =>
                                            setFirstSlotStartHour(
                                                Number(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    >
                                        {Array.from(
                                            { length: 24 },
                                            (_, index) => index,
                                        ).map((hour) => (
                                            <option
                                                key={hour}
                                                value={hour}
                                            >
                                                {String(hour).padStart(
                                                    2,
                                                    '0',
                                                )}
                                                :00
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    <span>Finish</span>

                                    <select
                                        value={lastSlotEndHour}
                                        onChange={(event) =>
                                            setLastSlotEndHour(
                                                Number(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                    >
                                        {Array.from(
                                            { length: 24 },
                                            (_, index) => index + 1,
                                        ).map((hour) => (
                                            <option
                                                key={hour}
                                                value={hour}
                                                disabled={
                                                    hour <=
                                                    firstSlotStartHour
                                                }
                                            >
                                                {String(hour).padStart(
                                                    2,
                                                    '0',
                                                )}
                                                :00
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <p className="deliveryHoursCutoff">
                                Within {immediateDeliveryMinutes}{' '}
                                minutes available until:{' '}
                                <strong>
                                    {(() => {
                                        const cutoffMinutes =
                                            lastSlotEndHour *
                                            60 -
                                            immediateDeliveryMinutes

                                        const cutoffHour =
                                            Math.floor(
                                                cutoffMinutes / 60,
                                            )

                                        const cutoffMinute =
                                            cutoffMinutes % 60

                                        return `${String(
                                            cutoffHour,
                                        ).padStart(
                                            2,
                                            '0',
                                        )}:${String(
                                            cutoffMinute,
                                        ).padStart(
                                            2,
                                            '0',
                                        )}`
                                    })()}
                                </strong>
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    void saveDeliverySettings()
                                }
                                disabled={savingDeliverySettings}
                            >
                                {savingDeliverySettings
                                    ? 'Saving...'
                                    : 'Save Hours'}
                            </button>
                        </>
                    )}
                </div>
                <div className="deliveryAvailabilityHeader">
                    <div>
                        <p className="productionEyebrow">
                            Delivery Availability
                        </p>

                        <h2>
                            Delivery Blackouts
                        </h2>
                    </div>

                    <div className="deliveryAvailabilityActions">
                        {activeOpenEndedBlackout ? (
                            <button
                                type="button"
                                onClick={() =>
                                    void resumeDeliveries()
                                }
                            >
                                Resume Deliveries
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    void pauseDeliveriesNow()
                                }
                            >
                                Pause Deliveries Now
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                setShowBlackoutForm(
                                    !showBlackoutForm,
                                )
                            }
                        >
                            {showBlackoutForm
                                ? 'Cancel'
                                : '+ Block Delivery Period'}
                        </button>
                    </div>
                </div>
                {showBlackoutForm && (
                    <form
                        className="deliveryBlackoutForm"
                        onSubmit={async (event) => {
                            event.preventDefault()

                            if (
                                !blackoutDate ||
                                !blackoutStartTime ||
                                !blackoutEndTime
                            ) {
                                setError(
                                    'Please select a date, start time and end time.',
                                )
                                return
                            }

                            try {
                                setSavingBlackout(true)
                                setError('')

                                const {
                                    data: { session },
                                } =
                                    await supabase.auth.getSession()

                                if (!session) {
                                    throw new Error(
                                        'Your admin session has expired.',
                                    )
                                }

                                const startsAt =
                                    new Date(
                                        `${blackoutDate}T${blackoutStartTime}:00`,
                                    )

                                const endsAt =
                                    new Date(
                                        `${blackoutDate}T${blackoutEndTime}:00`,
                                    )

                                if (
                                    endsAt.getTime() <=
                                    startsAt.getTime()
                                ) {
                                    throw new Error(
                                        'End time must be after start time.',
                                    )
                                }

                                const response =
                                    await fetch(
                                        '/api/admin/delivery-blackouts',
                                        {
                                            method: 'POST',

                                            headers: {
                                                'Content-Type':
                                                    'application/json',

                                                Authorization:
                                                    `Bearer ${session.access_token}`,
                                            },

                                            body: JSON.stringify({
                                                startsAt:
                                                    startsAt.toISOString(),

                                                endsAt:
                                                    endsAt.toISOString(),

                                                reason:
                                                    blackoutReason,
                                            }),
                                        },
                                    )

                                const json =
                                    await response.json()

                                if (
                                    !response.ok ||
                                    !json.success
                                ) {
                                    throw new Error(
                                        json.error ??
                                        'Unable to create delivery blackout',
                                    )
                                }

                                setBlackoutDate('')
                                setBlackoutStartTime('')
                                setBlackoutEndTime('')
                                setBlackoutReason('')
                                setShowBlackoutForm(false)

                                await loadBlackouts()
                            } catch (saveError) {
                                setError(
                                    saveError instanceof Error
                                        ? saveError.message
                                        : 'Unable to create delivery blackout',
                                )
                            } finally {
                                setSavingBlackout(false)
                            }
                        }}
                    >
                        <div>
                            <label>
                                Date

                                <input
                                    type="date"
                                    value={blackoutDate}
                                    onChange={(event) =>
                                        setBlackoutDate(
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label>
                                From

                                <input
                                    type="time"
                                    value={blackoutStartTime}
                                    onChange={(event) =>
                                        setBlackoutStartTime(
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Until

                                <input
                                    type="time"
                                    value={blackoutEndTime}
                                    onChange={(event) =>
                                        setBlackoutEndTime(
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label>
                                Reason

                                <input
                                    type="text"
                                    value={blackoutReason}
                                    onChange={(event) =>
                                        setBlackoutReason(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={savingBlackout}
                        >
                            {savingBlackout
                                ? 'Saving...'
                                : 'Block Deliveries'}
                        </button>
                    </form>
                )}

                {blackoutsLoading ? (
                    <p>
                        Loading delivery availability...
                    </p>
                ) : blackouts.length === 0 ? (
                    <p>
                        No delivery blackout periods scheduled.
                    </p>
                ) : (
                    <div className="deliveryBlackoutList">
                        {blackouts.map((blackout) => (
                            <div
                                key={blackout.id}
                                className="deliveryBlackoutItem"
                            >
                                <strong>
                                    {new Date(
                                        blackout.starts_at,
                                    ).toLocaleString()}
                                </strong>

                                <span>
                                    {' → '}

                                    {blackout.ends_at
                                        ? new Date(
                                            blackout.ends_at,
                                        ).toLocaleString()
                                        : 'Until reopened'}
                                </span>

                                {blackout.reason && (
                                    <p>
                                        {blackout.reason}
                                    </p>
                                )}
                                {blackout.ends_at !== null && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void deleteBlackout(
                                                blackout.id,
                                            )
                                        }
                                    >
                                        Remove Blackout
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="productionBoard">
                {statusDefinitions.map(
                    (definition) => {
                        const statusOrders =
                            activeOrders.filter(
                                (order) =>
                                    order.productionStatus ===
                                    definition.status,
                            )

                        return (
                            <section
                                key={definition.status}
                                className={`productionStage productionStage-${definition.status}`}
                            >
                                <header className="productionStageHeader">
                                    <h2>
                                        {definition.label}
                                    </h2>

                                    <span>
                                        {statusOrders.length}
                                    </span>
                                </header>

                                <div className="productionStageOrders">
                                    {statusOrders.length ===
                                        0 ? (
                                        <p className="productionEmpty">
                                            {
                                                definition.emptyMessage
                                            }
                                        </p>
                                    ) : (
                                        statusOrders.map(
                                            (order) => (
                                                <article
                                                    key={order.id}
                                                    className="productionOrderCard"
                                                >
                                                    <div className="productionOrderTop">
                                                        <span
                                                            className={`productionChannel ${getChannelClass(
                                                                order.salesChannel,
                                                            )}`}
                                                        >
                                                            {getChannelLabel(
                                                                order.salesChannel,
                                                            )}
                                                        </span>

                                                        <span className="productionElapsed">
                                                            {formatElapsedTime(
                                                                getStatusStartedAt(order),
                                                                now,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p className="productionOrderReference">
                                                        {getShortOrderNumber(
                                                            order.orderNumber,
                                                        )}
                                                    </p>

                                                    <div className="productionItems">
                                                        {order.items.length === 0 ? (
                                                            <p className="productionItemsEmpty">
                                                                No order items found
                                                            </p>
                                                        ) : (
                                                            order.items.map(
                                                                (item, index) => (
                                                                    <div
                                                                        key={`${order.id}-${index}`}
                                                                        className="productionItem"
                                                                    >
                                                                        <strong>
                                                                            {item.quantity} ×
                                                                        </strong>

                                                                        <span>
                                                                            {item.productName}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                    {(
                                                        order.productionStatus === 'ready' ||
                                                        order.productionStatus === 'collected'
                                                    ) && (
                                                            <div className="productionCourierPanel">
                                                                <strong>
                                                                    Wolt courier
                                                                </strong>

                                                                {order.productionStatus === 'ready' && (
                                                                    <>
                                                                        <p>
                                                                            {order.woltDeliveryStatus ===
                                                                                'order.pickup_arrival'
                                                                                ? 'Courier has arrived for collection'
                                                                                : order.woltPickupEta
                                                                                    ? `Pickup ETA: ${new Intl.DateTimeFormat(
                                                                                        'en-GB',
                                                                                        {
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit',
                                                                                        },
                                                                                    ).format(
                                                                                        new Date(
                                                                                            order.woltPickupEta,
                                                                                        ),
                                                                                    )}`
                                                                                    : 'Courier requested'}
                                                                        </p>

                                                                        {order.woltCourierVehicleType && (
                                                                            <p>
                                                                                Vehicle:{' '}
                                                                                {order.woltCourierVehicleType}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {order.productionStatus === 'collected' && (
                                                                    <p>
                                                                        Courier has collected the order
                                                                    </p>
                                                                )}

                                                                {order.woltTrackingUrl && (
                                                                    <a
                                                                        href={order.woltTrackingUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        View courier tracking
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    {nextActionByStatus[
                                                        order.productionStatus
                                                    ] &&
                                                        !(
                                                            order.salesChannel === 'ConsumerWebsite' &&
                                                            order.productionStatus === 'ready'
                                                        ) && (
                                                            <button
                                                                type="button"
                                                                className="productionActionButton"
                                                                disabled={
                                                                    updatingOrderId === order.id
                                                                }
                                                                onClick={() =>
                                                                    void advanceOrder(order)
                                                                }
                                                            >
                                                                {updatingOrderId === order.id
                                                                    ? 'Updating...'
                                                                    : nextActionByStatus[
                                                                        order.productionStatus
                                                                    ]?.label}
                                                            </button>
                                                        )}
                                                    {order.salesChannel === 'ConsumerWebsite' &&
                                                        order.paymentStatus === 'Paid' && (
                                                            <button
                                                                type="button"
                                                                className="productionActionButton"
                                                                disabled={
                                                                    updatingOrderId === order.id
                                                                }
                                                                onClick={() =>
                                                                    void refundOrder(order)
                                                                }
                                                            >
                                                                Refund customer
                                                            </button>
                                                        )}
                                                    {[
                                                        'new',
                                                        'accepted',
                                                        'baking',
                                                        'packing',
                                                        'ready',
                                                    ].includes(
                                                        order.productionStatus,
                                                    ) && (
                                                            <button
                                                                type="button"
                                                                className="productionCancelButton"
                                                                disabled={
                                                                    updatingOrderId === order.id
                                                                }
                                                                onClick={() =>
                                                                    void cancelOrder(order)
                                                                }
                                                            >
                                                                Cancel order
                                                            </button>
                                                        )}
                                                </article>
                                            ),
                                        )
                                    )}
                                </div>
                            </section>
                        )
                    },
                )}
            </div>
        </main>
    )
}