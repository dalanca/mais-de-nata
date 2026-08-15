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

    createdAt: string
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
                                                    {nextActionByStatus[
                                                        order.productionStatus
                                                    ] && (
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