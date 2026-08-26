import {
    supabaseAdmin,
} from '../server/database/supabase.js'

import {
    sendLaunchWinnerNotification,
} from '../server/launch/send-launch-winner-notification.js'

export default async function handler(
    req: any,
    res: any,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        })
    }

    try {
        const registrationNumber =
            Number(req.body?.registrationNumber)

        if (
            !Number.isInteger(registrationNumber) ||
            registrationNumber <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'A valid registration number is required',
            })
        }

        const {
            data: registration,
            error,
        } = await supabaseAdmin
            .from('launch_registrations')
            .select('id, is_winner')
            .eq(
                'registration_number',
                registrationNumber,
            )
            .single()

        if (error) {
            console.error(
                'Launch winner lookup failed:',
                error,
            )

            return res.status(500).json({
                success: false,
                message:
                    `Launch registration lookup failed: ${error.message}`,
            })
        }

        if (!registration) {
            return res.status(404).json({
                success: false,
                message:
                    'Launch registration not found',
            })
        }

        if (!registration.is_winner) {
            return res.status(400).json({
                success: false,
                message:
                    'Registration is not a winner',
            })
        }

        const result =
            await sendLaunchWinnerNotification({
                registrationId:
                    registration.id,

                language: 'en',
            })

        return res.status(200).json({
            success: true,
            alreadySent:
                result.alreadySent,
            expiresAt:
                result.expiresAt ?? null,
        })
    } catch (error) {
        console.error(
            'Launch winner test failed:',
            error,
        )

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : 'Unable to send winner email',
        })
    }
}