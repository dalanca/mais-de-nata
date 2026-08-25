import {
    checkDeliverySlotAvailability,
} from '../server/delivery/delivery-availability.js'
import {
    isImmediateDeliveryAvailable,
} from '../server/delivery/delivery-slots.js'
import {
    supabaseAdmin,
} from '../server/database/supabase.js'

export default async function handler(
    req: any,
    res: any,
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        })
    }

    const date =
        typeof req.query?.date === 'string'
            ? req.query.date
            : ''

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return res.status(400).json({
            success: false,
            error: 'A valid date is required',
        })
    }

    try {
        const {
            data: settings,
            error: settingsError,
        } = await supabaseAdmin
            .from('delivery_settings')
            .select(
                `
          first_slot_start_hour,
          last_slot_end_hour,
          immediate_delivery_minutes
        `,
            )
            .eq('id', true)
            .single()

        if (settingsError || !settings) {
            throw (
                settingsError ??
                new Error(
                    'Unable to load delivery settings',
                )
            )
        }

        const firstSlotStartHour =
            settings.first_slot_start_hour

        const lastSlotStartHour =
            settings.last_slot_end_hour - 1
        const slots =
            await Promise.all(
                Array.from(
                    {
                        length:
                            lastSlotStartHour -
                            firstSlotStartHour +
                            1,
                    },
                    (_, index) =>
                        firstSlotStartHour +
                        index,
                ).map(
                    async (startHour) => {
                        const result =
                            await checkDeliverySlotAvailability(
                                date,
                                startHour,
                            )

                        return {
                            startHour,

                            label:
                                `${String(startHour).padStart(2, '0')}:00–${String(
                                    startHour + 1,
                                ).padStart(2, '0')}:00`,

                            startsAt:
                                result.slot.startsAt,

                            endsAt:
                                result.slot.endsAt,

                            cutoffAt:
                                result.slot.cutoffAt,

                            available:
                                result.available,

                            reason:
                                result.reason,
                        }
                    },
                ),
            )

        return res.status(200).json({
            success: true,
            date,

            immediateAvailable:
                isImmediateDeliveryAvailable(
                    settings.last_slot_end_hour,
                    settings.immediate_delivery_minutes,
                ),

            slots,
        })
    } catch (error) {
        console.error(
            'Delivery availability API failed:',
            error,
        )

        return res.status(500).json({
            success: false,
            error:
                'Unable to load delivery availability',
        })
    }
}