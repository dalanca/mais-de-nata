import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
import heroNata from '../assets/images/hero-nata.jpg'
import './Claim.css'

type ClaimState = {
    firstName: string
    prizeBoxSize: number
    claimExpiresAt: string
}

export default function Claim() {
    const { t, language } = useLanguage()
    const navigate = useNavigate()

    const [claim, setClaim] =
        useState<ClaimState | null>(null)

    const [isLoading, setIsLoading] =
        useState(true)

    const [errorMessage, setErrorMessage] =
        useState('')

    useEffect(() => {
        async function validateClaim() {
            const searchParams =
                new URLSearchParams(
                    window.location.search,
                )

            const token =
                searchParams.get('token')

            if (!token) {
                setErrorMessage(
                    t.claimInvalid,
                )

                setIsLoading(false)
                return
            }

            try {
                const response =
                    await fetch(
                        '/api/launch-claim',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                            },

                            body: JSON.stringify({
                                token,
                            }),
                        },
                    )

                const data =
                    await response.json() as {
                        success: boolean
                        firstName?: string
                        prizeBoxSize?: number
                        claimExpiresAt?: string
                        message?: string
                    }

                if (!response.ok || !data.success) {
                    if (response.status === 409) {
                        throw new Error(
                            t.claimAlreadyClaimed,
                        )
                    }

                    if (response.status === 410) {
                        throw new Error(
                            t.claimExpired,
                        )
                    }

                    if (
                        response.status === 400 ||
                        response.status === 403 ||
                        response.status === 404
                    ) {
                        throw new Error(
                            t.claimInvalid,
                        )
                    }

                    throw new Error(
                        t.claimUnableToValidate,
                    )
                }

                if (
                    !data.firstName ||
                    data.prizeBoxSize !== 4 ||
                    !data.claimExpiresAt
                ) {
                    throw new Error(
                        t.claimUnableToValidate,
                    )
                }

                setClaim({
                    firstName:
                        data.firstName,

                    prizeBoxSize:
                        data.prizeBoxSize,

                    claimExpiresAt:
                        data.claimExpiresAt,
                })
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : t.claimUnableToValidate,
                )
            } finally {
                setIsLoading(false)
            }
        }

        void validateClaim()
    }, [language])

    function handleClaim() {
        const searchParams =
            new URLSearchParams(
                window.location.search,
            )

        const token =
            searchParams.get('token')

        if (!token) {
            return
        }

        sessionStorage.setItem(
            'maisDeNataLaunchClaim',
            JSON.stringify({
                valid: true,
                prizeBoxSize: 4,
                token,
            }),
        )

        sessionStorage.setItem(
            'maisDeNataLaunchPrize',
            JSON.stringify({
                boxSize: 4,
                quantity: 1,
            }),
        )

        navigate('/checkout')
    }

    if (isLoading) {
        return (
            <>
                <SiteHeader />

                <main className="claimPage">
                    <section className="claimCard">
                        <p>
                            {t.claimValidating}
                        </p>
                    </section>
                </main>
            </>
        )
    }

    if (errorMessage || !claim) {
        return (
            <>
                <SiteHeader />

                <main className="claimPage">
                    <section className="claimCard">
                        <p className="claimEyebrow">
                            MAIS DE NATA
                        </p>

                        <h1>
                            {t.claimUnavailableTitle}
                        </h1>

                        <p className="claimIntro">
                            {errorMessage}
                        </p>
                    </section>
                </main>
            </>
        )
    }

    return (
        <>
            <SiteHeader />

            <main className="claimPage">
                <section className="claimGrid">
                    <div className="claimContent">
                        <p className="claimEyebrow">
                            <p className="claimEyebrow">
                                {t.claimEyebrow}
                            </p>
                        </p>

                        <h1>
                            {claim.firstName}, {t.claimWaiting}
                        </h1>

                        <p className="claimIntro">
                            {t.claimWonBox}
                        </p>

                        <div className="claimPrize">
                            <div>
                                <span>
                                    {t.claimBox}
                                </span>

                                <strong>
                                    4 Pastéis de Nata
                                </strong>
                            </div>

                            <div>
                                <span>
                                    {t.claimPrice}
                                </span>

                                <strong>
                                    0 Kč
                                </strong>
                            </div>
                        </div>

                        <p className="claimDeliveryNote">
                            {t.claimDeliveryNote}
                        </p>

                        <button
                            type="button"
                            className="claimButton"
                            onClick={handleClaim}
                        >
                            {t.claimChooseDelivery}
                        </button>
                    </div>

                    <div
                        className="claimVisual"
                        style={{
                            backgroundImage:
                                `url(${heroNata})`,
                        }}
                    />
                </section>
            </main>
        </>
    )
}