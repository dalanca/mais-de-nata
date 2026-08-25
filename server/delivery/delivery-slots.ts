export type DeliverySlot = {
    startsAt: string
    endsAt: string
    cutoffAt: string
}

const PRAGUE_TIME_ZONE =
    'Europe/Prague'

function getPragueUtcOffsetMinutes(
    date: Date,
) {
    const parts =
        new Intl.DateTimeFormat(
            'en-GB',
            {
                timeZone:
                    PRAGUE_TIME_ZONE,

                timeZoneName:
                    'longOffset',

                year:
                    'numeric',
            },
        )
            .formatToParts(date)

    const timeZoneName =
        parts.find(
            (part) =>
                part.type ===
                'timeZoneName',
        )?.value

    if (!timeZoneName) {
        throw new Error(
            'Unable to determine Prague timezone offset',
        )
    }

    const match =
        timeZoneName.match(
            /GMT([+-])(\d{2}):(\d{2})/,
        )

    if (!match) {
        throw new Error(
            `Unexpected Prague timezone offset: ${timeZoneName}`,
        )
    }

    const sign =
        match[1] === '+'
            ? 1
            : -1

    const hours =
        Number(match[2])

    const minutes =
        Number(match[3])

    return (
        sign *
        (hours * 60 + minutes)
    )
}

function createPragueDate(
    date: string,
    hour: number,
) {
    const [
        year,
        month,
        day,
    ] =
        date
            .split('-')
            .map(Number)

    if (
        !year ||
        !month ||
        !day
    ) {
        throw new Error(
            `Invalid delivery date: ${date}`,
        )
    }

    // Use midday to determine whether
    // this Prague date is CET or CEST.
    const referenceDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                12,
                0,
                0,
            ),
        )

    const offsetMinutes =
        getPragueUtcOffsetMinutes(
            referenceDate,
        )

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            0,
            0,
        ) -
        offsetMinutes *
        60 *
        1000,
    )
}

export function createDeliverySlot(
    date: string,
    startHour: number,
): DeliverySlot {
    const startsAt =
        createPragueDate(
            date,
            startHour,
        )

    const endsAt =
        new Date(
            startsAt.getTime() +
            60 * 60 * 1000,
        )

    const cutoffAt =
        new Date(
            startsAt.getTime() -
            60 * 60 * 1000,
        )

    return {
        startsAt:
            startsAt.toISOString(),

        endsAt:
            endsAt.toISOString(),

        cutoffAt:
            cutoffAt.toISOString(),
    }
}

export function isDeliverySlotPastCutoff(
    slot: DeliverySlot,
    now = new Date(),
) {
    return (
        now.getTime() >=
        new Date(
            slot.cutoffAt,
        ).getTime()
    )
}
export function isImmediateDeliveryAvailable(
    lastSlotEndHour: number,
    immediateDeliveryMinutes: number,
    now = new Date(),
) {
    const parts =
        new Intl.DateTimeFormat(
            'en-GB',
            {
                timeZone:
                    PRAGUE_TIME_ZONE,

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                hourCycle:
                    'h23',
            },
        )
            .formatToParts(now)

    const hour =
        Number(
            parts.find(
                (part) =>
                    part.type === 'hour',
            )?.value,
        )

    const minute =
        Number(
            parts.find(
                (part) =>
                    part.type === 'minute',
            )?.value,
        )

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute)
    ) {
        return false
    }

    const minutesSinceMidnight =
        hour * 60 + minute

    const closingMinutes =
        lastSlotEndHour * 60

    const cutoffMinutes =
        closingMinutes -
        immediateDeliveryMinutes

    return (
        minutesSinceMidnight <
        cutoffMinutes
    )
}
