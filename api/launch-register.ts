import {
    supabaseAdmin,
} from '../server/database/supabase.js'

import {
    sendLaunchWinnerNotification,
} from '../server/launch/send-launch-winner-notification.js'

type LaunchRegistrationResult = {
    registration_id: string
    registration_number: number
    already_registered: boolean
    is_winner: boolean
    prize_box_size: number | null
}

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
        const firstName =
            typeof req.body?.firstName === 'string'
                ? req.body.firstName.trim()
                : ''

        const email =
            typeof req.body?.email === 'string'
                ? req.body.email.trim().toLowerCase()
                : ''

        const language =
            req.body?.language === 'en'
                ? 'en'
                : 'cs'

        if (!firstName) {
            return res.status(400).json({
                success: false,
                message: 'First name is required',
            })
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            })
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address',
            })
        }

        const {
            data,
            error,
        } = await supabaseAdmin.rpc(
            'register_launch_customer',
            {
                p_first_name: firstName,
                p_email: email,
            },
        )

        if (error) {
            throw error
        }

        const registration =
            data?.[0] as
            | LaunchRegistrationResult
            | undefined

        if (!registration) {
            throw new Error(
                'Launch registration was not created',
            )
        }

        /*
         * Deliberately do not return:
         *
         * registration_number
         * is_winner
         * prize_box_size
         *
         * The customer must not be able to determine
         * the current registration sequence.
         */

        /*
         * If this registration is a winner, send the
         * winner notification automatically.
         *
         * The notification function is idempotent:
         * winner_contacted_at prevents duplicate emails.
         */
        if (registration.is_winner) {
            await sendLaunchWinnerNotification({
                registrationId:
                    registration.registration_id,
                language,
            })
        }

        if (registration.already_registered) {
            return res.status(200).json({
                success: true,
                alreadyRegistered: true,
                message:
                    'You are already on the Maisde Nata launch list.',
            })
        }

        return res.status(201).json({
            success: true,
            alreadyRegistered: false,
            message:
                'Welcome to the Mais de Nata launch list.',
        })
    } catch (error) {
        console.error(
            'Launch registration failed:',
            error,
        )

        return res.status(500).json({
            success: false,
            message:
                'Unable to complete your registration. Please try again.',
        })
    }
}